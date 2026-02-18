# Grafana dashboard for Physiclaw

Optional local dashboard for Prometheus metrics exposed by the Physiclaw bridge (**GET /metrics**).

## Prerequisites

- Grafana (self-hosted or local).
- A Prometheus instance scraping the bridge, e.g. `http://localhost:8000/metrics` (or your bridge URL).

## Import

1. In Grafana: **Dashboards** → **New** → **Import**.
2. Upload or paste the contents of **physiclaw-metrics-dashboard.json** (or use **Import via panel json** and paste the file).
3. Select your **Prometheus** data source (the one that scrapes the Physiclaw bridge).
4. Click **Import**.

## Panels

- **Goals (total)** — Total goals submitted.
- **Tool calls (total)** — Total tool executions.
- **Security violations** — Denied tool calls (by persona).
- **Egress blocks** — Watchdog blocks (non-safe IP).
- **Auth denied** — Auth failures (missing/invalid API key).
- **Goals & tool calls (rate)** — Rate of goals and tool calls over time (by persona where applicable).
- **Memory retrieval avg latency (by layer)** — Average latency for L2/L3/combined retrieval when `retrieve_for_llm` is used.

The **datasource** variable at the top lets you switch the Prometheus data source if you have more than one.

## No egress

The bridge serves metrics on your chosen host/port. Scrape with Prometheus on your network; Grafana talks only to Prometheus. No telemetry or data leaves your infrastructure.
