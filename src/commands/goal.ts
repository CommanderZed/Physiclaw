/**
 * physiclaw goal "<text>" [--persona sre|secops|data_architect] [--bridge-url URL] [--key KEY] [--jwt JWT]
 *
 * Submits a goal to the Python bridge. When the bridge has PHYSICLAW_REQUIRE_AUTH=1,
 * authenticate with PHYSICLAW_API_KEY/--key (X-Physiclaw-Key) or PHYSICLAW_JWT/--jwt (Authorization: Bearer).
 */

import { theme } from "../terminal/theme.js";

const DEFAULT_BRIDGE_URL = "http://localhost:8000";

export type GoalCommandOpts = {
  goal: string;
  persona: string;
  bridgeUrl: string;
  apiKey?: string;
  jwt?: string;
  json?: boolean;
  timeoutMs?: number;
};

export async function goalCommand(
  opts: GoalCommandOpts,
  _runtime: { log: (msg: string) => void; error: (msg: string) => void },
): Promise<void> {
  const { goal, persona, bridgeUrl, apiKey, jwt, json: wantJson, timeoutMs = 15_000 } = opts;

  const url = `${bridgeUrl.replace(/\/$/, "")}/goal`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey?.trim()) {
    headers["X-Physiclaw-Key"] = apiKey.trim();
  }
  if (jwt?.trim()) {
    headers["Authorization"] = `Bearer ${jwt.trim()}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ goal, persona }),
      signal: controller.signal,
    });
    const body = await res.text();
    clearTimeout(timeout);

    if (!res.ok) {
      let detail = body;
      try {
        const parsed = JSON.parse(body) as { detail?: string };
        if (parsed.detail) detail = parsed.detail;
      } catch {
        // use raw body
      }
      _runtime.error(`Bridge returned ${res.status}: ${detail}`);
      process.exitCode = res.status === 401 || res.status === 403 ? 1 : 2;
      return;
    }

    if (wantJson) {
      _runtime.log(body);
      return;
    }

    try {
      const data = JSON.parse(body) as { goal?: string; persona?: string; allowed_tools?: string[] };
      _runtime.log(theme.success("Goal accepted."));
      _runtime.log(theme.muted(`Persona: ${data.persona ?? persona}`));
      if (Array.isArray(data.allowed_tools) && data.allowed_tools.length > 0) {
        _runtime.log(theme.muted(`Allowed tools: ${data.allowed_tools.join(", ")}`));
      }
    } catch {
      _runtime.log(body);
    }
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || (err as { name?: string }).name === "AbortError") {
      _runtime.error(`Request timed out after ${timeoutMs}ms`);
    } else {
      _runtime.error(`Request failed: ${msg}`);
    }
    process.exitCode = 1;
  }
}
