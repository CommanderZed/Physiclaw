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

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Local modules
from core.memory import MemoryManager, clean_telemetry
from cli import ToolExecutor, Persona, SecurityViolation, SRE_WHITELIST, SECOPS_WHITELIST

# --- State (lazy init) -------------------------------------------------------

_memory: MemoryManager | None = None
_executor: ToolExecutor | None = None


def get_memory() -> MemoryManager:
    global _memory
    if _memory is None:
        _memory = MemoryManager()
    return _memory


def get_executor() -> ToolExecutor:
    global _executor
    if _executor is None:
        persona = os.getenv("PHYSICLAW_PERSONA", "sre").lower()
        _executor = ToolExecutor(persona=Persona.SRE if persona == "sre" else Persona.SECOPS)
    return _executor


# --- Request/Response models -------------------------------------------------

class GoalRequest(BaseModel):
    """Only goals are accepted. No tool name or direct tool request."""
    goal: str = Field(..., min_length=1, description="User intent / objective")
    persona: str | None = Field(default=None, description="sre | secops; overrides env")


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
    persona = persona.lower()
    if persona == "sre":
        # SRE: read-only infra only. We do not infer arbitrary tools from goal text;
        # we return the full SRE whitelist so the executor can allow only those.
        return list(SRE_WHITELIST)
    if persona == "secops":
        return list(SECOPS_WHITELIST)
    return []


# --- Lifespan -----------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    logging.getLogger(__name__).info("Physiclaw Bridge v%s starting", __version__)
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
async def submit_goal(req: GoalRequest) -> GoalResponse:
    """
    Accept a goal only. Tool selection is determined by the backend from persona.
    Returns the list of tools this persona is allowed to use (for display/logging).
    """
    persona = (req.persona or os.getenv("PHYSICLAW_PERSONA", "sre")).lower()
    if persona not in ("sre", "secops"):
        raise HTTPException(status_code=400, detail="persona must be 'sre' or 'secops'")

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
