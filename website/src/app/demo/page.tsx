"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Cpu,
  Send,
  ChevronDown,
  HardDrive,
  WifiOff,
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const DEMO_TOUR_STEPS: {
  id: string;
  title: string;
  body: string;
  value: string;
  target: "dashboard" | "sessionlog" | "rightsidebar" | "inputbar" | null;
}[] = [
  {
    id: "welcome",
    title: "Policy-first agent control",
    body: "Physiclaw keeps every request inside your perimeter—no cloud egress. This walkthrough shows the control plane, audit trail, and live policy.",
    value: "Try one allowed goal, then one blocked goal, to see the guardrails.",
    target: null,
  },
  {
    id: "dashboard",
    title: "Live control plane",
    body: "Goals by role, denials, and policy checks update live. Tune Fast vs Strict; block rate and tool calls respond immediately.",
    value: "Same control surface teams use in production.",
    target: "dashboard",
  },
  {
    id: "sessionlog",
    title: "Full audit trail",
    body: "Every goal logged with role, policy check, and allow/deny. Schema matches production.",
    value: "Every decision visible and attributable.",
    target: "sessionlog",
  },
  {
    id: "rightsidebar",
    title: "Commands & actions",
    body: "Click an example goal to fill the input bar, or see recent goals and agent actions (bridge, tool_call, audit) as you run them.",
    value: "Quick way to try allowed and denied commands without typing.",
    target: "rightsidebar",
  },
  {
    id: "inputbar",
    title: "Allow, then block",
    body: "Send a goal. Role is inferred; allow/deny list is applied. Run an allowed command (e.g. kubectl get pods), then a blocked one (e.g. delete deployment).",
    value: "That contrast proves policy enforcement.",
    target: "inputbar",
  },
  {
    id: "done",
    title: "You’re all set",
    body: "Close and try one allowed goal, one denied. Watch the dashboard and log. Use Fast vs Strict to see policy tighten.",
    value: "Policy-first, zero egress, full audit. More: Docs and Whitepaper in the nav.",
    target: null,
  },
];

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
  const [tourStep, setTourStep] = useState<number | null>(0);
  const [tourSpotlightRect, setTourSpotlightRect] = useState<DOMRect | null>(null);
  const dashboardRef = useRef<HTMLElement>(null);
  const sessionLogRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLFormElement>(null);
  const rightSidebarRef = useRef<HTMLElement>(null);

  const [lastInferredPersona, setLastInferredPersona] = useState<Persona>("sre");
  const [vramUsed, setVramUsed] = useState(42);
  const [vramMax, setVramMax] = useState(48);
  const [modelId, setModelId] = useState<"70b" | "8b">("70b");
  const [strictMode, setStrictMode] = useState(false);
  const [logLines, setLogLines] = useState<LogEntry[]>(() => [
    { kind: "system", text: "Submit a goal. Persona is inferred from goal (e.g. kubectl→SRE, bandit→SecOps, dbt→Data); policy and bridge evaluate." },
  ]);
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

  const initialLogLengthRef = useRef(logLines.length);
  useEffect(() => {
    if (logLines.length <= initialLogLengthRef.current) return;
    initialLogLengthRef.current = logLines.length;
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines]);

  const tourTargetRefs = useCallback(() => ({
    dashboard: dashboardRef.current,
    sessionlog: sessionLogRef.current,
    rightsidebar: rightSidebarRef.current,
    inputbar: inputBarRef.current,
  }), []);

  useEffect(() => {
    if (tourStep === null || tourStep < 0 || tourStep >= DEMO_TOUR_STEPS.length) {
      setTourSpotlightRect(null);
      return;
    }
    const step = DEMO_TOUR_STEPS[tourStep];
    const refs = tourTargetRefs();
    const el = step.target ? refs[step.target] : null;
    if (!el) {
      setTourSpotlightRect(null);
      return;
    }
    const update = () => {
      const rect = el.getBoundingClientRect();
      setTourSpotlightRect(rect);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
    };
  }, [tourStep, tourTargetRefs]);

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

  const currentStep = tourStep !== null && tourStep >= 0 && tourStep < DEMO_TOUR_STEPS.length ? DEMO_TOUR_STEPS[tourStep] : null;
  const isFirst = tourStep === 0;
  const isLast = tourStep === DEMO_TOUR_STEPS.length - 1;
  const popupOnLeft = currentStep?.target === "sessionlog" || currentStep?.target === "rightsidebar" || currentStep?.target === "inputbar";

  return (
    <div className="min-h-screen bg-navy bg-grid relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gold/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Tour: single overlay layer with same opacity every step; clip-path cutout when spotlight */}
      <AnimatePresence>
        {tourStep !== null && currentStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            {/* One dim layer — same opacity for all steps; hole cut when spotlight exists */}
            <div
              className="absolute inset-0 bg-black/50 pointer-events-auto"
              style={
                tourSpotlightRect
                  ? (() => {
                      const g = 6;
                      const t = Math.floor(tourSpotlightRect.top) - g;
                      const b = Math.ceil(tourSpotlightRect.bottom) + g;
                      const l = Math.floor(tourSpotlightRect.left) - g;
                      const r = Math.ceil(tourSpotlightRect.right) + g;
                      return {
                        clipPath: `polygon(0 0, 100vw 0, 100vw ${t}px, ${l}px ${t}px, ${l}px ${b}px, ${r}px ${b}px, ${r}px ${t}px, 100vw ${t}px, 100vw 100vh, 0 100vh, 0 0)`,
                      };
                    })()
                  : undefined
              }
              onClick={() => setTourStep(null)}
              aria-label="Close tour"
            />
            {tourSpotlightRect && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute rounded-lg pointer-events-none ring-2 ring-gold border border-gold"
                style={{
                  left: Math.floor(tourSpotlightRect.left) - 6,
                  top: Math.floor(tourSpotlightRect.top) - 6,
                  width: Math.ceil(tourSpotlightRect.width) + 12,
                  height: Math.ceil(tourSpotlightRect.height) + 12,
                }}
              />
            )}
            <div className={`absolute inset-0 flex items-center p-4 pointer-events-none ${popupOnLeft ? "justify-start" : "justify-center"}`}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="pointer-events-auto w-full max-w-lg rounded-xl border border-navy-200/60 bg-navy-300/95 backdrop-blur-sm shadow-2xl p-5 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-sage-dim uppercase tracking-wider">
                    Step {tourStep + 1} of {DEMO_TOUR_STEPS.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTourStep(null)}
                    className="p-1.5 rounded-lg text-sage-dim hover:text-sage-light hover:bg-navy-200/50"
                    aria-label="Skip tour"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-1 w-full rounded-full bg-navy-200/40 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gold/70"
                    initial={{ width: 0 }}
                    animate={{ width: `${((tourStep ?? 0) + 1) / DEMO_TOUR_STEPS.length * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gold-light leading-tight">{currentStep.title}</h3>
                <p className="text-[15px] text-sage-light leading-relaxed">{currentStep.body}</p>
                <p className="text-sm text-sage-dim border-l-2 border-gold/50 pl-3 py-0.5 bg-navy-200/20 rounded-r">{currentStep.value}</p>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    {!isFirst && (
                      <button
                        type="button"
                        onClick={() => setTourStep((s) => (s ?? 0) - 1)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-sage-dim hover:text-sage-light hover:bg-navy-200/50"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Back
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isLast ? (
                      <button
                        type="button"
                        onClick={() => setTourStep((s) => (s ?? 0) + 1)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gold/20 text-gold hover:bg-gold/30"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTourStep(null)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gold/25 text-gold hover:bg-gold/35 border border-gold/40"
                      >
                        Close and try it
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SiteNav logoHref="/" showDocsLink />

      {/* Start / replay tour — visible when tour is closed */}
      {tourStep === null && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setTourStep(0)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-navy-200/50 bg-navy-300/90 backdrop-blur-sm text-sage-light hover:text-gold hover:border-gold/50 shadow-lg transition-colors"
            aria-label="Start demo walkthrough"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Demo walkthrough</span>
          </button>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:h-[680px]">
          {/* Left: dashboard */}
          <aside ref={dashboardRef} className="w-full lg:w-72 shrink-0 flex flex-col">
            <div className="rounded-xl border border-navy-200/50 bg-navy-300/80 backdrop-blur-sm overflow-hidden flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
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

          {/* Center: session log — fixed height, content scrolls */}
          <div className="flex-1 min-w-0 flex flex-col min-h-[480px] lg:min-h-0 lg:h-full">
            <div ref={sessionLogRef} className="rounded-xl border border-navy-200/50 bg-navy-300/80 backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden flex flex-col h-[480px] lg:h-full min-h-0">
              <div className="px-4 py-2 border-b border-navy-200/60 flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-sage-light">Session log</span>
                <span className="text-[10px] text-sage-dim">Role + policy apply to every command</span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 font-mono text-sm">
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

              <form ref={inputBarRef} onSubmit={handleSubmit} className="border-t border-navy-200/60 p-3 shrink-0">
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
              </form>
            </div>
          </div>

          {/* Right: commands and agent actions — same height as dashboard and session log */}
          <aside ref={rightSidebarRef} className="w-full lg:w-72 shrink-0 flex flex-col">
            <div className="rounded-xl border border-navy-200/50 bg-navy-300/80 backdrop-blur-sm overflow-hidden flex-1 min-h-0 flex flex-col lg:h-full min-h-[280px]">
              <div className="px-3 py-2 border-b border-navy-200/60 shrink-0">
                <span className="text-[10px] font-mono text-sage-dim uppercase tracking-wider">Commands &amp; actions</span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
                <div>
                  <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-2">Try a goal</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "kubectl get pods",
                      "bandit-scan",
                      "dbt run",
                      "delete deployment",
                      "data-export",
                    ].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => {
                          setInput(goal);
                          inputRef.current?.focus();
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-mono bg-navy-200/50 text-sage-light hover:bg-gold/20 hover:text-gold border border-navy-200/40 hover:border-gold/40 transition-colors truncate max-w-full"
                        title={`Use "${goal}" in the input bar`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-2">Recent goals</p>
                  <ul className="space-y-1.5 font-mono text-xs">
                    {logLines
                      .filter((l) => l.kind === "goal")
                      .slice(-5)
                      .reverse()
                      .map((line, i) => (
                        <li key={i} className="text-sage-light truncate pr-2" title={line.text}>
                          {line.text}
                        </li>
                      ))}
                    {logLines.filter((l) => l.kind === "goal").length === 0 && (
                      <li className="text-sage-dim">No goals yet</li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-2">Agent actions</p>
                  <ul className="space-y-1.5 font-mono text-[11px]">
                    {logLines
                      .filter((l) => l.kind === "bridge" || l.kind === "tool_call" || l.kind === "audit")
                      .slice(-6)
                      .reverse()
                      .map((line, i) => (
                        <li
                          key={i}
                          className={
                            line.kind === "audit"
                              ? "text-crimson-light/90 truncate pr-2"
                              : line.kind === "bridge"
                                ? "text-sage truncate pr-2"
                                : "text-gold-light/90 truncate pr-2"
                          }
                          title={line.text}
                        >
                          <span className="text-sage-dim">[{line.kind}]</span> {line.text.slice(0, 40)}
                          {line.text.length > 40 ? "…" : ""}
                        </li>
                      ))}
                    {logLines.filter((l) => l.kind === "bridge" || l.kind === "tool_call" || l.kind === "audit").length === 0 && (
                      <li className="text-sage-dim">None yet</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>

      </main>

      <SiteFooter />
    </div>
  );
}
