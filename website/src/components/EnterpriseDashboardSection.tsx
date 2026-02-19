"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// Sparkline: array of 0–100 values
function Sparkline({ data, color = "gold" }: { data: number[]; color?: "gold" | "sage" | "crimson" }) {
  const max = Math.max(...data);
  const colorClass =
    color === "gold"
      ? "from-gold/70 to-gold/20"
      : color === "sage"
        ? "from-sage/70 to-sage/20"
        : "from-crimson/60 to-crimson/20";
  return (
    <div className="flex items-end gap-[1px] h-5 w-full">
      {data.map((v, i) => (
        <motion.div
          key={i}
          className={`flex-1 min-w-[1px] rounded-sm bg-gradient-to-t ${colorClass}`}
          initial={{ height: 0 }}
          animate={{ height: `${max > 0 ? (v / max) * 100 : 0}%` }}
          transition={{ delay: i * 0.03, duration: 0.35 }}
        />
      ))}
    </div>
  );
}

// KPI tile with value + sparkline
function InsightTile({
  label,
  value,
  sparkData,
  color = "gold",
  delay = 0,
}: {
  label: string;
  value: number | string;
  sparkData: number[];
  color?: "gold" | "sage" | "crimson";
  delay?: number;
}) {
  return (
    <motion.div
      className="rounded-xl border border-navy-200/40 bg-navy-300/30 px-4 py-3 flex flex-col"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay, duration: 0.35 }}
    >
      <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-1">{label}</p>
      <span className="text-xl font-semibold text-gold-light tabular-nums">{value}</span>
      <div className="mt-2 h-5">
        <Sparkline data={sparkData} color={color} />
      </div>
    </motion.div>
  );
}

