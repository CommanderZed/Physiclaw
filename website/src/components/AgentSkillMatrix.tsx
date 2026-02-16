"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server,
  Shield,
  Database,
  Code2,
  ChevronRight,
} from "lucide-react";

// ---------- data ----------

interface Skill {
  id: string;
  label: string;
  x: number;
  y: number;
  personas: string[];
}

interface Persona {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  skills: string[];
  description: string;
}

const personas: Persona[] = [
  {
    id: "sre",
    name: "The SRE",
    subtitle: "Site Reliability Engineer",
    icon: Server,
    color: "#F4D58D",
    bgClass: "bg-gold/10",
    borderClass: "border-gold/30",
    textClass: "text-gold",
    skills: ["prometheus", "kubernetes", "terraform", "grafana", "alerting"],
    description:
      "Prometheus, K8s, Terraform. Watches uptime, manages IaC, auto-remediates.",
  },
  {
    id: "secops",
    name: "The SecOps Guardian",
    subtitle: "Security Operations",
    icon: Shield,
    color: "#BF0603",
    bgClass: "bg-crimson/10",
    borderClass: "border-crimson/30",
    textClass: "text-crimson",
    skills: ["log-analysis", "cve-scanning", "iam", "siem", "compliance"],
    description:
      "Log analysis, CVE scanning, IAM enforcement. Triages alerts, enforces policy.",
  },
  {
    id: "data",
    name: "The Data Architect",
    subtitle: "Data Engineering",
    icon: Database,
    color: "#708D81",
    bgClass: "bg-sage/10",
    borderClass: "border-sage/30",
    textClass: "text-sage-light",
    skills: ["sql", "etl-pipelines", "snowflake", "dbt", "data-quality"],
    description:
      "SQL, ETL, dbt. Optimizes schemas, orchestrates pipelines, checks quality.",
  },
  {
    id: "code",
    name: "The Code Janitor",
    subtitle: "Code Quality",
    icon: Code2,
    color: "#8D0801",
    bgClass: "bg-crimson-dark/10",
    borderClass: "border-crimson-dark/30",
    textClass: "text-crimson-dark",
    skills: ["refactoring", "unit-tests", "linting", "ci-cd", "docs"],
    description:
      "Refactoring, tests, linting. Keeps CI green and tech debt low.",
  },
];

const skills: Skill[] = [
  { id: "prometheus", label: "Prometheus", x: 20, y: 15, personas: ["sre"] },
  { id: "kubernetes", label: "K8s", x: 45, y: 10, personas: ["sre"] },
  { id: "terraform", label: "Terraform", x: 70, y: 20, personas: ["sre"] },
  { id: "grafana", label: "Grafana", x: 35, y: 35, personas: ["sre"] },
  { id: "alerting", label: "Alerting", x: 55, y: 30, personas: ["sre"] },

  { id: "log-analysis", label: "Log Analysis", x: 15, y: 50, personas: ["secops"] },
  { id: "cve-scanning", label: "CVE Scan", x: 40, y: 48, personas: ["secops"] },
  { id: "iam", label: "IAM", x: 65, y: 45, personas: ["secops"] },
  { id: "siem", label: "SIEM", x: 25, y: 65, personas: ["secops"] },
  { id: "compliance", label: "Compliance", x: 50, y: 60, personas: ["secops"] },

  { id: "sql", label: "SQL", x: 80, y: 40, personas: ["data"] },
  { id: "etl-pipelines", label: "ETL", x: 75, y: 55, personas: ["data"] },
  { id: "snowflake", label: "Snowflake", x: 85, y: 65, personas: ["data"] },
  { id: "dbt", label: "dbt", x: 60, y: 72, personas: ["data"] },
  { id: "data-quality", label: "Quality", x: 78, y: 80, personas: ["data"] },

  { id: "refactoring", label: "Refactor", x: 15, y: 80, personas: ["code"] },
  { id: "unit-tests", label: "Tests", x: 35, y: 85, personas: ["code"] },
  { id: "linting", label: "Linting", x: 50, y: 90, personas: ["code"] },
  { id: "ci-cd", label: "CI/CD", x: 30, y: 75, personas: ["code"] },
  { id: "docs", label: "Docs", x: 45, y: 78, personas: ["code"] },
];

// edges connecting nodes within the same persona group
const edges: [string, string][] = [
  ["prometheus", "grafana"],
  ["grafana", "alerting"],
  ["kubernetes", "terraform"],
  ["kubernetes", "alerting"],
  ["prometheus", "kubernetes"],

  ["log-analysis", "siem"],
  ["cve-scanning", "iam"],
  ["siem", "compliance"],
  ["log-analysis", "cve-scanning"],
  ["iam", "compliance"],

  ["sql", "etl-pipelines"],
  ["etl-pipelines", "snowflake"],
  ["snowflake", "data-quality"],
  ["dbt", "etl-pipelines"],
  ["sql", "dbt"],

  ["refactoring", "unit-tests"],
  ["unit-tests", "linting"],
  ["ci-cd", "unit-tests"],
  ["refactoring", "ci-cd"],
  ["linting", "docs"],
];

