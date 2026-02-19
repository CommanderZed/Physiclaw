"use client";

import { useState, useRef, useEffect } from "react";
import {
  Cpu,
  Shield,
  Send,
  ChevronDown,
  Zap,
  HardDrive,
  WifiOff,
} from "lucide-react";
import { motion } from "framer-motion";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

type Persona = "sre" | "secops" | "data_architect";

const PERSONA_CONFIG: Record<
  Persona,
  { allowed: string[]; denied: string[]; label: string }
> = {
  sre: {
    label: "SRE Agent",
    allowed: ["kubectl-get", "log-aggregator"],
    denied: ["kubectl-delete"],
  },
  secops: {
    label: "SecOps Auditor",
    allowed: ["bandit-scan", "iam-inspect"],
    denied: ["data-export"],
  },
  data_architect: {
    label: "Data Architect",
    allowed: ["duckdb", "dbt run", "sqlmesh audit"],
    denied: ["drop table", "export to s3"],
  },
};

const MODELS: { id: "70b" | "8b"; label: string; vramMax: number }[] = [
  { id: "70b", label: "Llama-3-70B", vramMax: 48 },
  { id: "8b", label: "Llama-3-8B", vramMax: 8 },
];

/** Log entry schema aligned with product: bridge goal flow, audit events, policy checks. */
type LogKind = "system" | "goal" | "policy" | "audit" | "bridge" | "tool_call";
type LogEntry = { kind: LogKind; text: string; violation?: boolean; ts?: string };

function logTs(): string {
  return new Date().toISOString().slice(11, 19);
}

function formatLogLine(entry: LogEntry): string {
  const prefix = entry.ts ? `[${entry.ts}] ` : "";
  switch (entry.kind) {
    case "system":
      return `${prefix}[physiclaw] ${entry.text}`;
    case "goal":
      return `${prefix}goal: ${entry.text}`;
    case "policy":
      return `${prefix}[policy] ${entry.text}`;
    case "audit":
      return `${prefix}[audit] ${entry.text}`;
    case "bridge":
      return `${prefix}[bridge] ${entry.text}`;
    case "tool_call":
      return `${prefix}[tool_call] ${entry.text}`;
    default:
      return prefix + entry.text;
  }
}

/** Infer persona from goal text (autonomous; bridge-authoritative style). */
function inferPersonaFromGoal(goal: string): Persona {
  const lower = goal.toLowerCase().trim();
  const sreScore = /\b(kubectl|pods|terraform|prometheus|log|deploy|get\s+pods|namespace)\b/.test(lower) ? 2 : /(\bget\b|\bstatus\b|\brestart\b)/.test(lower) ? 1 : 0;
  const secopsScore = /\b(bandit|nmap|iam|vault|scan|audit|security|inspect|data-export)\b/.test(lower) ? 2 : /\b(export|ssh|scp)\b/.test(lower) ? 1 : 0;
  const dataScore = /\b(duckdb|dbt|sqlmesh|sql|query|table|schema|run\s+dbt)\b/.test(lower) ? 2 : /\b(select|from|where)\b/.test(lower) ? 1 : 0;
  if (dataScore >= secopsScore && dataScore >= sreScore && dataScore > 0) return "data_architect";
  if (secopsScore >= sreScore && secopsScore > 0) return "secops";
  return "sre";
}

