"use client";

import {
  Github,
  ExternalLink,
  Activity,
  Zap,
  ChevronDown,
} from "lucide-react";
import QuickStartTerminal from "@/components/QuickStartTerminal";
import AgentSkillMatrix from "@/components/AgentSkillMatrix";
import SecurityMatrix from "@/components/SecurityMatrix";
import ExtendMatrix from "@/components/ExtendMatrix";
import PhysiclawLogo from "@/components/PhysiclawLogo";

// ─── Page ──────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-navy bg-grid relative overflow-hidden">
      {/* Ambient top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gold/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* ═══════════ NAV ═══════════ */}
      <nav className="relative z-20 border-b border-navy-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PhysiclawLogo height={26} />
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-gold/10 text-gold border border-gold/15">
              v0.9-beta
            </span>
          </div>
          <a
            href="https://github.com/physiclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative z-10 pt-20 pb-8 px-6" id="quick-start">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-navy-300/60 text-sage border border-navy-200/60 mb-8">
            <Activity className="w-3.5 h-3.5 text-sage-light" />
            Open Source &middot; Apache 2.0 &middot; Self-Hosted
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6" style={{ color: "#f7e2aa" }}>
            Run AI agents
            <br />
            on{" "}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #F4D58D, #BF0603)" }}>
              your hardware
            </span>
            .
          </h1>

          <p className="text-lg sm:text-xl text-sage max-w-2xl mx-auto leading-relaxed mb-12">
            Open-source agent orchestration. Air-gapped, self-hosted,
            no SaaS dependency. You own the entire stack.
          </p>

          <div className="flex justify-center gap-4 mb-16">
            <a
              href="#quick-start"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gold text-navy hover:bg-gold-light transition-colors"
            >
              <Zap className="w-4 h-4" />
              Get Started
            </a>
            <a
              href="https://github.com/physiclaw"
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

          <div className="mt-12 flex justify-center">
            <a href="#agents" className="text-sage-dim hover:text-sage transition-colors">
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </a>
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

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 border-t border-navy-200/60">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left */}
            <div className="flex items-center gap-6">
              <PhysiclawLogo height={20} />
              <div className="h-4 w-px bg-navy-200/60" />
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-light opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sage" />
                </span>
                <span className="text-sage-light">All Systems Green</span>
              </div>
            </div>

            {/* Center links */}
            <div className="flex items-center gap-6 text-sm text-sage-dim">
              <a
                href="https://github.com/physiclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold-light transition-colors flex items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
              <a
                href="https://discord.gg/physiclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold-light transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Discord
              </a>
              <a
                href="https://github.com/physiclaw/core/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold-light transition-colors"
              >
                Apache 2.0
              </a>
            </div>

            {/* Right */}
            <p className="text-xs text-sage-dim font-mono">
              &copy; {new Date().getFullYear()} Physiclaw Contributors
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
