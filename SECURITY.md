# Security Policy

Physiclaw is designed for environments where **data sovereignty and air-gap readiness** matter. We take security reports seriously and ask that you report vulnerabilities privately so we can address them before public disclosure.

## Reporting a vulnerability

**Do not report security issues in public issues or discussions.**

- **Preferred:** Use the [GitHub Security tab](https://github.com/CommanderZed/Physiclaw/security) → **Report a vulnerability**, or open a [private security advisory](https://github.com/CommanderZed/Physiclaw/security/advisories/new).
- **Scope:** This repository only — core engine, CLI, gateway, config, agents, skills, plugins, and documentation. There are no separate mobile apps or external hubs; everything relevant lives in [CommanderZed/Physiclaw](https://github.com/CommanderZed/Physiclaw).

### What to include in your report

1. **Title** — Short, clear summary.
2. **Severity** — Your assessment (e.g. critical / high / medium / low).
3. **Impact** — What an attacker could do or what data could be affected.
4. **Affected component** — e.g. gateway, CLI, config loading, a specific agent/skill.
5. **Technical reproduction** — Step-by-step steps to reproduce.
6. **Demonstrated impact** — Evidence that the issue is exploitable or has real impact.
7. **Environment** — OS, Node version, deployment mode (e.g. bare metal, Docker).
8. **Remediation advice** — If you have suggestions for a fix or mitigation.

Reports that include reproduction steps, impact, and remediation advice are prioritized. We receive many low-value or automated findings; vetted reports from researchers who understand the issue help us respond quickly and appropriately.

## Security & trust

Physiclaw is maintained by the [Physiclaw Contributors](https://github.com/CommanderZed/Physiclaw/graphs/contributors). Security reports are handled by maintainers with access to the repository. We do not have a dedicated bug bounty or budget for paid reports; we still encourage responsible disclosure so we can fix issues and credit reporters where appropriate.

## Operational guidance

Physiclaw is built for **on-prem and air-gap** deployment. The following practices align with our design and reduce risk.

### Gateway and control plane

- The HTTP/WebSocket gateway is intended for **local or internal use**. Do not expose it directly to the public internet unless you add strong auth, TLS, and network controls.
- Prefer binding to **loopback** (`127.0.0.1` / `::1`) when the gateway is only used from the same host. Use SSH tunnels, Tailscale, or a reverse proxy with auth if you need remote access.
- Keep config (e.g. `physiclaw.yaml`) and any secrets (API keys, tokens) out of version control and restrict file permissions.

### Config and tool policy

- Use YAML config to restrict tool access, workspace paths, and agent capabilities. See the [whitepaper](docs/WHITEPAPER.md) and [docs](https://www.physiclaw.dev/docs) for the security model and hardening options.
- Run the gateway and agents with the least privilege required (dedicated user, minimal capabilities in containers).

### Threat model and design

For defense-in-depth, audit, and compliance context, see:

- **[Whitepaper](docs/WHITEPAPER.md)** — Security architecture (zero-trust, encryption, hardware secrets, observability, air-gap).
- **Docs:** [www.physiclaw.dev/docs](https://www.physiclaw.dev/docs) (including security and enterprise deployment).

## Runtime requirements

### Node.js

Physiclaw requires **Node.js 22.12.0 or later** (see `engines` in `package.json`). This version includes important security fixes. Verify:

```bash
node --version   # Should be v22.12.0 or later
```

### Docker

When running in Docker:

- Prefer running the process as a **non-root** user inside the container.
- Use read-only filesystem and minimal capabilities where possible (e.g. `--read-only`, `--cap-drop=ALL`), and mount only necessary volumes.

## Out of scope

The following are generally **out of scope** for security vulnerability reports:

- **Prompt injection** — Using crafted prompts to change model behavior, unless it leads to a concrete bypass of access control or policy (e.g. escaping sandbox, accessing unauthorized tools).
- **Public internet exposure** — Deploying the gateway or control plane in a way that contradicts our documentation (e.g. binding to `0.0.0.0` without auth and then reporting “exposed service”).
- **Theoretical issues** — Findings without a reproducible path to impact or that require unrealistic preconditions.

If you are unsure whether something is in scope, report it privately and we will triage.

## Security scanning

If we add automated secret detection or dependency scanning, we will document it here. In the meantime, avoid committing secrets, API keys, or credentials; use environment variables or a secrets manager and keep config files out of public history.

---

Thank you for helping keep Physiclaw safe for teams that depend on it.