// Line chart (single or dual series) — thin strokes, light area fill
function MiniLineChart({
  points,
  pointsSecondary,
  label,
  legend,
  unit,
}: {
  points: number[];
  pointsSecondary?: number[];
  label: string;
  legend?: [string, string];
  unit?: string;
}) {
  const w = 100;
  const h = 48;
  const padding = { top: 4, right: 2, bottom: 6, left: 2 };
  const plotH = h - padding.top - padding.bottom;
  const plotW = w - padding.left - padding.right;
  const all = pointsSecondary ? [...points, ...pointsSecondary] : points;
  const max = Math.max(...all);
  const min = Math.min(...all);
  const range = max - min || 1;
  const xStep = plotW / (points.length - 1);
  const toPath = (pts: number[]) =>
    pts
      .map((y, i) => {
        const x = padding.left + i * xStep;
        const yy = padding.top + plotH - ((y - min) / range) * plotH;
        return `${i === 0 ? "M" : "L"} ${x} ${yy}`;
      })
      .join(" ");
  return (
    <div className="rounded-xl border border-navy-200/40 bg-navy-300/30 px-4 py-3 h-full flex flex-col">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider">{label}</p>
        {unit && <span className="text-[9px] font-mono text-sage-dim/80">{unit}</span>}
      </div>
      {legend && (
        <div className="flex gap-4 mb-2">
          <span className="flex items-center gap-1.5 text-[10px] text-sage-dim">
            <span className="w-3 h-0.5 rounded-full bg-gold/90" />
            {legend[0]}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-sage-dim">
            <span className="w-3 h-0.5 rounded-full bg-sage/90" />
            {legend[1]}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full flex-1 min-h-[48px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F4D58D" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#F4D58D" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="lineGradSage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#708D81" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#708D81" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Subtle grid */}
        {[0.25, 0.5, 0.75].map((q) => (
          <line
            key={q}
            x1={padding.left}
            y1={padding.top + plotH * (1 - q)}
            x2={w - padding.right}
            y2={padding.top + plotH * (1 - q)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}
        <path
          d={`${toPath(points)} L ${w - padding.right} ${h - padding.bottom} L ${padding.left} ${h - padding.bottom} Z`}
          fill="url(#lineGradGold)"
        />
        <path
          d={toPath(points)}
          fill="none"
          stroke="#F4D58D"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pointsSecondary && (
          <>
            <path
              d={`${toPath(pointsSecondary)} L ${w - padding.right} ${h - padding.bottom} L ${padding.left} ${h - padding.bottom} Z`}
              fill="url(#lineGradSage)"
            />
            <path
              d={toPath(pointsSecondary)}
              fill="none"
              stroke="#708D81"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
    </div>
  );
}

// Horizontal bar chart
function BarChartPanel({ data, label, unit }: { data: { name: string; value: number }[]; label: string; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="rounded-xl border border-navy-200/40 bg-navy-300/30 px-4 py-3 h-full flex flex-col">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider">{label}</p>
        {unit && <span className="text-[9px] font-mono text-sage-dim/80">{unit}</span>}
      </div>
      <div className="space-y-2.5 flex-1">
        {data.map((d, i) => (
          <motion.div
            key={d.name}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <span className="text-[10px] text-sage-dim w-16 shrink-0">{d.name}</span>
            <div className="flex-1 h-2.5 rounded-full bg-navy-200/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-gold/50 to-gold/80"
                initial={{ width: 0 }}
                whileInView={{ width: `${(d.value / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-gold-light tabular-nums w-8 text-right">{d.value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Stacked bar or grouped: goals by persona
function GoalsByPersona() {
  const data = [
    { persona: "sre", value: 142, color: "bg-gold/70" },
    { persona: "secops", value: 68, color: "bg-crimson/60" },
    { persona: "data_architect", value: 52, color: "bg-sage/70" },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="rounded-xl border border-navy-200/40 bg-navy-300/30 px-4 py-3 h-full flex flex-col">
      <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-3">Goals by persona</p>
      <div className="flex gap-1 h-6 rounded overflow-hidden flex-1 min-h-[24px]">
        {data.map((d, i) => (
          <motion.div
            key={d.persona}
            className={`${d.color} flex items-center justify-center`}
            initial={{ width: 0 }}
            whileInView={{ width: `${(d.value / total) * 100}%` }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
          >
            <span className="text-[9px] font-medium text-navy-900 mix-blend-luminosity opacity-90 hidden sm:inline">
              {d.persona}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap">
        {data.map((d) => (
          <span key={d.persona} className="text-[10px] text-sage-dim">
            {d.persona}: <span className="text-gold-light">{d.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Simple ring/donut for auth outcome
function AuthOutcomeRing() {
  const ok = 98;
  const denied = 2;
  const total = ok + denied;
  const circumference = 2 * Math.PI * 18;
  const okOffset = (denied / total) * circumference;
  return (
    <div className="rounded-xl border border-navy-200/40 bg-navy-300/30 px-4 py-3 h-full flex flex-col items-center justify-center">
      <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-2 w-full text-left">Auth outcomes</p>
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <motion.circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="#708D81"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={okOffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: okOffset }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
          <motion.circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="#BF0603"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (ok / total) * circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference - (ok / total) * circumference }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </svg>
        <span className="absolute text-xs font-semibold text-gold-light tabular-nums">{total}</span>
      </div>
      <div className="flex gap-3 mt-2 text-[10px]">
        <span className="text-sage-dim">ok <span className="text-sage">{ok}%</span></span>
        <span className="text-sage-dim">denied <span className="text-crimson">{denied}%</span></span>
      </div>
    </div>
  );
}

// Recent activity
function RecentActivity() {
  const lines = [
    { event: "goal", persona: "sre", ts: "12:04:02", detail: "restart nginx" },
    { event: "tool_call", persona: "secops", ts: "12:03:58", detail: "bandit-scan" },
    { event: "goal", persona: "data_architect", ts: "12:03:41", detail: "dbt run" },
    { event: "tool_call", persona: "sre", ts: "12:03:22", detail: "kubectl-get" },
    { event: "goal", persona: "sre", ts: "12:03:10", detail: "check pod status" },
    { event: "tool_call", persona: "data_architect", ts: "12:02:55", detail: "duckdb-query" },
  ];
  return (
    <div className="rounded-xl border border-navy-200/40 bg-navy-300/30 px-4 py-3">
      <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-2">Recent activity</p>
      <div className="space-y-1.5 font-mono text-[10px] max-h-32 overflow-hidden">
        {lines.map((l, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2 text-sage-dim flex-wrap"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 + i * 0.06 }}
          >
            <span className="w-2 h-2 rounded-full bg-sage/50 shrink-0" />
            <span className="text-sage/90">{l.event}</span>
            <span className="text-gold/80">{l.persona}</span>
            <span className="text-sage-dim/70 truncate max-w-[120px]">{l.detail}</span>
            <span className="text-sage-dim/80 ml-auto shrink-0">{l.ts}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Top tools call count
function TopTools() {
  const tools = [
    { name: "kubectl-get", count: 89 },
    { name: "bandit-scan", count: 42 },
    { name: "duckdb-query", count: 31 },
    { name: "dbt run", count: 28 },
    { name: "log-aggregator", count: 19 },
  ];
  const max = Math.max(...tools.map((t) => t.count), 1);
  return (
    <div className="rounded-xl border border-navy-200/40 bg-navy-300/30 px-4 py-3 h-full flex flex-col">
      <p className="text-[10px] font-mono text-sage-dim uppercase tracking-wider mb-3">Top tools (24h)</p>
      <div className="space-y-2">
        {tools.map((t, i) => (
          <motion.div
            key={t.name}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 + i * 0.05 }}
          >
            <span className="text-[10px] text-sage-dim truncate flex-1">{t.name}</span>
            <div className="w-16 h-1.5 rounded-full bg-navy-200/30 overflow-hidden shrink-0">
              <motion.div
                className="h-full rounded-full bg-sage/60"
                initial={{ width: 0 }}
                whileInView={{ width: `${(t.count / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 + i * 0.05, duration: 0.4 }}
              />
            </div>
            <span className="text-[10px] text-gold-light tabular-nums w-6 text-right">{t.count}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function EnterpriseDashboardSection() {
  const [goals, setGoals] = useState(312);
  const [tools, setTools] = useState(1084);
  useEffect(() => {
    const t = setInterval(() => {
      setGoals((g) => g + Math.floor(Math.random() * 2));
      setTools((n) => n + Math.floor(Math.random() * 4));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const sparkGoals = [40, 55, 48, 72, 65, 80, 70, 85, 78, 72, 88, 90];
  const sparkTools = [60, 75, 90, 85, 95, 88, 100, 92, 88, 95, 90, 98];
  const sparkViolations = [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0];
  const rateGoals = [20, 35, 28, 45, 52, 48, 60, 55, 62, 58, 70, 75];
  const rateTools = [15, 28, 35, 42, 48, 52, 58, 55, 62, 68, 72, 78];
  const latencyBars = [
    { name: "L2", value: 12 },
    { name: "L3", value: 34 },
    { name: "combined", value: 41 },
  ];

  return (
    <section className="relative z-10 py-24 px-6" id="dashboard">
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gold/[0.04] rounded-full blur-[100px]" />
      </div>
      <div className="max-w-7xl mx-auto relative">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-navy-200/60" />
            <span className="text-xs font-mono text-sage-dim uppercase tracking-widest">
              Control plane
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-navy-200/60" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gold-light mb-4">
            Your stack,{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(to right, #F4D58D, #708D81)" }}
            >
              at a glance
            </span>
          </h2>
          <p className="text-center text-sage max-w-2xl mx-auto">
            Metrics, latency, and activity—all on-prem. Scrape Prometheus, import Grafana, or watch the audit log. No cloud, no SaaS.
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <InsightTile label="Goals" value={goals} sparkData={sparkGoals} color="gold" delay={0} />
          <InsightTile label="Tool calls" value={tools} sparkData={sparkTools} color="sage" delay={0.05} />
          <InsightTile label="Violations" value={0} sparkData={sparkViolations} color="crimson" delay={0.1} />
          <InsightTile label="Egress blocks" value={0} sparkData={[0, 0, 0, 0, 0, 0]} color="crimson" delay={0.15} />
        </div>

        {/* Charts row 1: rate (dual line) + memory latency */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="min-h-[140px]"
          >
            <MiniLineChart
              points={rateGoals}
              pointsSecondary={rateTools}
              label="Request rate (5m)"
              legend={["Goals", "Tool calls"]}
              unit="req/min"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="min-h-[140px]"
          >
            <BarChartPanel data={latencyBars} label="Memory retrieval" unit="ms avg" />
          </motion.div>
        </div>

        {/* Charts row 2: goals by persona + auth ring + top tools */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.28 }}
            className="min-h-[100px]"
          >
            <GoalsByPersona />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.32 }}
          >
            <AuthOutcomeRing />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.36 }}
          >
            <TopTools />
          </motion.div>
        </div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <RecentActivity />
        </motion.div>

        <div className="mt-10 text-center flex flex-wrap justify-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
          >
            Try demo
          </Link>
          <a
            href="https://github.com/CommanderZed/Physiclaw/blob/main/docs/grafana/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-sage-dim hover:text-gold-light transition-colors"
          >
            Grafana dashboard
          </a>
        </div>
      </div>
    </section>
  );
}
