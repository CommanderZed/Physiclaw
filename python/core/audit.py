"""
Local observability (Phase 2): immutable audit log + Prometheus metrics.

Append-only JSONL audit trail of agent decisions (goals, tool calls, violations, egress blocks).
In-memory counters for Prometheus scraping; no egress, no cloud.
"""

from __future__ import annotations

import json
import logging
import os
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Reuse same base dir as memory so audit lives under .physiclaw
def _base_dir() -> Path:
    return Path(os.getenv("PHYSICLAW_MEMORY_DIR", ".physiclaw")).expanduser()


def _audit_path() -> Path:
    p = _base_dir() / "audit.jsonl"
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


_lock = threading.Lock()
_counters: dict[str, dict[tuple[str, ...], int]] = {
    "goals_total": {},
    "tool_calls_total": {},
    "security_violations_total": {},
    "egress_blocks_total": {},
    "auth_denied_total": {},
}

# Summary stats for latency: key -> label_key -> {sum, count}
_summary_stats: dict[str, dict[tuple[str, ...], dict[str, float]]] = {
    "memory_retrieval_seconds": {},
}


def _counter_key(labels: dict[str, str]) -> tuple[str, ...]:
    return tuple(sorted(labels.items()))


def _inc(counter: str, labels: dict[str, str], value: int = 1) -> None:
    with _lock:
        key = _counter_key(labels)
        _counters[counter][key] = _counters[counter].get(key, 0) + value


def audit_log(event: str, **payload: Any) -> None:
    """
    Append one immutable audit record (append-only JSONL). Also bumps in-memory counters
    for Prometheus. Safe to call from any thread.
    """
    ts = datetime.now(UTC).isoformat() + "Z"
    record = {"ts": ts, "event": event, **{k: v for k, v in payload.items() if v is not None}}
    line = json.dumps(record, default=str) + "\n"
    path = _audit_path()
    try:
        with _lock:
            with open(path, "a", encoding="utf-8") as f:
                f.write(line)
    except OSError as e:
        logger.warning("Audit write failed: %s", e)

    # Update counters for Prometheus
    if event == "goal":
        _inc("goals_total", {"persona": str(payload.get("persona", "unknown"))})
    elif event == "tool_call":
        _inc(
            "tool_calls_total",
            {
                "persona": str(payload.get("persona", "unknown")),
                "tool": str(payload.get("tool", "unknown"))[:64],
                "outcome": str(payload.get("outcome", "unknown")),
            },
        )
    elif event == "security_violation":
        _inc("security_violations_total", {"persona": str(payload.get("persona", "unknown"))})
    elif event == "egress_block":
        _inc("egress_blocks_total", {})
    elif event == "auth_denied":
        _inc("auth_denied_total", {"persona": str(payload.get("persona", "unknown"))})


def record_memory_retrieval_seconds(layer: str, seconds: float) -> None:
    """
    Record a memory retrieval duration for Prometheus Summary (L2/L3/combined).
    Safe to call from any thread. Use layer "l2", "l3", or "combined".
    """
    if not (layer and seconds >= 0):
        return
    key = _counter_key({"layer": layer})
    with _lock:
        entry = _summary_stats["memory_retrieval_seconds"].get(key, {"sum": 0.0, "count": 0.0})
        _summary_stats["memory_retrieval_seconds"][key] = {
            "sum": entry["sum"] + seconds,
            "count": entry["count"] + 1,
        }


def _escape_label(v: str) -> str:
    return v.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def get_prometheus_metrics() -> str:
    """Return metrics in Prometheus text exposition format (no dependency on prometheus_client)."""
    lines = [
        "# HELP physiclaw_goals_total Goals submitted by persona.",
        "# TYPE physiclaw_goals_total counter",
    ]
    with _lock:
        for key, value in _counters["goals_total"].items():
            labels = ",".join(f'{k}="{_escape_label(str(v))}"' for k, v in key)
            lines.append(f"physiclaw_goals_total{{{labels}}} {value}")

        lines.extend([
            "",
            "# HELP physiclaw_tool_calls_total Tool executions by persona, tool, outcome.",
            "# TYPE physiclaw_tool_calls_total counter",
        ])
        for key, value in _counters["tool_calls_total"].items():
            labels = ",".join(f'{k}="{_escape_label(str(v))}"' for k, v in key)
            lines.append(f"physiclaw_tool_calls_total{{{labels}}} {value}")

        lines.extend([
            "",
            "# HELP physiclaw_security_violations_total Denied tool calls by persona.",
            "# TYPE physiclaw_security_violations_total counter",
        ])
        for key, value in _counters["security_violations_total"].items():
            labels = ",".join(f'{k}="{_escape_label(str(v))}"' for k, v in key)
            lines.append(f"physiclaw_security_violations_total{{{labels}}} {value}")

        lines.extend([
            "",
            "# HELP physiclaw_egress_blocks_total Egress watchdog blocks (non-safe IP).",
            "# TYPE physiclaw_egress_blocks_total counter",
        ])
        total_egress = sum(_counters["egress_blocks_total"].values())
        lines.append(f"physiclaw_egress_blocks_total {total_egress}")

        lines.extend([
            "",
            "# HELP physiclaw_auth_denied_total Auth failures (missing or invalid API key) by persona.",
            "# TYPE physiclaw_auth_denied_total counter",
        ])
        for key, value in _counters["auth_denied_total"].items():
            labels = ",".join(f'{k}="{_escape_label(str(v))}"' for k, v in key)
            lines.append(f"physiclaw_auth_denied_total{{{labels}}} {value}")

        lines.extend([
            "",
            "# HELP physiclaw_memory_retrieval_seconds Memory retrieval latency (L2/L3/combined) in seconds.",
            "# TYPE physiclaw_memory_retrieval_seconds summary",
        ])
        for key, entry in _summary_stats["memory_retrieval_seconds"].items():
            labels = ",".join(f'{k}="{_escape_label(str(v))}"' for k, v in key)
            lines.append(f"physiclaw_memory_retrieval_seconds_sum{{{labels}}} {entry['sum']:.6f}")
            lines.append(f"physiclaw_memory_retrieval_seconds_count{{{labels}}} {int(entry['count'])}")

    return "\n".join(lines) + "\n"
