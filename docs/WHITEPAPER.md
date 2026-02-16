# Physiclaw: Open-Source Agent Orchestration for Your Infrastructure

A technical overview of design goals, architecture, and security for teams that need AI agents to run entirely on their own hardware.

---

## Introduction

Most AI agent platforms today require cloud connectivity, send telemetry upstream, or lock you into a vendor ecosystem. Physiclaw takes a different path. It is open-source agent orchestration that runs entirely on your infrastructure. There is no SaaS dependency, no telemetry, and no phone-home. You own the entire stack.

This document describes why Physiclaw exists, how it is built, and how it fits into environments where data sovereignty and air-gap readiness are non-negotiable.

## Why Physiclaw

Physiclaw is designed for organizations that need specialized AI agents but cannot or will not send data to the cloud. It is air-gap ready, meaning it runs fully offline with no external trust boundaries. It is self-hosted: you deploy on bare metal, virtual machines, or Kubernetes. Your hardware, your rules. The project is open source under the Apache 2.0 license and community-driven, and it is transparent by default. Perhaps most important, nothing leaves your network. Ever.

## Agent Roles

Physiclaw ships with pre-built agent personas, each with its own toolchain. The SRE agent focuses on site reliability: Prometheus, Kubernetes, Terraform, Grafana, and alerting. It watches uptime, manages infrastructure as code, and can auto-remediate. The SecOps Guardian is for security operations: log analysis, CVE scanning, IAM, SIEM, and compliance. It triages alerts, enforces policy, and hardens the perimeter. The Data Architect handles data engineering: SQL, ETL pipelines, Snowflake, dbt, and data quality. It optimizes schemas, orchestrates pipelines, and checks quality. The Code Janitor keeps code quality high: refactoring, unit tests, linting, CI/CD, and docs. It keeps CI green and tech debt low.

## Security Architecture

Every layer runs inside your perimeter. Physiclaw uses defense-in-depth with five concentric security rings. Ring zero is zero-trust isolation: gVisor, Seccomp-BPF, eBPF, UCAN, and AES-256. Ring one is end-to-end encryption: mTLS, SPIFFE, XChaCha20, X.509, and automatic key rotation. Ring two is hardware secrets: HSM, TPM 2.0, Vault, PKCS#11, and sealed keys. Ring three is observability and provenance: OpenTelemetry, attestation, Merkle logs, Sigstore, and WORM storage. Ring four is air-gap and compliance: offline operation and alignment with SOC 2, HIPAA, FedRAMP, and ISO 27001 where applicable.

## Configuration and Extensibility

Everything is a config change. You swap runtimes, vector stores, and audit backends in YAML. The runtime backend is hot-swappable: vLLM, TGI, Ollama, Triton, and others. You choose the model, control GPU offload, and set per-node parallelism. For knowledge, you pick your vector store: pgvector, FAISS, Milvus, Qdrant. You choose the embedder, the chunking strategy, and optional re-ranking. For audit, you select a backend such as a Merkle log, signing with Cosign, export to a SIEM sink, and retention policy. There are no vendor calls and no lock-in.

## Architecture and Origins

Physiclaw is adapted from [OpenClaw](https://github.com/openclaw/openclaw) (MIT). It was re-engineered for enterprise bare-metal deployment with zero external dependencies. The core engine is implemented in **TypeScript/Node.js**. Model inference is delegated to configurable backends (vLLM, TGI, Ollama, etc.); the orchestration, CLI, gateway, and agent logic run on Node. The repo includes an agent execution engine with tools and workspace, a CLI, YAML config with validation, service management for launchd and systemd, an HTTP and WebSocket control plane, plugin infrastructure, provider integrations for AI models, and security layers for audit, scanning, and hardening. Agent personas live in skill definitions for SRE, SecOps, data architect, and code janitor. You can extend with additional plugins and run the gateway to drive agents from your own tooling.

## Conclusion

Physiclaw exists to give teams a way to run specialized AI agents on their own hardware with full control and no dependency on the cloud. If you need air-gap readiness, zero telemetry, and open-source transparency, Physiclaw is built for that. Deploy via one-liner, Docker, or Helm; configure with YAML; and keep everything inside your perimeter.

---

Also available on the web: [Whitepaper (physiclaw.dev)](https://www.physiclaw.dev/whitepaper)
