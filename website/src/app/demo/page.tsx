"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  ArrowLeft,
  Shield,
  Terminal,
  Activity,
  HardDrive,
  WifiOff,
  User,
  Server,
  Lock,
  Zap,
} from "lucide-react";
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

const REASONING_LINES = [
  "Analyzing request via vLLM...",
  "Querying local K8s API...",
  "Security Ring check...",
];

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

export default function DemoPage() {
  const [persona, setPersona] = useState<Persona>("sre");
  const [vramUsed, setVramUsed] = useState(42);
  const [vramMax, setVramMax] = useState(48);
  const [modelId, setModelId] = useState<"70b" | "8b">("70b");
  const [strictMode, setStrictMode] = useState(false);
  const [logLines, setLogLines] = useState<{ text: string; violation?: boolean }[]>([
    { text: "Physiclaw demo — Zero-Egress Policy active. Gateway: localhost:8000" },
    { text: "Select a persona and type a command to simulate agent behavior." },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input.trim();
    if (!raw) return;

    setInput("");
    setIsThinking(true);

    const violation = isViolation(persona, raw, strictMode);

    if (violation) {
      setLogLines((prev) => [
        ...prev,
        { text: `$ ${raw}`, violation: false },
        {
          text: "SECURITY VIOLATION — Physiclaw Zero-Egress Policy blocking action. Request denied.",
          violation: true,
        },
      ]);
      setIsThinking(false);
      return;
    }

    setLogLines((prev) => [...prev, { text: `$ ${raw}`, violation: false }]);

    let step = 0;
    const addReasoning = () => {
      if (step < REASONING_LINES.length) {
        setLogLines((prev) => [
          ...prev,
          { text: REASONING_LINES[step], violation: false },
        ]);
        step += 1;
        setTimeout(addReasoning, 600);
      } else {
        setLogLines((prev) => [
          ...prev,
          { text: `[OK] ${PERSONA_CONFIG[persona].label}: command allowed (local only).`, violation: false },
        ]);
        setIsThinking(false);
      }
    };
    setTimeout(addReasoning, 400);
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
        {/* Data flow diagram */}
        <div className="mb-8 rounded-xl border border-navy-200/50 bg-navy-300/40 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-navy-200/60 flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold" />
            <span className="text-xs font-medium text-sage-light uppercase tracking-widest">
              Zero-Egress data flow
            </span>
          </div>
          <div className="p-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-xl bg-navy-200/60 border border-navy-200/50 flex items-center justify-center">
                <Terminal className="w-7 h-7 text-gold" />
              </div>
              <span className="text-xs font-mono text-sage-dim">You</span>
            </div>
            <span className="text-sage-dim">→</span>
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/40 flex items-center justify-center">
                <User className="w-7 h-7 text-gold" />
              </div>
              <span className="text-xs font-mono text-sage-dim">Agent</span>
            </div>
            <span className="text-sage-dim">→</span>
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-xl bg-sage/10 border border-sage/40 flex items-center justify-center">
                <Server className="w-7 h-7 text-sage" />
              </div>
              <span className="text-xs font-mono text-sage-dim">Gateway</span>
            </div>
            <span className="text-sage-dim">→</span>
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-xl bg-navy-200/60 border border-navy-200/50 flex items-center justify-center">
                <Lock className="w-7 h-7 text-gold" />
              </div>
              <span className="text-xs font-mono text-sage-dim">Your tools</span>
            </div>
            <div className="w-full sm:w-auto flex items-center justify-center gap-2 mt-2 sm:mt-0 sm:ml-2 px-3 py-1.5 rounded-lg bg-crimson/10 border border-crimson/30">
              <Shield className="w-4 h-4 text-crimson-light" />
              <span className="text-xs font-mono text-crimson-light">All inside your perimeter</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Local Telemetry + controls Sidebar */}
          <aside className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="rounded-xl border border-navy-200/50 bg-navy-300/80 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-navy-200/60 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gold" />
                <span className="text-xs font-medium text-sage-light uppercase tracking-widest">
                  Local telemetry &amp; controls
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="flex items-center justify-between text-xs mb-1">
                    <span className="text-sage-dim flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      VRAM (GB)
                    </span>
                    <span className="text-gold-light font-mono">{vramUsed} / {vramMax}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={vramMax}
                    value={vramUsed}
                    onChange={(e) => setVramUsed(Number(e.target.value))}
                    className="w-full h-2 bg-navy-200/60 rounded-full appearance-none accent-gold"
                  />
                  <div className="h-1.5 mt-1 bg-navy-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold/80 rounded-full transition-all duration-200"
                      style={{ width: `${(vramUsed / vramMax) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-sage-dim block mb-2">Model</label>
                  <div className="flex rounded-lg border border-navy-200/60 bg-navy-300/60 p-0.5">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleModelChange(m.id)}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                          modelId === m.id
                            ? "bg-navy-200/80 text-gold-light border border-navy-200/60"
                            : "text-sage-dim hover:text-sage-light"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-sage-dim flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" />
                      External Data Egress
                    </span>
                    <span className="text-sage-light font-mono">0.00 KB/s</span>
                  </div>
                  <div className="h-2 bg-navy-200/60 rounded-full overflow-hidden">
                    <div className="h-full w-0 bg-crimson/80 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-navy-200/50">
                  <span className="text-xs text-sage-dim">Strict mode</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={strictMode}
                    onClick={() => setStrictMode((s) => !s)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      strictMode ? "bg-crimson/60" : "bg-navy-200/60"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-sage-light transition-transform ${
                        strictMode ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
                <div className="pt-2 border-t border-navy-200/50 flex items-center gap-2 text-xs text-sage-dim">
                  <WifiOff className="w-3.5 h-3.5 text-gold" />
                  <span>Gateway: localhost:8000</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main: Persona + Terminal */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <span className="text-sage-dim text-sm">Persona:</span>
              <div className="flex rounded-lg border border-navy-200/60 bg-navy-300/60 p-0.5">
                {(["sre", "secops", "data_architect"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPersona(p)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      persona === p
                        ? "bg-navy-200/80 text-gold-light border border-navy-200/60"
                        : "text-sage-dim hover:text-sage-light"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    {PERSONA_CONFIG[p].label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-sage-dim">
                {persona === "sre"
                  ? "Allowed: kubectl-get, log-aggregator. Denied: kubectl-delete."
                  : persona === "secops"
                    ? "Allowed: bandit-scan, iam-inspect. Denied: data-export."
                    : "Allowed: duckdb, dbt run, sqlmesh audit. Denied: drop table, export to s3."}
              </div>
            </div>

            <div className="rounded-xl border border-navy-200/50 bg-navy-300/80 backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-navy-200/60 border-b border-navy-200/60">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-crimson/80" />
                    <div className="w-3 h-3 rounded-full bg-gold/80" />
                    <div className="w-3 h-3 rounded-full bg-sage/80" />
                  </div>
                  <div className="ml-3 flex items-center gap-1.5 text-xs text-sage-dim">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>physiclaw — demo</span>
                  </div>
                  <span className="ml-2 flex items-center gap-1 text-[10px] text-sage-dim">
                    <Shield className="w-3 h-3 text-gold" />
                    Zero-Egress
                  </span>
                </div>
              </div>

              <div className="min-h-[320px] flex flex-col">
                <div className="flex-1 p-4 font-mono text-sm overflow-y-auto max-h-[280px]">
                  {logLines.map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.violation
                          ? "text-crimson-light font-semibold py-1"
                          : "text-sage-light py-0.5"
                      }
                    >
                      {line.text}
                    </div>
                  ))}
                  {isThinking && (
                    <span className="inline-block text-gold animate-pulse">
                      █
                    </span>
                  )}
                  <div ref={logEndRef} />
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="border-t border-navy-200/60 p-3 flex items-center gap-2"
                >
                  <span className="text-gold text-sm">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a command (e.g. kubectl get pods, data-export)..."
                    className="flex-1 min-w-0 bg-transparent border-none text-sage-light font-mono text-sm placeholder:text-sage-dim focus:outline-none focus:ring-0"
                    autoFocus
                  />
                </form>
              </div>
            </div>

            <p className="mt-3 text-xs text-sage-dim">
              Try &quot;delete&quot;, &quot;drop&quot;, or &quot;export&quot; to see blocks. Data Architect: &quot;drop table&quot;, &quot;export to s3&quot;. Strict mode adds more denials per persona.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
