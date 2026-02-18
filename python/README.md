# Physiclaw Python Backend

- **Bridge** (`bridge.py`): FastAPI RPC. Node can only send **goals**; Python is the sole authority on tool whitelisting by persona. Starts the **egress watchdog** (see Security).
- **Memory** (`core/memory/`): L1 (LRU), L2 (SQLite FTS5), L3 (LanceDB). **Engine** (`engine.py`) adds infrastructure facts (L2), docs/logs (L3), and optional local reranker (bge-reranker-base) for RAG. Use `clean_telemetry()` before any write.
- **CLI** (`cli.py`): `ToolExecutor` enforces persona whitelists and runs tools in a **restricted subprocess** (clean env, no inherited secrets). `SecurityViolation` on disallowed tools.
- **Security** (`security/watchdog.py`): Mechanical egress guard. A background thread monitors `psutil.net_connections()`; if the process connects to an IP outside `SAFE_SUBNETS` (localhost + private ranges), the process exits with a security violation log.
- **Wipe** (`wipe.py`): Red Alert. `python -m wipe --all` (or `physiclaw wipe --all` from Node CLI) securely deletes L2 SQLite, L3 LanceDB, and the `.physiclaw` directory.

## Run the bridge

```bash
cd python
pip install -r requirements.txt
export PHYSICLAW_PERSONA=sre   # or secops
uvicorn bridge:app --host 0.0.0.0 --port 8000
```

Or from repo root with Docker: `docker compose up physiclaw-bridge`.

## Wipe (self-destruct)

From repo root: `physiclaw wipe --all` (Node CLI invokes Python). Or from this directory:

```bash
python -m wipe --all
```

## Dependency audit

From repo root:

```bash
python scripts/audit_telemetry.py
```

Flags any direct deps in `python/requirements.txt` that are known for telemetry (posthog, segment, etc.). Transitive deps: run `pip install -r python/requirements.txt && pip freeze` and review.