// ---------- component ----------

export default function AgentSkillMatrix() {
  const [activePersona, setActivePersona] = useState<string | null>(null);

  const activePersonaObj = personas.find((p) => p.id === activePersona);

  const getNodeColor = (skill: Skill) => {
    if (!activePersona) return "#4a5f55"; // sage-dim
    const persona = personas.find((p) => p.id === activePersona);
    if (persona && skill.personas.includes(activePersona)) return persona.color;
    return "#071c33"; // navy-400 (dimmed)
  };

  const getEdgeOpacity = (a: string, b: string) => {
    if (!activePersona) return 0.08;
    const skillA = skills.find((s) => s.id === a);
    const skillB = skills.find((s) => s.id === b);
    if (
      skillA?.personas.includes(activePersona) &&
      skillB?.personas.includes(activePersona)
    )
      return 0.6;
    return 0.03;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature matches edge callback (a, b)
  const getEdgeColor = (a: string, b: string) => {
    if (!activePersona) return "#0d2e4a";
    const skillA = skills.find((s) => s.id === a);
    const persona = personas.find((p) => p.id === activePersona);
    if (
      skillA?.personas.includes(activePersona) &&
      persona
    )
      return persona.color;
    return "#071c33";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
      {/* Left — Persona List */}
      <div className="space-y-3">
        {personas.map((persona) => {
          const Icon = persona.icon;
          const isActive = activePersona === persona.id;
          return (
            <motion.button
              key={persona.id}
              onClick={() =>
                setActivePersona(isActive ? null : persona.id)
              }
              onMouseEnter={() => setActivePersona(persona.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-300 ${
                isActive
                  ? `${persona.bgClass} ${persona.borderClass}`
                  : "border-navy-200/50 bg-navy-300/40 hover:border-navy-200/80"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? persona.bgClass : "bg-navy-200/60"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? persona.textClass : "text-sage-dim"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm font-semibold ${
                        isActive ? persona.textClass : "text-sage-light"
                      }`}
                    >
                      {persona.name}
                    </h3>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isActive
                          ? `${persona.textClass} rotate-90`
                          : "text-sage-dim"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-sage-dim mt-0.5">
                    {persona.subtitle}
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-sage mt-3 leading-relaxed">
                      {persona.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {persona.skills.map((sid) => {
                        const skill = skills.find((s) => s.id === sid);
                        return (
                          <span
                            key={sid}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${persona.bgClass} ${persona.textClass} border ${persona.borderClass}`}
                          >
                            {skill?.label ?? sid}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Right — Constellation SVG */}
      <div className="relative w-full aspect-square max-h-[520px] rounded-xl border border-navy-200/50 bg-navy/60 overflow-hidden">
        {/* Background glow */}
        {activePersonaObj && (
          <motion.div
            key={activePersonaObj.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${activePersonaObj.color}, transparent 70%)`,
            }}
          />
        )}

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Edges */}
          {edges.map(([a, b]) => {
            const sA = skills.find((s) => s.id === a)!;
            const sB = skills.find((s) => s.id === b)!;
            return (
              <motion.line
                key={`${a}-${b}`}
                x1={sA.x}
                y1={sA.y}
                x2={sB.x}
                y2={sB.y}
                stroke={getEdgeColor(a, b)}
                strokeWidth={0.3}
                animate={{ opacity: getEdgeOpacity(a, b) }}
                transition={{ duration: 0.5 }}
              />
            );
          })}

          {/* Nodes */}
          {skills.map((skill) => {
            const isHighlighted =
              activePersona && skill.personas.includes(activePersona);
            const color = getNodeColor(skill);

            return (
              <g key={skill.id}>
                {/* Outer glow ring */}
                {isHighlighted && (
                  <motion.circle
                    cx={skill.x}
                    cy={skill.y}
                    r={3.5}
                    fill="none"
                    stroke={color}
                    strokeWidth={0.15}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: 1 }}
                    transition={{
                      opacity: { repeat: Infinity, duration: 2 },
                      scale: { duration: 0.4 },
                    }}
                  />
                )}

                {/* Main dot */}
                <motion.circle
                  cx={skill.x}
                  cy={skill.y}
                  fill={color}
                  animate={{
                    r: isHighlighted ? 2 : 1,
                    opacity: isHighlighted ? 1 : activePersona ? 0.2 : 0.5,
                  }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
                />

                {/* Label */}
                <motion.text
                  x={skill.x}
                  y={skill.y + 4.5}
                  textAnchor="middle"
                  className="font-mono"
                  fill={isHighlighted ? color : "#4a5f55"}
                  fontSize={isHighlighted ? 2.4 : 2}
                  animate={{
                    opacity: isHighlighted ? 1 : activePersona ? 0.15 : 0.35,
                  }}
                  transition={{ duration: 0.4 }}
                >
                  {skill.label}
                </motion.text>
              </g>
            );
          })}
        </svg>

        {/* "No selection" hint */}
        {!activePersona && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sage-dim text-sm font-mono">
              ← Hover a persona to illuminate
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
