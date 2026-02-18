"""
Physiclaw RPC bridge (Node → Python). FastAPI service.

Security boundary: The Node.js frontend cannot request a tool by name. It can only
send a 'goal'. The Python layer is the sole authority on tool whitelisting based
on the active persona. All tool resolution and execution decisions happen here.
"""

from __future__ import annotations

__version__ = "0.1.1-alpha"

import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

# Local modules
from core.audit import audit_log
from core.memory import MemoryManager, clean_telemetry
from cli import (
    DATA_ARCHITECT_WHITELIST,
    SECOPS_WHITELIST,
    SRE_WHITELIST,
    Persona,
    SecurityViolation,
    ToolExecutor,
)

# --- State (lazy init) -------------------------------------------------------

_memory: MemoryManager | None = None
_executor: ToolExecutor | None = None
_API_KEY_MAP: dict[str, set[str]] | None = None


def get_memory() -> MemoryManager:
    global _memory
    if _memory is None:
        _memory = MemoryManager()
    return _memory


def get_executor() -> ToolExecutor:
    global _executor
    if _executor is None:
        from cli import _normalize_persona_str
        p = _normalize_persona_str(os.getenv("PHYSICLAW_PERSONA", "sre"))
        _executor = ToolExecutor(persona=Persona(p))
    return _executor


def _load_api_key_map() -> dict[str, set[str]]:
    """
    Parse PHYSICLAW_API_KEYS into { persona: {keys...} }.
    Format: "sre:KEY_SRE,secops:KEY_SECOPS,data_architect:KEY_DATA" or "*:KEY" for any persona.
    """
    global _API_KEY_MAP
    if _API_KEY_MAP is not None:
        return _API_KEY_MAP
    raw = os.getenv("PHYSICLAW_API_KEYS", "").strip()
    mapping: dict[str, set[str]] = {}
    if raw:
        from cli import _normalize_persona_str
        for part in raw.split(","):
            part = part.strip()
            if not part:
                continue
            if ":" in part:
                persona_raw, key = part.split(":", 1)
                persona = _normalize_persona_str(persona_raw)
            else:
                persona = "*"
                key = part
            if not key:
                continue
            mapping.setdefault(persona, set()).add(key)
    _API_KEY_MAP = mapping
    return mapping


def _auth_required() -> bool:
    v = os.getenv("PHYSICLAW_REQUIRE_AUTH", "").strip().lower()
    return v in ("1", "true", "yes", "required")


def _validate_jwt(request: Request, persona: str) -> bool:
    """Optional local JWT auth (HS256, on-prem only).

    Enabled when PHYSICLAW_JWT_SECRET is set. Expects:
    - Authorization: Bearer <jwt>
    - Claims: optional `persona` (or `role`) matching requested persona,
      and optional `scope` including `physiclaw:goal` or `physiclaw:*`.
    """
    secret = os.getenv("PHYSICLAW_JWT_SECRET", "").strip()
    if not secret:
        return False
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        return False
    token = auth.split(" ", 1)[1].strip()
    if not token:
        return False
    try:
        import jwt  # type: ignore[import]
    except Exception:
        return False
    try:
        claims = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
    except Exception:
        return False

    claim_persona = str((claims.get("persona") or claims.get("role") or "")).strip().lower()
    if claim_persona and claim_persona != persona:
        return False

    scope = claims.get("scope")
    if scope:
        scopes = str(scope).split()
        if "physiclaw:goal" not in scopes and "physiclaw:*" not in scopes:
            return False

    return True


def _is_authorized(request: Request, persona: str) -> bool:
    """
    Local-first auth:
    - PHYSICLAW_API_KEYS="sre:KEY_SRE,secops:KEY_SECOPS,data_architect:KEY_DATA"
    - Header: X-Physiclaw-Key: <key>
    - Optional: PHYSICLAW_JWT_SECRET + Authorization: Bearer <jwt>
    - If PHYSICLAW_REQUIRE_AUTH=1, a valid JWT or API key must be present and mapped.
    - If not required but keys are set, a provided key/JWT must still be valid; missing creds are allowed.
    """
    # Prefer JWT if configured and present
    if _validate_jwt(request, persona):
        return True

    keys_map = _load_api_key_map()
    header_key = request.headers.get("x-physiclaw-key")

    # No keys configured
    if not keys_map:
        return not _auth_required()

    allowed = set()
    allowed.update(keys_map.get(persona, set()))
    allowed.update(keys_map.get("*", set()))

    if _auth_required():
        if not header_key or header_key not in allowed:
            return False
        return True

    # Not required: if key provided, it must be valid; if missing, allow.
    if header_key is None:
        return True
    return header_key in allowed


# --- Request/Response models -------------------------------------------------

