<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/banner.svg">
    <source media="(prefers-color-scheme: light)" srcset=".github/banner.svg">
    <img alt="Physiclaw — Specialized AI agents for your bare metal" src=".github/banner.svg" width="100%">
  </picture>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-F4D58D?style=flat-square&labelColor=001427" alt="License" /></a>&nbsp;
  <img src="https://img.shields.io/badge/version-0.9--beta-BF0603?style=flat-square&labelColor=001427" alt="Version" />&nbsp;
  <img src="https://img.shields.io/badge/status-active-708D81?style=flat-square&labelColor=001427" alt="Status" />&nbsp;
  <img src="https://img.shields.io/badge/air--gap-ready-8aa89b?style=flat-square&labelColor=001427" alt="Air-Gap Ready" />
</p>

<p align="center">
  <b>Open-source agent orchestration that runs entirely on your infrastructure.</b><br>
  <sub>No SaaS dependency. No telemetry. No phone-home. You own the entire stack.</sub>
</p>

---

## Why Physiclaw?

Most AI agent platforms require cloud connectivity, send telemetry upstream, or lock you into a vendor's ecosystem. Physiclaw is different:

<table>
  <tr>
    <td width="50%" valign="top">
      <h4>Air-Gap Ready</h4>
      <p>Runs fully offline with no external trust boundaries.</p>
    </td>
    <td width="50%" valign="top">
      <h4>Self-Hosted</h4>
      <p>Deploy on bare metal, VMs, or Kubernetes — your hardware, your rules.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h4>Open Source</h4>
      <p>Apache 2.0 licensed, community-driven, transparent by default.</p>
    </td>
    <td width="50%" valign="top">
      <h4>Zero Telemetry</h4>
      <p>Nothing leaves your network. Ever.</p>
    </td>
  </tr>
</table>

---

## Quick Start

### One-liner

```bash
curl -fsSL https://get.physiclaw.dev | sh -s -- \
  --cluster-name my-agents \
  --enable-gpu \
  --license oss
```

### Docker

```bash
docker run -d \
  --name physiclaw-core \
  --gpus all \
  -p 8090:8090 \
  -v /var/physiclaw/data:/data \
  -e PL_LICENSE=oss \
  -e PL_CLUSTER_NAME=my-agents \
  ghcr.io/physiclaw/core:latest
```

### Helm (Kubernetes)

```bash
helm repo add physiclaw https://charts.physiclaw.dev
helm repo update

helm install physiclaw-core physiclaw/core \
  --namespace physiclaw \
  --create-namespace \
  --set global.license=oss \
  --set gpu.enabled=true \
  --set persistence.size=100Gi
```

### Build from Source

```bash
git clone https://github.com/physiclaw/core.git
cd core

make deps
make build

./bin/physiclaw-server \
  --config config/default.yaml \
  --data-dir /var/physiclaw/data
```

---

## Agent Roles

Physiclaw ships with pre-built agent personas, each loading its own toolchain:

> **The SRE** — Site Reliability Engineering
> `Prometheus` `K8s` `Terraform` `Grafana` `Alerting`
> Watches uptime, manages IaC, auto-remediates.

> **The SecOps Guardian** — Security Operations
> `Log Analysis` `CVE Scanning` `IAM` `SIEM` `Compliance`
> Triages alerts, enforces policy, hardens perimeter.

> **The Data Architect** — Data Engineering
> `SQL` `ETL Pipelines` `Snowflake` `dbt` `Data Quality`
> Optimizes schemas, orchestrates pipelines, checks quality.

> **The Code Janitor** — Code Quality
> `Refactoring` `Unit Tests` `Linting` `CI/CD` `Docs`
> Keeps CI green and tech debt low.

---

## Security Architecture

<p align="center"><i>Nothing leaves your network.</i></p>

Every layer runs inside your perimeter. Physiclaw implements defense-in-depth with five concentric security rings:

| Ring | Layer | Primitives |
|:---:|---|---|
| 0 | **Zero Trust Isolation** | gVisor, Seccomp-BPF, eBPF, UCAN, AES-256 |
| 1 | **End-to-End Encryption** | mTLS, SPIFFE, XChaCha20, X.509, Auto-Rotate |
| 2 | **Hardware Secrets** | HSM, TPM 2.0, Vault, PKCS#11, Sealed Keys |
| 3 | **Observability & Provenance** | OTel, Attestation, Merkle Log, Sigstore, WORM |
| 4 | **Air-Gap & Compliance** | Offline, SOC 2, HIPAA, FedRAMP, ISO 27001 |

---

## Configuration

Everything is a config change. Swap runtimes, vector stores, and audit backends in YAML:

```yaml
# physiclaw.yaml
---
runtime:
  backend: "vllm"           # hot-swappable: vllm, tgi, ollama, triton
  model: "llama-3-70b"      # any GGUF / safetensors weight
  gpu_layers: "auto"        # offload control
  max_concurrent: "64"      # per-node parallelism

knowledge:
  store: "pgvector"         # your vectors, your network: pgvector, faiss, milvus, qdrant
  embedder: "bge-large"     # on-prem embedding model
  chunker: "semantic"       # document splitting strategy
  reranker: "cross-encoder" # optional re-ranking pass

audit:
  backend: "merkle-log"     # tamper-evident storage
  signing: "cosign"         # cryptographic verification
  export: "siem-sink"       # compliance export target
  retention: "forever"      # WORM retention policy
```

### Supported Runtimes
vLLM, TGI, Ollama, GGUF, ONNX, Triton

### Supported Vector Stores
pgvector, FAISS, Milvus, Qdrant

### Supported Embedding Models
BGE-Large, E5-Mistral, Nomic-Embed, Local ONNX

---

## Website Development

This repository contains the Physiclaw marketing/docs website, built with:

- [Next.js 14](https://nextjs.org/) (App Router)
- [React 18](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI](https://www.radix-ui.com/) primitives
- [Lucide Icons](https://lucide.dev/)

### Running Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles + custom scrollbar + grid bg
│   ├── layout.tsx           # Root layout with Geist fonts
│   └── page.tsx             # Landing page
├── components/
│   ├── AgentSkillMatrix.tsx  # Interactive agent roles constellation
│   ├── ExtendMatrix.tsx      # Live YAML config viewer
│   ├── PhysiclawLogo.tsx     # SVG logo component
│   ├── QuickStartTerminal.tsx # Tabbed install command terminal
│   └── SecurityMatrix.tsx    # Concentric security rings visualization
└── lib/
    └── utils.ts             # Utility functions
```

### Building for Production

```bash
npm run build
npm start
```

---

## License

[Apache License 2.0](LICENSE)

---

<p align="center">
  <a href="https://github.com/CommanderZed/Physiclaw">
    <img src=".github/logo.svg" alt="Physiclaw" height="36" />
  </a>
</p>
<p align="center">
  <sub>Built by the <a href="https://github.com/CommanderZed/Physiclaw">Physiclaw</a> Contributors</sub>
</p>
