"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

// ─── Doc section shape for search ───────────────────────────────────

interface DocSection {
  id: string;
  title: string;
  keywords: string;
  content: React.ReactNode;
}

// ─── Sections data ──────────────────────────────────────────────────

function DocSections(): DocSection[] {
  return [
    {
      id: "what-is-physiclaw",
      title: "What is Physiclaw?",
      keywords: "what is physiclaw definition open source AI agents self-hosted",
      content: (
        <>
          <p className="mb-4">
            Physiclaw is open-source software that runs AI agents entirely on your own servers. It provides agent orchestration with no cloud dependency, no telemetry, and no vendor lock-in. You deploy on bare metal, virtual machines, or Kubernetes and keep full control of your data and infrastructure.
          </p>
          <p>
            The project is adapted from OpenClaw (MIT), re-engineered for enterprise bare-metal deployment with zero external dependencies. It is licensed under Apache 2.0.
          </p>
        </>
      ),
    },
    {
      id: "why-physiclaw",
      title: "Why use Physiclaw?",
      keywords: "why air-gap self-hosted open source zero telemetry compliance",
      content: (
        <>
          <p className="mb-4">
            Most AI agent platforms require cloud connectivity, send telemetry upstream, or lock you into a vendor ecosystem. Physiclaw is different:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sage">
            <li><strong className="text-gold-light">Air-gap ready</strong> — Runs fully offline with no external trust boundaries.</li>
            <li><strong className="text-gold-light">Self-hosted</strong> — Deploy on bare metal, VMs, or Kubernetes. Your hardware, your rules.</li>
            <li><strong className="text-gold-light">Open source</strong> — Apache 2.0 licensed, community-driven, transparent by default.</li>
            <li><strong className="text-gold-light">Zero telemetry</strong> — Nothing leaves your network. Ever.</li>
          </ul>
        </>
      ),
    },
    {
      id: "how-it-works",
      title: "How does Physiclaw work?",
      keywords: "how it works deploy connect run steps",
      content: (
        <>
          <p className="mb-4">Physiclaw works in three steps:</p>
          <ol className="list-decimal pl-6 space-y-3 text-sage">
            <li><strong className="text-gold-light">Deploy on your infrastructure</strong> — Run Physiclaw on bare metal, VMs, or Kubernetes. Everything stays inside your perimeter.</li>
            <li><strong className="text-gold-light">Connect to your tools</strong> — Agents plug into Prometheus, Kubernetes, Vault, Slack, and other on-prem services you already use.</li>
            <li><strong className="text-gold-light">Chat or command; agents run</strong> — From terminal or API you assign tasks. Agents execute on your stack with no data leaving your network.</li>
          </ol>
        </>
      ),
    },
    {
      id: "quick-start",
      title: "Quick Start",
      keywords: "quick start install one-liner docker helm build from source",
      content: (
        <>
          <h3 className="text-lg font-semibold text-gold-light mt-6 mb-2">One-liner</h3>
          <pre className="bg-navy-300/50 border border-navy-200/50 rounded-lg p-4 text-sm text-sage overflow-x-auto mb-6">
{`curl -fsSL https://get.physiclaw.dev | sh -s -- \\
  --cluster-name my-agents \\
  --enable-gpu \\
  --license oss`}
          </pre>
          <h3 className="text-lg font-semibold text-gold-light mt-6 mb-2">Docker</h3>
          <pre className="bg-navy-300/50 border border-navy-200/50 rounded-lg p-4 text-sm text-sage overflow-x-auto mb-6">
{`docker run -d \\
  --name physiclaw-core \\
  --gpus all \\
  -p 8090:8090 \\
  -v /var/physiclaw/data:/data \\
  -e PL_LICENSE=oss \\
  -e PL_CLUSTER_NAME=my-agents \\
  ghcr.io/physiclaw/core:latest`}
          </pre>
          <h3 className="text-lg font-semibold text-gold-light mt-6 mb-2">Helm (Kubernetes)</h3>
          <pre className="bg-navy-300/50 border border-navy-200/50 rounded-lg p-4 text-sm text-sage overflow-x-auto mb-6">
{`helm repo add physiclaw https://charts.physiclaw.dev
helm repo update

helm install physiclaw-core physiclaw/core \\
  --namespace physiclaw \\
  --create-namespace \\
  --set global.license=oss \\
  --set gpu.enabled=true \\
  --set persistence.size=100Gi`}
          </pre>
          <h3 className="text-lg font-semibold text-gold-light mt-6 mb-2">Build from source</h3>
          <pre className="bg-navy-300/50 border border-navy-200/50 rounded-lg p-4 text-sm text-sage overflow-x-auto">
{`git clone https://github.com/physiclaw/core.git
cd core
make deps
make build
./bin/physiclaw-server \\
  --config config/default.yaml \\
  --data-dir /var/physiclaw/data`}
          </pre>
        </>
      ),
    },
    {
      id: "agent-roles",
      title: "Agent Roles",
      keywords: "agent roles SRE SecOps Data Architect Code Janitor personas",
      content: (
        <>
          <p className="mb-4">
            Physiclaw ships with pre-built agent personas, each loading its own toolchain:
          </p>
          <ul className="space-y-4 text-sage">
            <li>
              <strong className="text-gold-light">The SRE</strong> — Site Reliability Engineering. Prometheus, K8s, Terraform, Grafana, Alerting. Watches uptime, manages IaC, auto-remediates.
            </li>
            <li>
              <strong className="text-gold-light">The SecOps Guardian</strong> — Security Operations. Log analysis, CVE scanning, IAM, SIEM, Compliance. Triages alerts, enforces policy, hardens perimeter.
            </li>
            <li>
              <strong className="text-gold-light">The Data Architect</strong> — Data Engineering. SQL, ETL pipelines, Snowflake, dbt, Data Quality. Optimizes schemas, orchestrates pipelines, checks quality.
            </li>
            <li>
              <strong className="text-gold-light">The Code Janitor</strong> — Code Quality. Refactoring, unit tests, linting, CI/CD, docs. Keeps CI green and tech debt low.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "security",
      title: "Security Architecture",
      keywords: "security encryption zero trust HSM TPM audit compliance",
      content: (
        <>
          <p className="mb-4">
            Every layer runs inside your perimeter. Physiclaw implements defense-in-depth with five concentric security rings:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-sage border border-navy-200/50 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-navy-300/50">
                  <th className="text-left p-3 text-gold-light font-semibold">Ring</th>
                  <th className="text-left p-3 text-gold-light font-semibold">Layer</th>
                  <th className="text-left p-3 text-gold-light font-semibold">Primitives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-200/50">
                <tr><td className="p-3">0</td><td className="p-3">Zero Trust Isolation</td><td className="p-3">gVisor, Seccomp-BPF, eBPF, UCAN, AES-256</td></tr>
                <tr><td className="p-3">1</td><td className="p-3">End-to-End Encryption</td><td className="p-3">mTLS, SPIFFE, XChaCha20, X.509, Auto-Rotate</td></tr>
                <tr><td className="p-3">2</td><td className="p-3">Hardware Secrets</td><td className="p-3">HSM, TPM 2.0, Vault, PKCS#11, Sealed Keys</td></tr>
                <tr><td className="p-3">3</td><td className="p-3">Observability & Provenance</td><td className="p-3">OTel, Attestation, Merkle Log, Sigstore, WORM</td></tr>
                <tr><td className="p-3">4</td><td className="p-3">Air-Gap & Compliance</td><td className="p-3">Offline, SOC 2, HIPAA, FedRAMP, ISO 27001</td></tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "configuration",
      title: "Configuration",
      keywords: "configuration YAML runtime knowledge audit vllm pgvector",
      content: (
        <>
          <p className="mb-4">
            Everything is a config change. Swap runtimes, vector stores, and audit backends in YAML. No vendor calls, no lock-in.
          </p>
          <pre className="bg-navy-300/50 border border-navy-200/50 rounded-lg p-4 text-sm text-sage overflow-x-auto mb-4">
{`# physiclaw.yaml
runtime:
  backend: "vllm"           # vllm, tgi, ollama, triton
  model: "llama-3-70b"     # any GGUF / safetensors weight
  gpu_layers: "auto"       # offload control
  max_concurrent: "64"     # per-node parallelism

knowledge:
  store: "pgvector"        # pgvector, faiss, milvus, qdrant
  embedder: "bge-large"   # on-prem embedding model
  chunker: "semantic"
  reranker: "cross-encoder"

audit:
  backend: "merkle-log"    # tamper-evident storage
  signing: "cosign"       # cryptographic verification
  export: "siem-sink"     # compliance export
  retention: "forever"     # WORM retention`}
          </pre>
          <p className="text-sm text-sage-dim mb-2"><strong>Supported runtimes:</strong> vLLM, TGI, Ollama, GGUF, ONNX, Triton</p>
          <p className="text-sm text-sage-dim mb-2"><strong>Supported vector stores:</strong> pgvector, FAISS, Milvus, Qdrant</p>
          <p className="text-sm text-sage-dim"><strong>Supported embedding models:</strong> BGE-Large, E5-Mistral, Nomic-Embed, Local ONNX</p>
        </>
      ),
    },
    {
      id: "integrations",
      title: "Integrations",
      keywords: "integrations Prometheus Grafana Kubernetes Vault Slack on-prem",
      content: (
        <>
          <p className="mb-4">
            Physiclaw connects to common enterprise on-prem services so agents can use the tools you already run inside your perimeter. Supported integrations include:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sage">
            <li>Prometheus (metrics and alerting)</li>
            <li>Grafana (dashboards)</li>
            <li>Kubernetes (orchestration)</li>
            <li>Vault (secrets and identity)</li>
            <li>LDAP / Active Directory (identity)</li>
            <li>PostgreSQL (data and vector store)</li>
            <li>GitLab, Jenkins (source and CI)</li>
            <li>SIEM, Slack, Microsoft Teams</li>
            <li>OpenTelemetry, Splunk, Elastic</li>
          </ul>
        </>
      ),
    },
    {
      id: "running-the-engine",
      title: "Running the Engine",
      keywords: "running engine dev build gateway pnpm node",
      content: (
        <>
          <p className="mb-4">From the Physiclaw core repo:</p>
          <pre className="bg-navy-300/50 border border-navy-200/50 rounded-lg p-4 text-sm text-sage overflow-x-auto mb-4">
{`pnpm install
pnpm dev        # development mode
pnpm build      # build
node physiclaw.mjs gateway   # start gateway`}
          </pre>
        </>
      ),
    },
    {
      id: "running-the-website",
      title: "Running the Website",
      keywords: "website landing page next.js local dev",
      content: (
        <>
          <p className="mb-4">
            The marketing site and docs live in the <code className="bg-navy-300/50 px-1 rounded text-gold-light">website/</code> directory (Next.js). To run locally:
          </p>
          <pre className="bg-navy-300/50 border border-navy-200/50 rounded-lg p-4 text-sm text-sage overflow-x-auto mb-4">
{`cd website
npm install
npm run dev`}
          </pre>
          <p className="text-sage">
            Open <a href="http://localhost:3000" className="text-gold-light hover:underline">http://localhost:3000</a>. The live site is at <a href="https://www.physiclaw.dev" className="text-gold-light hover:underline">https://www.physiclaw.dev</a>.
          </p>
        </>
      ),
    },
    {
      id: "project-structure",
      title: "Project Structure",
      keywords: "project structure architecture src skills config",
      content: (
        <>
          <pre className="bg-navy-300/50 border border-navy-200/50 rounded-lg p-4 text-sm text-sage overflow-x-auto whitespace-pre">
{`/
├── src/                # Core engine
│   ├── agents/         # Agent execution, tools, workspace
│   ├── cli/            # CLI (Commander.js)
│   ├── config/        # YAML config, Zod validation
│   ├── daemon/         # Service management (launchd/systemd)
│   ├── gateway/        # HTTP/WebSocket control plane
│   ├── plugins/        # Plugin infrastructure
│   ├── providers/      # AI model provider integrations
│   └── security/       # Audit, scanning, hardening
├── skills/             # Agent personas (sre, secops, data-architect, code-janitor)
├── config/             # Default YAML
├── packages/           # Shared packages
├── extensions/         # Extension plugins
├── website/            # Marketing + docs (Next.js)
├── Dockerfile
├── docker-compose.yml
└── physiclaw.mjs       # CLI entry`}
          </pre>
        </>
      ),
    },
    {
      id: "faq",
      title: "FAQ",
      keywords: "faq frequently asked questions license support",
      content: (
        <>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gold-light mb-1">Is Physiclaw really air-gap ready?</h4>
              <p className="text-sage text-sm">Yes. It runs fully offline with no external trust boundaries. No telemetry, no phone-home.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gold-light mb-1">What license is Physiclaw under?</h4>
              <p className="text-sage text-sm">Apache License 2.0. The core agent runtime is adapted from OpenClaw (MIT).</p>
            </div>
            <div>
              <h4 className="font-semibold text-gold-light mb-1">Can I use my own models?</h4>
              <p className="text-sage text-sm">Yes. You configure the runtime (vLLM, TGI, Ollama, etc.) and point to your own GGUF or safetensors weights.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gold-light mb-1">Where is the live site and docs?</h4>
              <p className="text-sage text-sm">The site and documentation are deployed at <a href="https://www.physiclaw.dev" className="text-gold-light hover:underline">https://www.physiclaw.dev</a>. Docs are at <a href="https://www.physiclaw.dev/docs" className="text-gold-light hover:underline">www.physiclaw.dev/docs</a>.</p>
            </div>
          </div>
        </>
      ),
    },
  ];
}

const ALL_SECTIONS = DocSections();

// ─── Page ──────────────────────────────────────────────────────────

export default function DocsPage() {
  const [query, setQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!query.trim()) return ALL_SECTIONS;
    const q = query.toLowerCase().trim();
    return ALL_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.keywords.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gold-light mb-2">
          Documentation
        </h1>
        <p className="text-sage">
          Everything you need to understand, install, and run Physiclaw.
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sage-dim" />
        <input
          type="search"
          placeholder="Search docs (e.g. install, security, config)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-300/50 border border-navy-200/50 text-sage placeholder-sage-dim focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors"
          aria-label="Search documentation"
        />
      </div>

      {/* TOC (anchor links) */}
      <nav className="mb-10 pb-6 border-b border-navy-200/50" aria-label="On this page">
        <p className="text-xs font-mono text-sage-dim uppercase tracking-widest mb-3">On this page</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {ALL_SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-sage-dim hover:text-gold-light transition-colors"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="space-y-14">
        {filteredSections.length === 0 ? (
          <p className="text-sage-dim">No sections match your search. Try different keywords.</p>
        ) : (
          filteredSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24"
            >
              <h2 className="text-xl font-semibold text-gold-light mb-4 border-b border-navy-200/50 pb-2">
                {section.title}
              </h2>
              <div className="text-sage leading-relaxed">{section.content}</div>
            </section>
          ))
        )}
      </div>

      <p className="mt-14 pt-6 border-t border-navy-200/50 text-sm text-sage-dim">
        For more detail, see the <Link href="/whitepaper" className="text-gold-light hover:underline">Whitepaper</Link> and the <a href="https://github.com/physiclaw" target="_blank" rel="noopener noreferrer" className="text-gold-light hover:underline">GitHub repository</a>.
      </p>
    </div>
  );
}
