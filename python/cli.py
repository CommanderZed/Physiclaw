"""
Physiclaw CLI — Tool execution with persona-based whitelisting and security guardrails.
The bridge (bridge.py) is the sole authority on which tools are allowed; this executor
enforces the whitelist and runs tools in a restricted subprocess (blast-radius isolation).
"""

from __future__ import annotations

__version__ = "0.1.1-alpha"

import os
import shlex
import subprocess
from enum import Enum
from typing import Any

# ENV keys we never pass to the tool subprocess (secrets, cloud creds, etc.)
_STRIPPED_ENV_PREFIXES = (
    "AWS_", "AZURE_", "GCP_", "GOOGLE_", "OPENAI_", "ANTHROPIC_", "API_KEY", "SECRET",
    "KUBECONFIG", "KUBE_", "VAULT_", "TOKEN", "PASSWORD", "CREDENTIAL", "PRIVATE_KEY",
    "SLACK_", "DISCORD_", "TELEGRAM_", "POSTHOG", "SENTRY_", "STRIPE_",
)
# Minimal safe env for the restricted subprocess.
_SAFE_ENV_KEYS = frozenset({"PATH", "HOME", "USER", "LANG", "LC_ALL", "TERM", "PHYSICLAW_PERSONA"})

# Persona tool whitelists. Only these tools may run for the given persona.
SRE_WHITELIST = frozenset({
    "kubectl-get",
    "kubectl get",
    "terraform-plan",
    "terraform plan",
    "log-aggregator",
    "prometheus-query",
})
SECOPS_WHITELIST = frozenset({
    "nmap",
    "bandit-scan",
    "bandit",
    "iam-inspect",
    "vault-read",
})

# Normalize for lookup: lowercase, single spaces.
def _norm(tool: str) -> str:
    return " ".join(tool.lower().split())


class SecurityViolation(Exception):
    """Raised when a tool is not allowed for the active persona (blast-radius guard)."""
    def __init__(self, tool: str, persona: str, message: str | None = None):
        self.tool = tool
        self.persona = persona
        self.message = message or (
            f"SecurityViolation: tool '{tool}' is not in {persona} whitelist. "
            "Execution blocked."
        )
        super().__init__(self.message)


class Persona(str, Enum):
    SRE = "sre"
    SECOPS = "secops"


class ToolExecutor:
    """
    Executes tools only if they are on the persona whitelist.
    Strict whitelisting: if persona is SRE, only SRE_WHITELIST is allowed.
    """

    def __init__(self, persona: Persona | str = Persona.SRE):
        if isinstance(persona, str):
            persona = Persona(persona.lower())
        self.persona = persona
        self._whitelist = SRE_WHITELIST if persona == Persona.SRE else SECOPS_WHITELIST

    def allowed(self, tool: str) -> bool:
        n = _norm(tool)
        return any(n == _norm(t) or n in _norm(t) or _norm(t) in n for t in self._whitelist)

    def execute(self, tool: str, *args: Any, **kwargs: Any) -> dict[str, Any]:
        """
        Run the tool only if it is whitelisted for the current persona.
        Executes in a restricted subprocess with a clean environment (no sensitive ENV).
        Returns a result dict or raises SecurityViolation.
        """
        if not self.allowed(tool):
            raise SecurityViolation(tool, self.persona.value)
        return self._run_isolated(tool, *args, **kwargs)

    def _clean_env(self) -> dict[str, str]:
        """Build minimal env for subprocess: only safe keys, no secrets."""
        out: dict[str, str] = {}
        for key in _SAFE_ENV_KEYS:
            val = os.environ.get(key)
            if val is not None:
                out[key] = val
        # Strip any key that looks like secrets
        for k, v in os.environ.items():
            if k in out:
                continue
            up = k.upper()
            if any(up.startswith(p) for p in _STRIPPED_ENV_PREFIXES):
                continue
            if "KEY" in up or "SECRET" in up or "TOKEN" in up or "PASSWORD" in up:
                continue
            out[k] = v
        out["PHYSICLAW_PERSONA"] = self.persona.value
        return out

    def _tool_to_argv(self, tool: str, *args: Any) -> list[str]:
        """Map whitelisted tool name to command argv. Prefer explicit binary + args."""
        n = _norm(tool)
        # Map known tools to [binary, ...args]
        if "kubectl" in n and "get" in n:
            return ["kubectl", "get"] + [str(a) for a in args]
        if "terraform" in n and "plan" in n:
            return ["terraform", "plan"] + [str(a) for a in args]
        if "nmap" in n:
            return ["nmap"] + [str(a) for a in args]
        if "bandit" in n:
            return ["bandit"] + [str(a) for a in args]
        # Fallback: treat tool as a single command, args appended
        return shlex.split(tool) + [str(a) for a in args]

    def _run_isolated(self, tool: str, *args: Any, **kwargs: Any) -> dict[str, Any]:
        """Run whitelisted tool in a restricted subprocess: clean env, timeout, no inherited secrets."""
        argv = self._tool_to_argv(tool, *args)
        if not argv:
            return {"ok": False, "error": "empty command", "stdout": "", "stderr": ""}
        env = self._clean_env()
        timeout_sec = kwargs.get("timeout") if isinstance(kwargs.get("timeout"), (int, float)) else 300
        try:
            result = subprocess.run(
                argv,
                env=env,
                capture_output=True,
                text=True,
                timeout=timeout_sec,
                cwd=os.environ.get("PHYSICLAW_CWD") or os.getcwd(),
            )
            return {
                "ok": result.returncode == 0,
                "returncode": result.returncode,
                "stdout": result.stdout or "",
                "stderr": result.stderr or "",
            }
        except FileNotFoundError as e:
            return {"ok": False, "error": f"binary not found: {argv[0]}", "stdout": "", "stderr": str(e)}
        except subprocess.TimeoutExpired:
            return {"ok": False, "error": "command timed out", "stdout": "", "stderr": ""}
        except Exception as e:
            return {"ok": False, "error": str(e), "stdout": "", "stderr": ""}


def get_executor(persona: str | None = None) -> ToolExecutor:
    p = (persona or os.getenv("PHYSICLAW_PERSONA", "sre")).lower()
    return ToolExecutor(persona=Persona.SRE if p == "sre" else Persona.SECOPS)
