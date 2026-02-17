"use client";

import Link from "next/link";
import {
  Github,
  ChevronDown,
  Server,
  Plug,
  MessageSquare,
} from "lucide-react";
import QuickStartTerminal from "@/components/QuickStartTerminal";
import AgentSkillMatrix from "@/components/AgentSkillMatrix";
import SecurityMatrix from "@/components/SecurityMatrix";
import ExtendMatrix from "@/components/ExtendMatrix";
import IntegrationGrid from "@/components/IntegrationGrid";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

// ─── Page ──────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-navy bg-grid relative overflow-hidden">
      {/* Ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gold/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <SiteNav logoHref="/" showDocsLink />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative z-10 pt-20 pb-8 px-6" id="quick-start">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6" style={{ color: "#f7e2aa" }}>
            Functional AI agents on{" "}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #F4D58D, #BF0603)" }}>
              your hardware
            </span>
            .
          </h1>

          <p className="text-lg sm:text-xl text-sage max-w-2xl mx-auto leading-relaxed mb-10">
            Open-source software that runs AI agents on your own servers. No cloud, no telemetry, no lock-in. Deploy on bare metal, VMs, or Kubernetes.
          </p>

          <div className="flex justify-center gap-4 mb-16">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
            >
              Try Demo
            </Link>
            <a
              href="https://github.com/CommanderZed/Physiclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
            >
              <Github className="w-4 h-4" />
              Star on GitHub
            </a>
          </div>

          {/* Quick Start Terminal */}
          <QuickStartTerminal />

          {/* How it works */}
          <div className="mt-16 max-w-4xl mx-auto" id="how-it-works">
            <p className="text-xs font-mono text-sage-dim uppercase tracking-widest mb-6 text-center">How it works</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-navy-300/60 border border-navy-200/50 flex items-center justify-center mb-3">
                  <Server className="w-6 h-6 text-gold" />
                </div>
                <p className="text-sm font-semibold text-gold-light mb-1">1. Deploy on your infrastructure</p>
                <p className="text-xs text-sage-dim">Run Physiclaw on bare metal, VMs, or Kubernetes. Everything stays inside your perimeter.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-navy-300/60 border border-navy-200/50 flex items-center justify-center mb-3">
                  <Plug className="w-6 h-6 text-gold" />
                </div>
                <p className="text-sm font-semibold text-gold-light mb-1">2. Connect to your tools</p>
                <p className="text-xs text-sage-dim">Agents plug into Prometheus, K8s, Vault, Slack, and other on-prem services you already use.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-navy-300/60 border border-navy-200/50 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6 text-gold" />
                </div>
                <p className="text-sm font-semibold text-gold-light mb-1">3. Chat or command; agents run</p>
                <p className="text-xs text-sage-dim">From terminal or API you assign tasks. Agents execute on your stack with no data leaving your network.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <a href="#agents" className="text-sage-dim hover:text-sage transition-colors">
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ COMMUNITY VOICES ═══════════ */}
      <section className="relative z-10 py-20 px-6" id="community">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-navy-200/60" />
              <span className="text-xs font-mono text-sage-dim uppercase tracking-widest">
                Community voices
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-navy-200/60" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gold-light mb-2">
              Why Physiclaw
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Ok this is more what I was looking for. No cloudshits, no social media logins.",
              "The data egress issue is exactly why more teams are going local-first.",
              "The 'one generic assistant with root access to everything' problem is exactly what kills agent setups… Breaking it into role-specific agents with scoped tool access is the right call.",
              "How dare you not want to give all your banking and API keys to a cloud company!",
              "SQLite FTS5 + LanceDB is exactly the kind of 'no-cloud-dependency' stack that belongs in Physiclaw.",
              "The air-gapped agent runtime space is weirdly underserved for how many people need it.",
            ].map((quote, i) => (
              <blockquote
                key={i}
                className="rounded-xl border border-navy-200/50 bg-navy-300/30 px-4 py-3 text-sm text-sage leading-relaxed"
              >
                &ldquo;{quote}&rdquo;
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AGENT ROLES ═══════════ */}
      <section className="relative z-10 py-24 px-6" id="agents">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-navy-200/60" />
              <span className="text-xs font-mono text-sage-dim uppercase tracking-widest">
                Agent Roles
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-navy-200/60" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gold-light mb-4">
              Specialized agents, your infrastructure
            </h2>
            <p className="text-center text-sage max-w-xl mx-auto">
              Pre-built roles for SRE, security, data, and code tasks.
              Each loads its own toolchain.
            </p>
          </div>

          <AgentSkillMatrix />
        </div>
      </section>

      {/* ═══════════ INTEGRATIONS ═══════════ */}
      <section className="relative z-10 py-24 px-6" id="integrations">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-navy-200/60" />
              <span className="text-xs font-mono text-sage-dim uppercase tracking-widest">
                Integrations
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-navy-200/60" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gold-light mb-4">
              Common enterprise on-prem services
            </h2>
            <p className="text-center text-sage max-w-xl mx-auto">
              Connect agents to the tools you already run inside your perimeter.
            </p>
          </div>

          <IntegrationGrid />
        </div>
      </section>

      {/* ═══════════ SECURITY ═══════════ */}
      <section className="relative z-10 py-24 px-6" id="security">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-navy-200/60" />
              <span className="text-xs font-mono text-sage-dim uppercase tracking-widest">
                Security
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-navy-200/60" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gold-light mb-4">
              Nothing leaves{" "}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #BF0603, #8D0801)" }}>
                your network
              </span>
              .
            </h2>
            <p className="text-center text-sage max-w-2xl mx-auto">
              Every layer runs inside your perimeter. No telemetry,
              no phone-home, no external trust boundaries.
            </p>
          </div>

          <SecurityMatrix />
        </div>
      </section>

      {/* ═══════════ EXTEND ═══════════ */}
      <section className="relative z-10 py-24 px-6" id="extend">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-navy-200/60" />
              <span className="text-xs font-mono text-sage-dim uppercase tracking-widest">
                Extend
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-navy-200/60" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-center text-gold-light mb-4">
              Everything is a{" "}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #F4D58D, #8aa89b)" }}>
                config change
              </span>
              .
            </h2>
            <p className="text-center text-sage max-w-2xl mx-auto">
              Swap runtimes, vector stores, and audit backends in YAML.
              No vendor calls, no lock-in.
            </p>
          </div>

          <ExtendMatrix />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