function isViolation(persona: Persona, input: string, strictMode: boolean): boolean {
  const lower = input.toLowerCase();
  if (persona === "sre") {
    const base = /\b(delete|drop)\b/.test(lower) || lower.includes("kubectl-delete");
    if (strictMode) return base || /\b(scale|restart|apply)\b/.test(lower);
    return base;
  }
  if (persona === "secops") {
    const base = /\b(export|drop)\b/.test(lower) || lower.includes("data-export");
    if (strictMode) return base || /\b(ssh|scp|curl.*http)/.test(lower);
    return base;
  }
  if (persona === "data_architect") {
    return /\b(drop\s+table|export\s+to\s+s3|truncate)\b/.test(lower) || (strictMode && /\b(delete\s+from|\.write\s*\()/.test(lower));
  }
  return false;
}

const MAX_SPARK = 12;

const R = 14;
const STROKE = 5;
const C = 2 * Math.PI * R;

function GoalsByRoleDonut({
  goalsByPersona,
  persona,
}: {
  goalsByPersona: Record<Persona, number>;
  persona: Persona;
}) {
  const order: Persona[] = ["sre", "secops", "data_architect"];
  const total = order.reduce((s, p) => s + goalsByPersona[p], 0) || 1;
  let offset = 0;
  const segments = order.map((p) => {
    const value = goalsByPersona[p];
    const fraction = value / total;
    const dash = fraction * C;
    const seg = { p, dash, offset };
    offset += dash;
    return seg;
  });
  const colors: Record<Persona, string> = {
    sre: "rgba(212,175,55,0.85)",
    secops: "rgba(191,6,3,0.75)",
    data_architect: "rgba(112,141,129,0.85)",
  };
  const size = R * 2 + STROKE * 2;
  return (
    <div className="w-full flex flex-col items-center" style={{ maxWidth: 64, maxHeight: 64 }}>
      <svg className="shrink-0 -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE}
        />
        {segments.map(({ p, dash, offset }) => (
          <motion.circle
            key={p}
            cx={size / 2}
            cy={size / 2}
            r={R}
            fill="none"
            stroke={colors[p]}
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${C}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            initial={false}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />
        ))}
      </svg>
      <span className="text-[9px] font-mono text-sage-dim mt-0.5">{persona}</span>
    </div>
  );
}

export default function DemoPage() {
  const [lastInferredPersona, setLastInferredPersona] = useState<Persona>("sre");
  const [vramUsed, setVramUsed] = useState(42);
  const [vramMax, setVramMax] = useState(48);
  const [modelId, setModelId] = useState<"70b" | "8b">("70b");
  const [strictMode, setStrictMode] = useState(false);
  const [logLines, setLogLines] = useState<LogEntry[]>(() => {
    const t = new Date().toISOString().slice(11, 19);
    return [
      { kind: "system", text: "Session started. Zero egress; all traffic inside perimeter.", ts: t },
      { kind: "system", text: "Submit a goal. Persona is inferred from goal (e.g. kubectl→SRE, bandit→SecOps, dbt→Data); policy and bridge evaluate." },
    ];
  });
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reactive metrics for graphs (update when persona/model/strict or on submit)
  const [goalsByPersona, setGoalsByPersona] = useState<Record<Persona, number>>({ sre: 2, secops: 1, data_architect: 1 });
  const [violationsCount, setViolationsCount] = useState(0);
  const [activitySpark, setActivitySpark] = useState<number[]>(() => [1, 2, 1, 3, 2, 2, 1, 3, 2, 2, 3, 2]);
  const [toolCallsCount, setToolCallsCount] = useState(4);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(120);
  const [policyChecksCount, setPolicyChecksCount] = useState(4);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input.trim();
    if (!raw) return;

    setInput("");
    setIsThinking(true);

    const persona = inferPersonaFromGoal(raw);
    setLastInferredPersona(persona);

    const violation = isViolation(persona, raw, strictMode);

    setPolicyChecksCount((c) => c + 1);
    setLastLatencyMs(80 + Math.floor(Math.random() * 180));

    const allowedTools = PERSONA_CONFIG[persona].allowed.join(", ");

    const ts = logTs();

    if (violation) {
      setViolationsCount((v) => v + 1);
      setActivitySpark((prev) => [...prev.slice(-(MAX_SPARK - 1)), 0]);
      setLogLines((prev) => [
        ...prev,
        { kind: "goal", text: raw, violation: false, ts },
        { kind: "policy", text: `Inferred persona: ${persona}. Checking goal against whitelist...`, violation: false, ts },
        {
          kind: "audit",
          text: `security_violation persona=${persona} — Request denied. Tool not in whitelist.`,
          violation: true,
          ts,
        },
      ]);
      setIsThinking(false);
      return;
    }

    setGoalsByPersona((prev) => ({ ...prev, [persona]: prev[persona] + 1 }));
    setToolCallsCount((c) => c + 1);
    setActivitySpark((prev) => [...prev.slice(-(MAX_SPARK - 1)), 3]);
    setLogLines((prev) => [
      ...prev,
      { kind: "goal", text: raw, violation: false, ts },
      { kind: "policy", text: `Inferred persona: ${persona}. Checking goal against whitelist...`, violation: false, ts },
      { kind: "bridge", text: `Goal accepted. persona=${persona} allowed_tools: ${allowedTools}`, violation: false, ts },
    ]);

    let step = 0;
    const steps: LogEntry[] = [
      { kind: "policy", text: "Evaluating tool resolution (backend-authoritative).", ts: logTs() },
      { kind: "bridge", text: "L1 memory store updated.", ts: logTs() },
      { kind: "policy", text: "Security ring check passed.", ts: logTs() },
    ];
    const addReasoning = () => {
      if (step < steps.length) {
        setLogLines((prev) => [...prev, { ...steps[step], ts: logTs() }]);
        step += 1;
        setTimeout(addReasoning, 500);
      } else {
        setLogLines((prev) => [
          ...prev,
          { kind: "tool_call", text: `persona=${persona} outcome=allowed (local only).`, violation: false, ts: logTs() },
        ]);
        setIsThinking(false);
      }
    };
    setTimeout(addReasoning, 300);
  };

  const handleModelChange = (id: "70b" | "8b") => {
    setModelId(id);
    const m = MODELS.find((x) => x.id === id);
    if (m) {
      setVramMax(m.vramMax);
      setVramUsed(Math.min(vramUsed, m.vramMax));
    }
  };

  return (
    <div className="min-h-screen bg-navy bg-grid relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gold/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <SiteNav logoHref="/" showDocsLink />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Minimal header + flow pill */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gold-light">
            Agent session
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-navy-200/50 bg-navy-300/50 text-xs text-sage-dim">
            <Zap className="w-3.5 h-3.5 text-gold" />
            <span>You → Agent → Gateway → Tools</span>
            <span className="text-sage">·</span>
            <Shield className="w-3.5 h-3.5 text-crimson-light" />
            <span className="text-crimson-light">Zero egress</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Compact dashboard sidebar: metrics + session controls */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="rounded-xl border border-navy-200/50 bg-navy-300/80 backdrop-blur-sm overflow-hidden">
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-navy-200/40 bg-navy-300/30 px-3 py-2 overflow-hidden flex flex-col items-center">
                    <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-1.5 w-full text-left">Goals by role</p>
                    <GoalsByRoleDonut goalsByPersona={goalsByPersona} persona={lastInferredPersona} />
                  </div>
                  <div className="rounded-lg border border-navy-200/40 bg-navy-300/30 px-3 py-2">
                    <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-0.5">Denials</p>
                    <p className="text-lg font-semibold text-crimson-light tabular-nums">{violationsCount}</p>
                    <div className="flex items-end gap-px h-3 mt-1">
                      {activitySpark.slice(-6).map((v, i) => (
                        <div key={i} className={`flex-1 min-w-[2px] rounded-sm ${v === 0 ? "bg-crimson/70" : "bg-navy-200/40"}`} style={{ height: v === 0 ? "100%" : "40%" }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-navy-200/40 bg-navy-300/30 px-3 py-2 col-span-2">
                    <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-0.5">Total requests</p>
                    <p className="text-lg font-semibold text-gold-light tabular-nums">{Object.values(goalsByPersona).reduce((a, b) => a + b, 0) + violationsCount}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-navy-200/50 space-y-1.5 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-sage-dim">Tool calls</span>
                    <span className="text-gold-light font-mono tabular-nums">{toolCallsCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sage-dim">Policy checks</span>
                    <span className="text-gold-light font-mono tabular-nums">{policyChecksCount}</span>
                  </div>
                  {lastLatencyMs != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sage-dim">Last latency</span>
                      <span className="text-sage font-mono tabular-nums">{lastLatencyMs} ms</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sage-dim">Block rate</span>
                    <span className="text-crimson-light font-mono tabular-nums">
                      {(() => {
                        const total = Object.values(goalsByPersona).reduce((a, b) => a + b, 0) + violationsCount;
                        return total === 0 ? "0" : Math.round((violationsCount / total) * 100);
                      })()}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sage-dim">Strict</span>
                    <span className={strictMode ? "text-crimson-light" : "text-sage"}>{strictMode ? "On" : "Off"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sage-dim">Model</span>
                    <span className="text-gold-light font-mono">{modelId === "70b" ? "70B" : "8B"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sage-dim flex items-center gap-1"><Cpu className="w-3 h-3" /> VRAM</span>
                    <span className="text-gold-light font-mono">{vramUsed}/{vramMax} GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sage-dim flex items-center gap-1"><HardDrive className="w-3 h-3" /> Egress</span>
                    <span className="text-sage font-mono">0 KB/s</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sage-dim pt-0.5">
                    <WifiOff className="w-3 h-3 text-gold" />
                    <span>Gateway: local only</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-navy-200/50">
                  <label className="text-[10px] text-sage-dim block mb-1">Model</label>
                  <div className="flex rounded-md border border-navy-200/60 bg-navy-300/60 p-0.5">
                    {MODELS.map((m) => (
                      <button key={m.id} type="button" onClick={() => handleModelChange(m.id)}
                        className={`flex-1 px-2 py-1 rounded text-[10px] font-mono transition-all ${modelId === m.id ? "bg-navy-200/80 text-gold-light" : "text-sage-dim hover:text-sage-light"}`}
                      >{m.label}</button>
                    ))}
                  </div>
                  <label className="flex items-center justify-between text-[10px] mt-2 mb-0.5">
                    <span className="text-sage-dim">VRAM (GB)</span>
                    <span className="text-gold-light font-mono">{vramUsed}/{vramMax}</span>
                  </label>
                  <input type="range" min={0} max={vramMax} value={vramUsed} onChange={(e) => setVramUsed(Number(e.target.value))}
                    className="w-full h-1.5 bg-navy-200/60 rounded-full appearance-none accent-gold" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sage-dim text-[10px]">Strict mode</span>
                    <button type="button" role="switch" aria-checked={strictMode} onClick={() => setStrictMode((s) => !s)}
                      className={`relative w-9 h-4 rounded-full transition-colors ${strictMode ? "bg-crimson/60" : "bg-navy-200/60"}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-sage-light transition-transform duration-200 ${strictMode ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main: conversation + single chat-style input bar */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="rounded-xl border border-navy-200/50 bg-navy-300/80 backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden flex flex-col min-h-[420px]">
              <div className="px-4 py-2 border-b border-navy-200/60 flex items-center justify-between">
                <span className="text-xs font-medium text-sage-light">Session log</span>
                <span className="text-[10px] text-sage-dim">Role + policy apply to every command</span>
              </div>
              <div className="flex-1 p-4 font-mono text-sm overflow-y-auto min-h-[240px]">
                {logLines.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.violation
                        ? "text-crimson-light font-semibold py-0.5"
                        : line.kind === "bridge" || line.kind === "tool_call"
                          ? "text-sage py-0.5"
                          : line.kind === "goal"
                            ? "text-gold-light py-0.5"
                            : "text-sage-dim py-0.5"
                    }
                  >
                    {formatLogLine(line)}
                  </div>
                ))}
                {isThinking && <span className="inline-block text-gold animate-pulse">█</span>}
                <div ref={logEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="border-t border-navy-200/60 p-3">
                <div className="rounded-2xl border border-navy-200/50 bg-navy-300/90 shadow-inner flex items-center gap-2 px-3 py-2.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Send a goal…"
                    className="flex-1 min-w-0 bg-transparent border-none text-sage-light font-mono text-sm placeholder:text-sage-dim focus:outline-none focus:ring-0 py-1"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-navy-200/50 border border-navy-200/40">
                      <span className="text-[10px] text-sage-dim">Mode</span>
                      <button type="button" onClick={() => setStrictMode((s) => !s)} className="text-xs font-medium text-sage-light focus:outline-none">
                        {strictMode ? "Strict" : "Fast"}
                      </button>
                      <ChevronDown className="w-3 h-3 text-sage-dim" />
                    </div>
                    <button type="submit" className="p-2 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition-colors" aria-label="Send">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-sage-dim px-1">
                  Persona inferred from goal. Last: {PERSONA_CONFIG[lastInferredPersona].label}. Allowed per role: SRE (kubectl-get, log-aggregator), SecOps (bandit-scan, iam-inspect), Data (duckdb, dbt run).
                </p>
              </form>
            </div>
          </div>
        </div>

      </main>

      <SiteFooter />
    </div>
  );
}
