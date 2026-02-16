"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PhysiclawLogo from "@/components/PhysiclawLogo";

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-navy bg-grid relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gold/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <nav className="relative z-20 border-b border-navy-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <PhysiclawLogo height={26} />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <article className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <header className="mb-14">
          <p className="text-xs font-mono text-sage-dim uppercase tracking-widest mb-4">
            Whitepaper
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gold-light leading-tight mb-4">
            Physiclaw: Open-Source Agent Orchestration for Your Infrastructure
          </h1>
          <p className="text-sage text-lg leading-relaxed">
            A technical overview of design goals, architecture, and security for teams
            that need AI agents to run entirely on their own hardware.
          </p>
        </header>

        <div className="max-w-none space-y-10 text-sage leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gold-light mb-3">Introduction</h2>
            <p>
              Most AI agent platforms today require cloud connectivity, send telemetry
              upstream, or lock you into a vendor ecosystem. Physiclaw takes a different
              path. It is open-source agent orchestration that runs entirely on your
              infrastructure. There is no SaaS dependency, no telemetry, and no
              phone-home. You own the entire stack.
            </p>
            <p>
              This document describes why Physiclaw exists, how it is built, and how it
              fits into environments where data sovereignty and air-gap readiness are
              non-negotiable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gold-light mb-3">Why Physiclaw</h2>
            <p>
              Physiclaw is designed for organizations that need specialized AI agents
              but cannot or will not send data to the cloud. It is air-gap ready, meaning
              it runs fully offline with no external trust boundaries. It is self-hosted:
              you deploy on bare metal, virtual machines, or Kubernetes. Your hardware,
              your rules. The project is open source under the Apache 2.0 license and
              community-driven, and it is transparent by default. Perhaps most important,
              nothing leaves your network. Ever.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gold-light mb-3">Agent Roles</h2>
            <p>
              Physiclaw ships with pre-built agent personas, each with its own toolchain.
              The SRE agent focuses on site reliability: Prometheus, Kubernetes,
              Terraform, Grafana, and alerting. It watches uptime, manages
              infrastructure as code, and can auto-remediate. The SecOps Guardian is for
              security operations: log analysis, CVE scanning, IAM, SIEM, and
              compliance. It triages alerts, enforces policy, and hardens the perimeter.
              The Data Architect handles data engineering: SQL, ETL pipelines, Snowflake,
              dbt, and data quality. It optimizes schemas, orchestrates pipelines, and
              checks quality. The Code Janitor keeps code quality high: refactoring,
              unit tests, linting, CI/CD, and docs. It keeps CI green and tech debt low.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gold-light mb-3">Security Architecture</h2>
            <p>
              Every layer runs inside your perimeter. Physiclaw uses defense-in-depth
              with five concentric security rings. Ring zero is zero-trust isolation:
              gVisor, Seccomp-BPF, eBPF, UCAN, and AES-256. Ring one is end-to-end
              encryption: mTLS, SPIFFE, XChaCha20, X.509, and automatic key rotation.
              Ring two is hardware secrets: HSM, TPM 2.0, Vault, PKCS#11, and sealed
              keys. Ring three is observability and provenance: OpenTelemetry,
              attestation, Merkle logs, Sigstore, and WORM storage. Ring four is
              air-gap and compliance: offline operation and alignment with SOC 2,
              HIPAA, FedRAMP, and ISO 27001 where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gold-light mb-3">Configuration and Extensibility</h2>
            <p>
              Everything is a config change. You swap runtimes, vector stores, and
              audit backends in YAML. The runtime backend is hot-swappable: vLLM, TGI,
              Ollama, Triton, and others. You choose the model, control GPU offload,
              and set per-node parallelism. For knowledge, you pick your vector store:
              pgvector, FAISS, Milvus, Qdrant. You choose the embedder, the chunking
              strategy, and optional re-ranking. For audit, you select a backend such
              as a Merkle log, signing with Cosign, export to a SIEM sink, and
              retention policy. There are no vendor calls and no lock-in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gold-light mb-3">Architecture and Origins</h2>
            <p>
              Physiclaw is adapted from OpenClaw (MIT). It was re-engineered for
              enterprise bare-metal deployment with zero external dependencies. The
              core engine includes an agent execution engine with tools and workspace,
              a CLI, YAML config with validation, service management for launchd and
              systemd, an HTTP and WebSocket control plane, plugin infrastructure,
              provider integrations for AI models, and security layers for audit,
              scanning, and hardening. Agent personas live in skill definitions for
              SRE, SecOps, data architect, and code janitor. You can extend with
              additional plugins and run the gateway to drive agents from your own
              tooling.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gold-light mb-3">Conclusion</h2>
            <p>
              Physiclaw exists to give teams a way to run specialized AI agents on
              their own hardware with full control and no dependency on the cloud. If
              you need air-gap readiness, zero telemetry, and open-source transparency,
              Physiclaw is built for that. Deploy via one-liner, Docker, or Helm;
              configure with YAML; and keep everything inside your perimeter.
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-navy-200/60">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-sage-light hover:text-gold-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </footer>
      </article>
    </div>
  );
}
