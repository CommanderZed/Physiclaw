# Physiclaw Python Backend

- **Bridge** (`bridge.py`): FastAPI RPC. Node can only send **goals**; Python is the sole authority on tool whitelisting by persona.
- **Memory** (`core/memory/manager.py`): L1 (LRU), L2 (SQLite FTS5), L3 (LanceDB). Use `clean_telemetry()` before any write.
- **CLI** (`cli.py`): `ToolExecutor` enforces persona whitelists; `SecurityViolation` on disallowed tools. Isolation (bubblewrap/docker) is TODO.

## Run the bridge

```bash
cd python
pip install -r requirements.txt
export PHYSICLAW_PERSONA=sre   # or secops
uvicorn bridge:app --host 0.0.0.0 --port 8000
```

Or from repo root with Docker: `docker compose up physiclaw-bridge`.

## Dependency audit

From repo root:

```bash
python scripts/audit_telemetry.py
```

Flags any direct deps in `python/requirements.txt` that are known for telemetry (posthog, segment, etc.). Transitive deps: run `pip install -r python/requirements.txt && pip freeze` and review.
