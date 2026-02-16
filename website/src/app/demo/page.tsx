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
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

type Persona = "sre" | "secops";

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
};

const REASONING_LINES = [
  "Analyzing request via vLLM...",
  "Querying local K8s API...",
  "Security Ring check...",
];

function isViolation(persona: Persona, input: string): boolean {
  const lower = input.toLowerCase();
  if (persona === "sre") return /\b(delete|drop)\b/.test(lower) || lower.includes("kubectl-delete");
  return /\b(export|drop)\b/.test(lower) || lower.includes("data-export");
}

export default function DemoPage() {
  const [persona, setPersona] = useState<Persona>("sre");
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

    const violation = isViolation(persona, raw);

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

  return (
    <div className="min-h-screen bg-navy bg-grid relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gold/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <SiteNav logoHref="/" showDocsLink />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Local Telemetry Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="rounded-xl border border-navy-200/50 bg-navy-300/80 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-navy-200/60 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gold" />
                <span className="text-xs font-medium text-sage-light uppercase tracking-widest">
                  Local telemetry
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-sage-dim flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      VRAM
                    </span>
                    <span className="text-gold-light font-mono">42 GB / 48 GB</span>
                  </div>
                  <div className="h-2 bg-navy-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold/80 rounded-full transition-all"
                      style={{ width: "87.5%" }}
                    />
                  </div>
                  <p className="text-[10px] text-sage-dim mt-1 font-mono">
                    Llama-3-70B local
                  </p>
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
                {(["sre", "secops"] as const).map((p) => (
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
                  : "Allowed: bandit-scan, iam-inspect. Denied: data-export."}
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
              Try typing &quot;delete&quot;, &quot;drop&quot;, or &quot;export&quot; to see the Zero-Egress policy block the action.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
