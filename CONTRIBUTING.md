# Contributing to Physiclaw

Thank you for your interest in Physiclaw. We welcome contributions that align with our goal: **open-source agent orchestration that runs entirely on your infrastructure**—no SaaS, no telemetry, no phone-home.

## Quick Links

- **Repository:** [github.com/CommanderZed/Physiclaw](https://github.com/CommanderZed/Physiclaw)
- **Site & docs:** [www.physiclaw.dev](https://www.physiclaw.dev)
- **X (Twitter):** [@physiclaw](https://x.com/physiclaw)
- **Whitepaper (design & security):** [docs/WHITEPAPER.md](docs/WHITEPAPER.md) · [physiclaw.dev/whitepaper](https://www.physiclaw.dev/whitepaper)

## Physiclaw at a glance

- **Air-gap ready** — Runs fully offline; no external trust boundaries.
- **Self-hosted** — Deploy on bare metal, VMs, or Kubernetes.
- **Zero telemetry** — Nothing leaves your network.
- **Enterprise agent personas** — SRE, SecOps Guardian, Data Architect, Code Janitor; each with a defined toolchain and policy.
- **Config-driven** — YAML for runtimes, vector stores, audit backends; hot-swappable backends (vLLM, TGI, Ollama, etc.).

Contributions that strengthen security, clarity, or on-prem/air-gap operation are especially valued.

## How to contribute

1. **Bugs & small fixes** — Open a PR with a clear description and steps to reproduce (if applicable).
2. **New features or architecture** — Open a [GitHub Discussion](https://github.com/CommanderZed/Physiclaw/discussions) or an issue first so we can align with the roadmap.
3. **Questions** — Use [GitHub Discussions](https://github.com/CommanderZed/Physiclaw/discussions) or open an issue.

## Before you open a PR

- Test locally with your Physiclaw setup (gateway, config, and any affected agent/skill).
- Run: `pnpm build && pnpm check && pnpm test`
- Ensure CI checks pass.
- Keep PRs focused (one logical change per PR).
- Describe **what** changed and **why** in the PR description.

## AI-assisted contributions

Contributions written or refined with AI tools (e.g. Claude, Codex, Copilot) are welcome. For transparency and easier review:

- Mark the PR as AI-assisted in the title or description.
- Note how much you tested (e.g. untested / smoke-tested / fully tested).
- If helpful, share the prompts or context you used.
- Confirm you understand what the code does and that it fits Physiclaw’s design.

## Current focus & roadmap

We are especially interested in:

- **Stability** — Edge cases in gateway, config loading, and agent execution.
- **Agent personas & skills** — SRE, SecOps, Data Architect, Code Janitor; tool policies and guardrails.
- **Security & audit** — Hardening, audit backends, and alignment with the [whitepaper](docs/WHITEPAPER.md) security model.
- **Config & extensibility** — YAML schema, validation, and plugin behavior.
- **Docs** — Clarity for deploy, config, and air-gap/enterprise use.

Check [GitHub Issues](https://github.com/CommanderZed/Physiclaw/issues) for open work and “good first issue” labels.

## Reporting a vulnerability

We take security seriously. Please report vulnerabilities **privately** so we can fix them before public disclosure.

- **Where to report:** Use the [GitHub Security tab](https://github.com/CommanderZed/Physiclaw/security) → “Report a vulnerability,” or open a [private security advisory](https://github.com/CommanderZed/Physiclaw/security/advisories/new). Do not report sensitive issues in public issues or discussions.
- **Scope:** This repository (core engine, CLI, gateway, config, agents, skills, and docs). For full reporting expectations and handling, see [SECURITY.md](SECURITY.md).

Thank you for helping keep Physiclaw safe and useful for everyone.
