"use client";

import { Shield } from "lucide-react";

// Simple Icons via jsDelivr (official icon set, reliable CDN)
const SIMPLE_ICONS_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons";

// ---------- data ----------

interface Integration {
  id: string;
  name: string;
  description: string;
  /** Simple Icons slug (filename without .svg). See https://simpleicons.org */
  iconSlug: string | null;
}

const integrations: Integration[] = [
  {
    id: "prometheus",
    name: "Prometheus",
    description: "Metrics and alerting",
    iconSlug: "prometheus",
  },
  {
    id: "grafana",
    name: "Grafana",
    description: "Dashboards and visualization",
    iconSlug: "grafana",
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    description: "Orchestration and workloads",
    iconSlug: "kubernetes",
  },
  {
    id: "vault",
    name: "Vault",
    description: "Secrets and identity",
    iconSlug: "hashicorp",
  },
  {
    id: "ldap",
    name: "LDAP / Active Directory",
    description: "Identity and access",
    iconSlug: "microsoft",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Data and vector store",
    iconSlug: "postgresql",
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "Source and CI",
    iconSlug: "gitlab",
  },
  {
    id: "jenkins",
    name: "Jenkins",
    description: "Pipelines and automation",
    iconSlug: "jenkins",
  },
  {
    id: "siem",
    name: "SIEM",
    description: "Security events and audit",
    iconSlug: null,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Chat and notifications",
    iconSlug: "slack",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Chat and collaboration",
    iconSlug: "microsoftteams",
  },
  {
    id: "otel",
    name: "OpenTelemetry",
    description: "Traces and observability",
    iconSlug: "opentelemetry",
  },
  {
    id: "splunk",
    name: "Splunk",
    description: "Log aggregation and search",
    iconSlug: "splunk",
  },
  {
    id: "elastic",
    name: "Elastic",
    description: "Search and analytics",
    iconSlug: "elastic",
  },
];

// ---------- component ----------

function IntegrationIcon({
  iconSlug,
  className,
}: {
  iconSlug: string | null;
  className?: string;
}) {
  if (iconSlug) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external CDN SVGs
      <img
        src={`${SIMPLE_ICONS_CDN}/${iconSlug}.svg`}
        alt=""
        className={className}
        width={20}
        height={20}
      />
    );
  }
  return <Shield className={`${className} text-sage-light`} aria-hidden />;
}

export default function IntegrationGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {integrations.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 rounded-xl border border-navy-200/50 bg-navy-300/40 px-4 py-3 hover:border-navy-200/80 hover:bg-navy-300/60 transition-colors"
        >
          <div className="flex shrink-0 w-10 h-10 rounded-lg bg-navy-200/60 flex items-center justify-center [&_img]:brightness-0 [&_img]:invert-[0.9]">
            <IntegrationIcon iconSlug={item.iconSlug} className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gold-light truncate">
              {item.name}
            </p>
            <p className="text-xs text-sage-dim truncate">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