class GoalRequest(BaseModel):
    """Only goals are accepted. No tool name or direct tool request."""
    goal: str = Field(..., min_length=1, description="User intent / objective")
    persona: str | None = Field(default=None, description="sre | secops | data_architect; overrides env")


class GoalResponse(BaseModel):
    """Bridge response: allowed steps derived from goal by Python (persona-based)."""
    goal: str
    persona: str
    allowed_tools: list[str] = Field(..., description="Tools this persona may use for this goal")
    message: str = Field(default="Goal accepted; tool selection is backend-authoritative.")


# --- Tool resolution (Python is sole authority) -------------------------------

def resolve_goal_to_tools(goal: str, persona: str) -> list[str]:
    """
    Map a goal to the subset of tools this persona is allowed to use.
    Node never sends tool names; we derive them from goal + whitelist.
    """
    from cli import _normalize_persona_str
    p = _normalize_persona_str(persona)
    if p == "sre":
        return list(SRE_WHITELIST)
    if p == "secops":
        return list(SECOPS_WHITELIST)
    if p == "data_architect":
        return list(DATA_ARCHITECT_WHITELIST)
    return []


# --- Lifespan -----------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    logging.getLogger(__name__).info("Physiclaw Bridge v%s starting", __version__)
    try:
        from security.watchdog import start_egress_watchdog
        start_egress_watchdog(interval_sec=5.0)
    except Exception as e:
        logging.getLogger(__name__).warning("Egress watchdog not started: %s", e)
    get_memory()
    yield
    # optional: close L2/L3 connections
    global _memory
    _memory = None


# --- App ---------------------------------------------------------------------

app = FastAPI(
    title="Physiclaw Bridge",
    description="Goal-only RPC. Node cannot request tools; Python enforces persona whitelist.",
    version=__version__,
    lifespan=lifespan,
)


@app.post("/goal", response_model=GoalResponse)
async def submit_goal(req: GoalRequest, request: Request) -> GoalResponse:
    """
    Accept a goal only. Tool selection is determined by the backend from persona.
    Returns the list of tools this persona is allowed to use (for display/logging).
    """
    from cli import _normalize_persona_str
    raw = (req.persona or os.getenv("PHYSICLAW_PERSONA", "sre")).strip().lower()
    persona = _normalize_persona_str(raw)
    if persona not in ("sre", "secops", "data_architect"):
        raise HTTPException(status_code=400, detail="persona must be 'sre', 'secops', or 'data_architect'")

    if not _is_authorized(request, persona):
        audit_log("auth_denied", persona=persona)
        has_api_key = bool(request.headers.get("x-physiclaw-key"))
        has_jwt = bool(request.headers.get("authorization") or request.headers.get("Authorization"))
        status = 401 if not (has_api_key or has_jwt) else 403
        raise HTTPException(status_code=status, detail="invalid or unauthorized credentials for persona")

    audit_log("goal", persona=persona, goal_len=len(req.goal))

    # Store goal in memory (scrub telemetry first)
    memory = get_memory()
    safe_goal = clean_telemetry(req.goal)
    memory.l1.put(f"goal:{id(req)}", safe_goal)
    memory.l2.add(safe_goal, tags=f"persona:{persona}")

    allowed = resolve_goal_to_tools(req.goal, persona)
    return GoalResponse(
        goal=req.goal,
        persona=persona,
        allowed_tools=allowed,
    )


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "physiclaw-bridge", "version": __version__}


@app.get("/metrics", response_class=PlainTextResponse)
async def metrics() -> str:
    """Prometheus text exposition (Phase 2). No egress; scrape locally."""
    from core.audit import get_prometheus_metrics
    return get_prometheus_metrics()


@app.get("/memory/status")
async def memory_status() -> dict[str, Any]:
    """L1/L2/L3 status for UI sidebar (e.g. SQLite connected, LanceDB indexed)."""
    mem = get_memory()
    out: dict[str, Any] = {
        "l1": "connected",
        "l2": "connected",
        "l3": "connected" if mem.l3 else "disabled",
    }
    if mem.l3:
        try:
            # LanceDB: some versions use count_rows() or len(list(to_batches()))
            tbl = getattr(mem.l3, "_table", None)
            if tbl is not None and hasattr(tbl, "count_rows"):
                out["l3_rows"] = tbl.count_rows()
            else:
                out["l3_rows"] = None
        except Exception:
            out["l3"] = "error"
    return out


# --- Run ---------------------------------------------------------------------

if __name__ == "__main__":
    import logging
    import uvicorn
    port = int(os.getenv("PHYSICLAW_BRIDGE_PORT", "8000"))
    logging.basicConfig(level=logging.INFO)
    logging.info("Physiclaw Bridge v%s starting on 0.0.0.0:%s", __version__, port)
    uvicorn.run(app, host="0.0.0.0", port=port)
