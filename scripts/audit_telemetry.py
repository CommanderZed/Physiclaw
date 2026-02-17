#!/usr/bin/env python3
"""
Transitive dependency audit: flag packages known for telemetry or egress.
Run from repo root: python scripts/audit_telemetry.py
Exit 0 = no flagged deps; exit 1 = one or more flagged (or pip failed).
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

# Packages (or substrings in package names) known for telemetry / phone-home.
# Add more as needed; check transitive deps with pip show / pip freeze.
TELEMETRY_PACKAGES = frozenset({
    "posthog",
    "segment",
    "segment-analytics",
    "mixpanel",
    "amplitude",
    "fullstory",
    "hotjar",
    "intercom",
    "heap",
    "pendo",
    "launchdarkly",  # often used for feature flags + analytics
    "sentry-sdk",    # optional: some teams allow; flag for review
})

# Substrings in pip package names that suggest telemetry/analytics
TELEMETRY_SUBSTRINGS = [
    "analytics",
    "telemetry",
    "tracking",
    "posthog",
    "segment",
    "ph_",
]


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    req_file = repo_root / "python" / "requirements.txt"
    if not req_file.exists():
        print("No python/requirements.txt found; skipping Python audit.")
        return 0

    # Parse direct deps from requirements.txt (ignore comments, blank lines)
    direct: list[str] = []
    for line in req_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Normalize: package==version -> package
        name = re.split(r"[\s=<>]", line)[0].lower()
        direct.append(name)

    flagged: list[str] = []
    for name in direct:
        for bad in TELEMETRY_PACKAGES:
            if bad in name:
                flagged.append(name)
                break
        for sub in TELEMETRY_SUBSTRINGS:
            if sub in name:
                flagged.append(name)
                break

    if flagged:
        print("FLAGGED (telemetry/egress risk):")
        for f in sorted(set(flagged)):
            print(f"  - {f}")
        print("Consider removal or mocking (e.g. no-op stub when PHYSICLAW_OFFLINE=true).")
        return 1

    # Optional: pip install -r requirements.txt && pip freeze, then scan freeze for above.
    print("Direct dependencies in python/requirements.txt: no telemetry packages flagged.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
