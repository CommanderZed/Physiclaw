"""
Physiclaw CLI — Tool execution with persona-based whitelisting and security guardrails.
The bridge (bridge.py) is the sole authority on which tools are allowed; this executor
enforces the whitelist and prepares for isolation (bubblewrap / docker-in-docker).
"""

from __future__ import annotations

__version__ = "0.1.1-alpha"

import os
from enum import Enum
from typing import Any

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
        Returns a result dict or raises SecurityViolation.
        """
        if not self.allowed(tool):
            raise SecurityViolation(tool, self.persona.value)

        # TODO: Execution boundary / isolation
        # - Option A: Run in bubblewrap (bwrap) with minimal namespace/mounts.
        # - Option B: Run in a dedicated Docker container (docker-in-docker or sidecar)
        #   so that even a compromised tool cannot escape the runner.
        # Placeholder: direct execution. Replace with isolated runner once integrated.
        return self._run_isolated(tool, *args, **kwargs)

    def _run_isolated(self, tool: str, *args: Any, **kwargs: Any) -> dict[str, Any]:
        # TODO(blast-radius): Integrate bubblewrap or docker-in-docker here.
        # Example: subprocess.run(["bwrap", "--ro-bind", "/usr", "/usr", "--", tool, *args])
        # Or: docker run --rm -v workspace:/workspace runner-image tool args
        raise NotImplementedError(
            "Isolated execution not yet implemented. "
            "TODO: add bubblewrap or docker-in-docker runner for execution boundary."
        )


def get_executor(persona: str | None = None) -> ToolExecutor:
    p = (persona or os.getenv("PHYSICLAW_PERSONA", "sre")).lower()
    return ToolExecutor(persona=Persona.SRE if p == "sre" else Persona.SECOPS)
