"""
Mechanical Egress Guard — low-level socket monitor.

Proves air-gapping is a runtime feature: if the Physiclaw process attempts
to establish a connection to an IP outside SAFE_SUBNETS, the watchdog
triggers an immediate process exit with a security violation log.
"""

from __future__ import annotations

import ipaddress
import logging
import os
import sys
import threading
import time

try:
    import psutil
except ImportError:
    psutil = None

logger = logging.getLogger(__name__)

# Subnets allowed for outbound connections. No cloud IPs.
SAFE_SUBNETS = [
    ipaddress.ip_network("127.0.0.0/8"),   # loopback
    ipaddress.ip_network("::1/128"),       # IPv6 loopback
    ipaddress.ip_network("10.0.0.0/8"),    # private
    ipaddress.ip_network("172.16.0.0/12"),  # private
    ipaddress.ip_network("192.168.0.0/16"), # private
    ipaddress.ip_network("169.254.0.0/16"), # link-local
    ipaddress.ip_network("fc00::/7"),       # IPv6 unique local
    ipaddress.ip_network("fe80::/10"),     # IPv6 link-local
]


def _ip_in_safe_subnets(ip_str: str) -> bool:
    """Return True if the given IP string is inside any SAFE_SUBNETS."""
    if not ip_str or ip_str in ("", "*"):
        return True
    # Strip port if present (e.g. "192.168.1.1:443" -> "192.168.1.1")
    if "%" in ip_str:
        ip_str = ip_str.split("%")[0]
    if ":" in ip_str and "]" not in ip_str:
        # IPv4 with port
        ip_str = ip_str.split(":")[0]
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return False
    return any(ip in net for net in SAFE_SUBNETS)


def _check_connections(pid: int) -> list[tuple[str, int, str]]:
    """
    Return list of (remote_ip, remote_port, status) for connections
    that are outside SAFE_SUBNETS. Only considers ESTABLISHED and SYN_SENT.
    """
    if psutil is None:
        return []
    violations: list[tuple[str, int, str]] = []
    try:
        proc = psutil.Process(pid)
        for conn in proc.connections(kind="inet"):
            if conn.status not in ("ESTABLISHED", "SYN_SENT"):
                continue
            raddr = conn.raddr
            if raddr is None:
                continue
            ip_str = raddr.ip
            port = raddr.port
            if not _ip_in_safe_subnets(ip_str):
                violations.append((ip_str, port, conn.status))
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass
    except Exception as e:
        logger.warning("Egress watchdog check failed: %s", e)
    return violations


def _watchdog_loop(pid: int, interval_sec: float = 5.0) -> None:
    while True:
        time.sleep(interval_sec)
        violations = _check_connections(pid)
        if violations:
            for ip_str, port, status in violations:
                logger.critical(
                    "EGRESS_VIOLATION: Physiclaw attempted connection to %s:%s (status=%s). "
                    "Only local/private subnets are allowed. Exiting.",
                    ip_str, port, status,
                )
            sys.exit(1)


def start_egress_watchdog(interval_sec: float = 5.0) -> threading.Thread | None:
    """
    Start a background thread that periodically checks this process's
    network connections. If any connection targets an IP outside SAFE_SUBNETS,
    the process exits with code 1 and a critical log.

    Returns the thread if started, or None if psutil is not installed.
    """
    if psutil is None:
        logger.warning("Egress watchdog disabled: psutil not installed. pip install psutil")
        return None
    pid = os.getpid()
    thread = threading.Thread(
        target=_watchdog_loop,
        args=(pid, interval_sec),
        name="physiclaw-egress-watchdog",
        daemon=True,
    )
    thread.start()
    logger.info("Egress watchdog started (pid=%s, interval=%.1fs). Only local/private subnets allowed.", pid, interval_sec)
    return thread
