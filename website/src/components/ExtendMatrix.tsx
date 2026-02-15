"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  BookLock,
  FileSearch,
  ChevronRight,
  Terminal,
} from "lucide-react";

// ---------- types ----------

interface ConfigOption {
  key: string;
  values: string[];
  comment: string;
}

interface Domain {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  description: string;
  tags: string[];
  config: ConfigOption[];
}

// ---------- data ----------

const domains: Domain[] = [
  {
    id: "runtimes",
    name: "Custom Runtimes",
    subtitle: "Swap inference backends",
    icon: Boxes,
    color: "#F4D58D",
    bgClass: "bg-gold/10",
    borderClass: "border-gold/30",
    textClass: "text-gold",
    description:
      "vLLM, TGI, Ollama, or bare GGUF weights. Swap models in config without touching agent logic.",
    tags: ["vLLM", "TGI", "Ollama", "GGUF", "ONNX", "Triton"],
    config: [
      {
        key: "backend",
        values: ["vllm", "tgi", "ollama", "triton"],
        comment: "# hot-swappable inference engine",
      },
      {
        key: "model",
        values: ["llama-3-70b", "mixtral-8x22b", "qwen-2.5-72b", "phi-3-medium"],
        comment: "# any GGUF / safetensors weight",
      },
      {
        key: "gpu_layers",
        values: ["auto", "80", "40", "0"],
        comment: "# offload control",
      },
      {
        key: "max_concurrent",
        values: ["32", "64", "128", "256"],
        comment: "# per-node parallelism",
      },
    ],
  },
  {
    id: "rag",
    name: "Private Knowledge (RAG)",
    subtitle: "On-prem vector search",
    icon: BookLock,
    color: "#708D81",
    bgClass: "bg-sage/10",
    borderClass: "border-sage/30",
    textClass: "text-sage-light",
    description:
      "Embed and index documents on-prem. Pluggable chunking, embedding, and re-ranking. Your vector store, your network.",
    tags: ["pgvector", "FAISS", "Milvus", "Chunker", "Reranker"],
    config: [
      {
        key: "store",
        values: ["pgvector", "faiss", "milvus", "qdrant"],
        comment: "# your vectors, your network",
      },
      {
        key: "embedder",
        values: ["bge-large", "e5-mistral", "nomic-embed", "local-onnx"],
        comment: "# on-prem embedding model",
      },
      {
        key: "chunker",
        values: ["semantic", "fixed-512", "recursive", "markdown"],
        comment: "# document splitting strategy",
      },
      {
        key: "reranker",
        values: ["cross-encoder", "colbert", "none", "bge-reranker"],
        comment: "# optional re-ranking pass",
      },
    ],
  },
  {
    id: "audit",
    name: "Immutable Audit Trail",
    subtitle: "Tamper-evident ledger",
    icon: FileSearch,
    color: "#BF0603",
    bgClass: "bg-crimson/10",
    borderClass: "border-crimson/30",
    textClass: "text-crimson",
    description:
      "Every decision logged to an append-only, Merkle-verified ledger. WORM storage, Sigstore signing, SIEM export.",
    tags: ["Merkle", "WORM", "Sigstore", "SIEM", "Cosign"],
    config: [
      {
        key: "backend",
        values: ["merkle-log", "postgres-wal", "s3-worm", "sqlite-append"],
        comment: "# tamper-evident storage",
      },
      {
        key: "signing",
        values: ["cosign", "sigstore", "ed25519-local", "kms"],
        comment: "# cryptographic verification",
      },
      {
        key: "export",
        values: ["siem-sink", "s3-archive", "stdout-json", "otlp"],
        comment: "# compliance export target",
      },
      {
        key: "retention",
        values: ["forever", "7y", "3y", "1y"],
        comment: "# WORM retention policy",
      },
    ],
  },
];

// Full config YAML structure — keys reference domain sections
const SECTION_ORDER = ["runtimes", "rag", "audit"] as const;
const SECTION_KEYS: Record<string, string> = {
  runtimes: "runtime",
  rag: "knowledge",
  audit: "audit",
};

// ---------- value cycler hook ----------

function useValueCycler(values: string[], active: boolean, intervalMs = 1800) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      setIndex(0);
      timerRef.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % values.length);
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setIndex(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, values.length, intervalMs]);

  return values[index];
}

// ---------- config line component ----------

