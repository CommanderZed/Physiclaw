# Physiclaw Python Backend

- **Bridge** (`bridge.py`): FastAPI RPC. Node can only send **goals**; Python is the sole authority on tool whitelisting by persona. Starts the **egress watchdog** (see Security).
- **Memory** (`core/memory/`): L1 (LRU), L2 (SQLite FTS5), L3 (LanceDB). **Engine** (`engine.py`) adds infrastructure facts (L2), docs/logs (L3), and optional local reranker (bge-reranker-base) for RAG. Use `clean_telemetry()` before any write.
- **CLI** (`cli.py`): `ToolExecutor` enforces persona whitelists and runs tools in a **restricted subprocess** (clean env, no inherited secrets). Personas: **SRE**, **SecOps**, **Data Architect** (Phase 3; whitelist: duckdb, dbt, sqlmesh for local data orchestration). `SecurityViolation` on disallowed tools.
- **Security** (`security/watchdog.py`): Mechanical egress guard. A background thread monitors `psutil.net_connections()`; if the process connects to an IP outside `SAFE_SUBNETS` (localhost + private ranges), the process exits with a security violation log.
- **Sandbox** (`security/sandbox.py`): Phase 1 hardened isolation. When `PHYSICLAW_SANDBOX=1` and **bubblewrap** (`bwrap`) is installed, tool runs execute inside a minimal namespace sandbox (read-only system, no network unless `PHYSICLAW_SANDBOX_NET=1`). Set `PHYSICLAW_SANDBOX=0` or leave unset to use the clean-env subprocess only.
- **Wipe** (`wipe.py`): Red Alert. `python -m wipe --all` (or `physiclaw wipe --all` from Node CLI) securely deletes L2 SQLite, L3 LanceDB, and the `.physiclaw` directory.
- **Observability** (`core/audit.py`): Phase 2. Append-only **audit log** at `.physiclaw/audit.jsonl` (events: `goal`, `tool_call`, `security_violation`, `egress_block`, `auth_denied`). **GET /metrics** on the bridge exposes Prometheus counters (goals, tool calls, violations, egress blocks, auth_denied) and a **memory retrieval latency summary** (`physiclaw_memory_retrieval_seconds` with labels `layer=l2|l3|combined`) when the memory engine’s `retrieve_for_llm` is used. Scrape locally; no egress.
- **Auth** (bridge): Phase 4 slice. Local API keys + optional **local JWT**. Configure `PHYSICLAW_API_KEYS="sre:KEY_SRE,secops:KEY_SECOPS,data_architect:KEY_DATA"` and (optionally) `PHYSICLAW_REQUIRE_AUTH=1`. Clients call `/goal` with either `X-Physiclaw-Key: <key>` **or** `Authorization: Bearer <jwt>` (when `PHYSICLAW_JWT_SECRET` is set). JWTs are validated locally (HS256) and may carry `persona` / `role` and `scope` claims (e.g. `physiclaw:goal`). The bridge enforces persona → key/JWT mapping entirely on-prem. The **Node CLI** supports this via `physiclaw goal "<text>" --persona sre [--key KEY]` or `[--jwt JWT]` (or env `PHYSICLAW_API_KEY` / `PHYSICLAW_JWT` / `PHYSICLAW_BRIDGE_URL`).

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
