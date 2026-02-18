"""
Hardened sandbox runner for Phase 1 (Sovereign Swarm).

When PHYSICLAW_SANDBOX=1 and bubblewrap (bwrap) is available, tool execution
runs inside a minimal Linux namespace sandbox: read-only system bind mounts,
no network (unless PHYSICLAW_SANDBOX_NET=1), writable /tmp only. Zero
cross-contamination between personas.
"""

from __future__ import annotations

import logging
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

BWRAP_BIN = "bwrap"


def bwrap_available() -> bool:
    """Return True if bubblewrap (bwrap) is on PATH and usable."""
    path = shutil.which(BWRAP_BIN)
    if not path:
        return False
    try:
        r = subprocess.run(
            [path, "--help"],
            capture_output=True,
            timeout=2,
        )
        out = (r.stdout or b"") + (r.stderr or b"")
        return b"bwrap" in out or b"usage" in out or r.returncode == 0
    except (subprocess.TimeoutExpired, OSError):
        return False


def _ro_bind_args() -> list[str]:
    """Build read-only bind args for a minimal root. Prefer /usr, /bin, /lib, /etc."""
    args: list[str] = []
    # Order matters: bind parent before child when overlapping
    for mount in ["/usr", "/bin", "/lib", "/lib64", "/etc"]:
        p = Path(mount)
        if p.exists():
            args.extend(["--ro-bind", str(p), str(p)])
    if not args:
        # Fallback: at least /usr (contains bin on many distros)
        args = ["--ro-bind", "/usr", "/usr"]
    return args


def run_in_bwrap(
    argv: list[str],
    env: dict[str, str] | None = None,
    cwd: str | None = None,
    timeout_sec: float | int = 300,
    allow_network: bool = False,
) -> dict[str, Any]:
    """
    Run argv in a bubblewrap sandbox. Returns same shape as ToolExecutor._run_isolated.
    """
    bwrap = shutil.which(BWRAP_BIN)
    if not bwrap:
        return {
            "ok": False,
            "error": "bwrap not found; install bubblewrap or set PHYSICLAW_SANDBOX=0",
            "stdout": "",
            "stderr": "",
        }

    # Minimal sandbox: ro-bind system dirs, dev, proc, tmpfs /tmp, no network
    bwrap_args = [
        bwrap,
        "--die-with-parent",
        "--new-session",
        *_ro_bind_args(),
        "--dev", "/dev",
        "--proc", "/proc",
        "--tmpfs", "/tmp",
        "--dir", "/run",
    ]
    if allow_network:
        bwrap_args.extend(["--unshare-all", "--share-net"])
    else:
        bwrap_args.append("--unshare-net")

    # Working directory: bind cwd read-only into sandbox so the command can read from it
    work = (cwd or os.getcwd()).strip() or "/tmp"
    if os.path.isabs(work) and Path(work).exists():
        bwrap_args.extend(["--ro-bind", work, work])
        bwrap_cwd = work
    else:
        bwrap_cwd = "/tmp"

    full_argv = bwrap_args + ["--"] + argv
    try:
        result = subprocess.run(
            full_argv,
            env=env or os.environ,
            cwd=bwrap_cwd,
            capture_output=True,
            text=True,
            timeout=timeout_sec,
        )
        return {
            "ok": result.returncode == 0,
            "returncode": result.returncode,
            "stdout": result.stdout or "",
            "stderr": result.stderr or "",
        }
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "command timed out", "stdout": "", "stderr": ""}
    except FileNotFoundError as e:
        return {"ok": False, "error": f"bwrap or command not found: {e}", "stdout": "", "stderr": ""}
    except Exception as e:
        return {"ok": False, "error": str(e), "stdout": "", "stderr": ""}


def sandbox_enabled() -> bool:
    """True if operator has enabled hardened sandbox (bwrap) for tool runs."""
    v = os.environ.get("PHYSICLAW_SANDBOX", "").strip().lower()
    return v in ("1", "true", "yes", "bwrap")


def sandbox_allow_network() -> bool:
    """True if sandbox is allowed to share network (e.g. for tools that need localhost)."""
    v = os.environ.get("PHYSICLAW_SANDBOX_NET", "").strip().lower()
    return v in ("1", "true", "yes")
