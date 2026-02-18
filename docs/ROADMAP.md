# Physiclaw Roadmap — Sovereign Swarm (v0.2.0)

**Baseline:** v0.1.1-alpha codebase analysis.

---

## Current State Assessment

### Identity

Strongly positioned as a **Sovereign SRE/SecOps Runtime.** The pivot from a general assistant to role-specific personas (SRE, SecOps) is the project's most defensible asset.

### Security Foundations

| Foundation | Status |
|------------|--------|
| **Egress Guard** | Mechanical watchdog implementation turns "privacy" into a technical certainty. |
| **Persona-Based RBAC** | Logic-level tool whitelisting is implemented. |
| **Memory Architecture** | 3-tier system (LRU Cache, SQLite FTS5, LanceDB) provides high-performance RAG without cloud dependencies. |
| **Developer Experience** | Dockerization and install.sh hardening have significantly reduced installation friction. |

---

## Strategic Gaps

1. **The Isolation Boundary**  
   While RBAC exists, agents may still run in a shared environment. A "Blast Radius" compromise could theoretically leak between personas if they share a process or container. *Mitigation in progress:* restricted subprocess with clean env; target: hardened sandbox per persona.

2. **Observability**  
   There is no "Black Box" log of agent decisions. For enterprise adoption, an **immutable audit trail** of what tools were called (and why) is mandatory.

3. **Local IAM**  
   The "Login with Google" button is gone, but there is no local-first identity management (e.g., local API keys for internal teams, or lightweight local auth).

---

## Roadmap: Sovereign Swarm (v0.2.0)

### Phase 1: Hardened Sandboxing (Immediate Priority)

**Goal:** Move from **logical isolation (RBAC)** to **physical isolation.**

- Each agent runs in a hardened sandbox (e.g., **gVisor** or restricted **Linux namespaces**).
- Zero cross-contamination between SRE and SecOps (and future personas).
- Ensures prompt injection or tool escape in one persona cannot leak secrets into another.

**Deliverables:** Sandbox runner (gVisor/namespace) around ToolExecutor; persona → sandbox mapping; docs for air-gapped sandbox setup.

**Status (v0.1.1-alpha):** **Bubblewrap (bwrap) sandbox** implemented in `python/security/sandbox.py`. When `PHYSICLAW_SANDBOX=1` and `bwrap` is on PATH, the ToolExecutor runs each whitelisted tool inside a minimal namespace (read-only `/usr`, `/bin`, `/lib`, `/etc`; `--unshare-net` by default; writable `/tmp` only). Optional `PHYSICLAW_SANDBOX_NET=1` allows network for tools that need localhost. Install bubblewrap (e.g. `apt install bubblewrap` / `dnf install bubblewrap`) and set `PHYSICLAW_SANDBOX=1` to enable. gVisor or per-persona sandbox mapping can be added in a follow-up.

---

### Phase 2: Local Observability Dashboard

**Goal:** Implement a local **Grafana/Prometheus** export for "Agent Telemetry."

**Track:**

- Successful tool calls (persona, tool, outcome).
- Security violations (denied tools, egress blocks).
- Memory latency (L1/L2/L3 hit rates, retrieval time).
- Egress watchdog block events.

**Deliverables:** Prometheus metrics endpoint (no egress); optional local Grafana dashboards; immutable audit log of agent decisions (append-only, local).

**Status (v0.1.1-alpha):** **Audit log + /metrics** implemented. `core/audit.py`: append-only JSONL at `.physiclaw/audit.jsonl` for events `goal`, `tool_call`, `security_violation`, `egress_block`, `auth_denied`. In-memory counters exposed at **GET /metrics** (Prometheus text format): `physiclaw_goals_total`, `physiclaw_tool_calls_total`, `physiclaw_security_violations_total`, `physiclaw_egress_blocks_total`, `physiclaw_auth_denied_total` (Phase 4). **Memory retrieval latency:** `physiclaw_memory_retrieval_seconds` (Summary with `layer=l2|l3|combined`) is recorded when the memory engine’s `retrieve_for_llm` runs. Bridge logs goals; CLI logs tool calls and violations; watchdog logs egress blocks before exit. Scrape with Prometheus (e.g. `http://localhost:8000/metrics`). **Grafana:** an optional dashboard is provided in [docs/grafana/](grafana/README.md) (import `physiclaw-metrics-dashboard.json` and select your Prometheus datasource).

---

### Phase 3: The "Data Architect" Persona

**Goal:** Flesh out the third persona mentioned in the README.

- Focus on **local data orchestration**: DuckDB integration, dbt local runs, sqlmesh auditing.
- Same RBAC and sandbox model as SRE/SecOps; tool whitelist for read/transform/audit only (no arbitrary shell).
- Integrates with 3-tier memory for "what changed" and lineage context.

**Deliverables:** Data Architect persona; whitelist (duckdb, dbt, sqlmesh); docs and examples.

**Status (v0.1.1-alpha):** **Data Architect persona** added. Persona `data_architect` (or `data`) with whitelist: `duckdb`, `duckdb-query`; `dbt run`, `dbt test`, `dbt build`, `dbt compile`, `dbt docs generate`; `sqlmesh audit`, `sqlmesh plan`, `sqlmesh run`. Bridge accepts `persona=data_architect` on `/goal`; executor and sandbox apply the same isolation. Set `PHYSICLAW_PERSONA=data_architect` or pass persona in the goal request. Memory/lineage integration can be added next.

---

### Phase 4: Enterprise Local Auth

**Goal:** Integrate a lightweight, **local-first auth layer** to manage who can trigger which agents.

- Options: **Keycloak** (self-hosted), or a simplified **local JWT provider** (no cloud).
- Scope: who can call SRE vs. SecOps vs. Data Architect; API keys or short-lived tokens for internal teams.
- No SaaS; all auth decisions and secrets stay on-prem.

**Deliverables:** Auth adapter (Keycloak or local JWT); bridge/CLI checks auth before executing goals; docs for enterprise deployment.

**Status (v0.1.1-alpha):** **Local API key + JWT auth (first slices)** implemented at the bridge. Configure `PHYSICLAW_API_KEYS="sre:KEY_SRE,secops:KEY_SECOPS,data_architect:KEY_DATA"`, send `X-Physiclaw-Key: <key>` on `/goal`, and (optionally) set `PHYSICLAW_REQUIRE_AUTH=1` to require credentials. For JWT, set `PHYSICLAW_JWT_SECRET` and send `Authorization: Bearer <jwt>` (HS256, validated locally; optional `persona`/`role` and `scope` claims). Per-persona mapping is enforced locally; no SaaS. **CLI-side auth:** `physiclaw goal "<text>" --persona sre [--key KEY]` or `[--jwt JWT]` (or env `PHYSICLAW_API_KEY` / `PHYSICLAW_JWT` / `PHYSICLAW_BRIDGE_URL`). Keycloak or other IdPs can issue compatible JWTs in a later phase.

---

## Versioning

| Version | Focus |
|---------|--------|
| **v0.1.1-alpha** | Current: Egress guard, 3-tier memory, persona RBAC, subprocess isolation, wipe. |
| **v0.2.0** | Sovereign Swarm: Sandboxing, observability, Data Architect persona, local auth. |

---

*Last updated: from codebase analysis (v0.1.1-alpha).*
