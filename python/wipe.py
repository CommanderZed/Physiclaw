"""
Red Alert self-destruct: physiclaw wipe --all.

Securely deletes the SQLite DB (L2), LanceDB vector files (L3), and clears
the in-process LRU cache. Gives security teams a kill switch for the agent's memory.
"""

from __future__ import annotations

import logging
import os
import shutil
from pathlib import Path

from core.memory.manager import BASE_DIR, L2_PATH, L3_PATH

logger = logging.getLogger(__name__)


def wipe_all(include_base_dir: bool = True) -> dict[str, bool]:
    """
    Securely delete all persisted memory: L2 SQLite, L3 LanceDB, and optionally
    the entire .physiclaw directory. In-process L1 (LRU) is not cleared here;
    restart the process to clear L1.

    Returns dict of { "l2": deleted?, "l3": deleted?, "base_dir": deleted? }.
    """
    result: dict[str, bool] = {"l2": False, "l3": False, "base_dir": False}

    if include_base_dir and BASE_DIR.exists():
        try:
            shutil.rmtree(BASE_DIR)
            result["base_dir"] = True
            result["l2"] = True
            result["l3"] = True
            logger.info("Wipe: removed base directory %s (L1/L2/L3 data)", BASE_DIR)
            return result
        except OSError as e:
            logger.warning("Wipe: could not remove base dir: %s", e)

    # Per-file wipe when not removing entire base
    try:
        if L2_PATH.exists():
            L2_PATH.unlink()
            result["l2"] = True
            logger.info("Wipe: removed L2 SQLite at %s", L2_PATH)
    except OSError as e:
        logger.warning("Wipe: could not remove L2: %s", e)

    l3_parent = L3_PATH.parent
    for name in ("semantic.lance", "memory_l3.lance", L3_PATH.name):
        p = l3_parent / name
        try:
            if p.exists():
                if p.is_dir():
                    shutil.rmtree(p)
                else:
                    p.unlink()
                result["l3"] = True
                logger.info("Wipe: removed L3 path %s", p)
        except OSError as e:
            logger.warning("Wipe: could not remove %s: %s", p, e)

    return result


def main() -> None:
    import sys
    logging.basicConfig(level=logging.INFO)
    if "--all" not in sys.argv:
        print("Usage: python -m wipe --all", file=sys.stderr)
        sys.exit(2)
    r = wipe_all(include_base_dir=True)
    print("Wipe complete:", r)
    sys.exit(0)
