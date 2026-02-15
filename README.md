<p align="center">
  <img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/version-0.9--beta-gold?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/status-active-brightgreen?style=flat-square" alt="Status" />
</p>

# Physiclaw

**Specialized AI agents for your bare metal. 100% On-Prem & Air-Gap ready.**

Open-source agent orchestration that runs entirely on your infrastructure. No SaaS dependency, no telemetry, no phone-home. You own the entire stack.

---

## Why Physiclaw?

Most AI agent platforms require cloud connectivity, send telemetry upstream, or lock you into a vendor's ecosystem. Physiclaw is different:

- **Air-Gap Ready** -- Runs fully offline with no external trust boundaries
- **Self-Hosted** -- Deploy on bare metal, VMs, or Kubernetes -- your hardware, your rules
- **Open Source** -- Apache 2.0 licensed, community-driven
- **Zero Telemetry** -- Nothing leaves your network, ever

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

| Agent | Focus | Toolchain |
|---|---|---|
| **The SRE** | Site Reliability Engineering | Prometheus, K8s, Terraform, Grafana, Alerting |
| **The SecOps Guardian** | Security Operations | Log Analysis, CVE Scanning, IAM, SIEM, Compliance |
| **The Data Architect** | Data Engineering | SQL, ETL Pipelines, Snowflake, dbt, Data Quality |
| **The Code Janitor** | Code Quality | Refactoring, Unit Tests, Linting, CI/CD, Docs |

---

## Security Architecture

Every layer runs inside your perimeter. Physiclaw implements defense-in-depth with five concentric security rings:

### Zero Trust Isolation
gVisor sandboxing, Seccomp-BPF syscall filters, eBPF network rules, UCAN capability tokens. Heap memory is AEAD-encrypted.

### End-to-End Encryption
mTLS via SPIFFE/SPIRE, auto-rotated X.509 certs. Data at rest sealed with XChaCha20-Poly1305. Key material never hits disk unencrypted.

### Hardware Secrets
API keys, model weights, and RAG credentials sealed to host hardware identity via HSM, TPM 2.0, Vault, and PKCS#11.

### Observability & Provenance
OpenTelemetry on every call. Outputs signed with attestation keys. Tamper-evident Merkle audit log. Offline verification via Sigstore.

### Air-Gap & Compliance
Runs fully offline. Model packages verified without internet. SOC 2 Type II, HIPAA, FedRAMP, ISO 27001 ready.

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
  <sub>Built by the Physiclaw Contributors</sub>
</p>