function ConfigLine({
  keyName,
  values,
  comment,
  color,
  active,
}: {
  keyName: string;
  values: string[];
  comment: string;
  color: string;
  active: boolean;
}) {
  const currentValue = useValueCycler(values, active);

  return (
    <div className="flex items-baseline gap-0 leading-relaxed">
      <span className="text-sage-dim">{`  ${keyName}: `}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentValue}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          style={{ color: active ? color : "#708D81" }}
          className="font-semibold"
        >
          {`"${currentValue}"`}
        </motion.span>
      </AnimatePresence>
      <span className="text-sage-dim/50 ml-3">{comment}</span>
    </div>
  );
}

// ---------- main component ----------

export default function ExtendMatrix() {
  const [activeDomain, setActiveDomain] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
      {/* Left — Domain list */}
      <div className="space-y-3">
        {domains.map((domain) => {
          const Icon = domain.icon;
          const isActive = activeDomain === domain.id;
          return (
            <motion.button
              key={domain.id}
              onClick={() =>
                setActiveDomain(isActive ? null : domain.id)
              }
              onMouseEnter={() => setActiveDomain(domain.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-300 ${
                isActive
                  ? `${domain.bgClass} ${domain.borderClass}`
                  : "border-navy-200/50 bg-navy-300/40 hover:border-navy-200/80"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? domain.bgClass : "bg-navy-200/60"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? domain.textClass : "text-sage-dim"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm font-semibold ${
                        isActive ? domain.textClass : "text-sage-light"
                      }`}
                    >
                      {domain.name}
                    </h3>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isActive
                          ? `${domain.textClass} rotate-90`
                          : "text-sage-dim"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-sage-dim mt-0.5">
                    {domain.subtitle}
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-sage mt-3 leading-relaxed">
                      {domain.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {domain.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${domain.bgClass} ${domain.textClass} border ${domain.borderClass}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Right — Live Config Terminal */}
      <div className="rounded-xl border border-navy-200/50 bg-navy-300/80 backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden">
        {/* macOS title bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-navy-200/60 border-b border-navy-200/60">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-crimson/80" />
              <div className="w-3 h-3 rounded-full bg-gold/80" />
              <div className="w-3 h-3 rounded-full bg-sage/80" />
            </div>
            <div className="ml-3 flex items-center gap-1.5 text-xs text-sage-dim">
              <Terminal className="w-3.5 h-3.5" />
              <span>physiclaw.yaml</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-sage-dim">
            config v0.9
          </span>
        </div>

        {/* Config content */}
        <div className="p-5 font-mono text-[13px] leading-[1.85] min-h-[380px]">
          {/* File header comment */}
          <div className="text-sage-dim mb-1">
            # physiclaw.yaml
          </div>
          <div className="text-sage-dim/40 mb-4">---</div>

          {SECTION_ORDER.map((domainId) => {
            const domain = domains.find((d) => d.id === domainId)!;
            const isActive = activeDomain === domain.id;
            const sectionKey = SECTION_KEYS[domainId];

            return (
              <motion.div
                key={domainId}
                className="mb-4 relative"
                animate={{
                  paddingLeft: isActive ? 12 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Active section left border */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full origin-top"
                      style={{ backgroundColor: domain.color }}
                    />
                  )}
                </AnimatePresence>

                {/* Section key */}
                <div>
                  <span
                    className="font-semibold"
                    style={{
                      color: isActive ? domain.color : "#8aa89b",
                    }}
                  >
                    {sectionKey}:
                  </span>
                </div>

                {/* Config lines */}
                {domain.config.map((opt) => (
                  <ConfigLine
                    key={opt.key}
                    keyName={opt.key}
                    values={opt.values}
                    comment={opt.comment}
                    color={domain.color}
                    active={isActive}
                  />
                ))}
              </motion.div>
            );
          })}
        </div>

        {/* Status bar */}
        <div className="px-5 py-2.5 border-t border-navy-200/60 bg-navy-200/40 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] font-mono text-sage-dim">
            {domains.map((d) => {
              const isActive = activeDomain === d.id;
              return (
                <span key={d.id} style={{ color: isActive ? d.color : undefined }}>
                  {SECTION_KEYS[d.id]}: {d.config[0].values[0]}
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage-light opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sage" />
            </span>
            <span className="text-sage-light">valid</span>
          </div>
        </div>
      </div>
    </div>
  );
}
