"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  Network,
  ChevronRight,
} from "lucide-react";

// ---------- types ----------

interface Primitive {
  id: string;
  label: string;
}

interface Layer {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  ringIndex: number; // 0 = innermost, 4 = outermost
  primitives: Primitive[];
  description: string;
}

// ---------- data ----------

const layers: Layer[] = [
  {
    id: "isolation",
    name: "Zero Trust Isolation",
    subtitle: "Kernel-level sandboxing",
    icon: ShieldCheck,
    color: "#BF0603",
    bgClass: "bg-crimson/10",
    borderClass: "border-crimson/30",
    textClass: "text-crimson",
    ringIndex: 0,
    primitives: [
      { id: "gvisor", label: "gVisor" },
      { id: "seccomp", label: "Seccomp-BPF" },
      { id: "ebpf", label: "eBPF" },
      { id: "ucan", label: "UCAN" },
      { id: "aes", label: "AES-256" },
    ],
    description:
      "gVisor sandboxing, Seccomp-BPF syscall filters, eBPF network rules, UCAN capability tokens. Heap memory is AEAD-encrypted.",
  },
  {
    id: "encryption",
    name: "End-to-End Encryption",
    subtitle: "Transit & rest",
    icon: Lock,
    color: "#8D0801",
    bgClass: "bg-crimson-dark/10",
    borderClass: "border-crimson-dark/30",
    textClass: "text-crimson-dark",
    ringIndex: 1,
    primitives: [
      { id: "mtls", label: "mTLS" },
      { id: "spiffe", label: "SPIFFE" },
      { id: "xchacha", label: "XChaCha20" },
      { id: "x509", label: "X.509" },
      { id: "autorotate", label: "Auto-Rotate" },
    ],
    description:
      "mTLS via SPIFFE/SPIRE, auto-rotated X.509 certs. Data at rest sealed with XChaCha20-Poly1305. Key material never hits disk unencrypted.",
  },
  {
    id: "secrets",
    name: "Hardware Secrets",
    subtitle: "HSM & TPM-backed",
    icon: KeyRound,
    color: "#F4D58D",
    bgClass: "bg-gold/10",
    borderClass: "border-gold/30",
    textClass: "text-gold",
    ringIndex: 2,
    primitives: [
      { id: "hsm", label: "HSM" },
      { id: "tpm", label: "TPM 2.0" },
      { id: "vault", label: "Vault" },
      { id: "pkcs11", label: "PKCS#11" },
      { id: "sealed", label: "Sealed Keys" },
    ],
    description:
      "API keys, model weights, and RAG credentials sealed to host hardware identity via HSM, TPM 2.0, Vault, and PKCS#11.",
  },
  {
    id: "observability",
    name: "Observability & Provenance",
    subtitle: "Full trace & attestation",
    icon: Eye,
    color: "#8aa89b",
    bgClass: "bg-sage/10",
    borderClass: "border-sage/30",
    textClass: "text-sage-light",
    ringIndex: 3,
    primitives: [
      { id: "otel", label: "OTel" },
      { id: "attest", label: "Attestation" },
      { id: "merkle", label: "Merkle Log" },
      { id: "sigstore", label: "Sigstore" },
      { id: "worm", label: "WORM" },
    ],
    description:
      "OpenTelemetry on every call. Outputs signed with attestation keys. Tamper-evident Merkle audit log. Offline verification via Sigstore.",
  },
  {
    id: "airgap",
    name: "Air-Gap & Compliance",
    subtitle: "Offline-first, audit-ready",
    icon: Network,
    color: "#d4b46a",
    bgClass: "bg-gold-dark/10",
    borderClass: "border-gold-dark/30",
    textClass: "text-gold-dark",
    ringIndex: 4,
    primitives: [
      { id: "offline", label: "Offline" },
      { id: "soc2", label: "SOC 2" },
      { id: "hipaa", label: "HIPAA" },
      { id: "fedramp", label: "FedRAMP" },
      { id: "iso", label: "ISO 27001" },
    ],
    description:
      "Runs fully offline. Model packages verified without internet. SOC 2 Type II, HIPAA, FedRAMP, ISO 27001 ready.",
  },
];

// Ring radii from innermost to outermost
const RING_RADII = [14, 22, 30, 38, 46];
const CENTER = 50;

function getPrimitivePosition(
  ringIndex: number,
  primitiveIndex: number,
  totalPrimitives: number
) {
  const r = RING_RADII[ringIndex];
  const angle =
    (2 * Math.PI * primitiveIndex) / totalPrimitives - Math.PI / 2;
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  };
}

// ---------- component ----------

export default function SecurityMatrix() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  const activeLayerObj = layers.find((l) => l.id === activeLayer);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
      {/* Left — Layer list */}
      <div className="space-y-3">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <motion.button
              key={layer.id}
              onClick={() =>
                setActiveLayer(isActive ? null : layer.id)
              }
              onMouseEnter={() => setActiveLayer(layer.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-300 ${
                isActive
                  ? `${layer.bgClass} ${layer.borderClass}`
                  : "border-navy-200/50 bg-navy-300/40 hover:border-navy-200/80"
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? layer.bgClass : "bg-navy-200/60"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? layer.textClass : "text-sage-dim"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm font-semibold ${
                        isActive ? layer.textClass : "text-sage-light"
                      }`}
                    >
                      {layer.name}
                    </h3>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isActive
                          ? `${layer.textClass} rotate-90`
                          : "text-sage-dim"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-sage-dim mt-0.5">
                    {layer.subtitle}
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
                      {layer.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {layer.primitives.map((p) => (
                        <span
                          key={p.id}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${layer.bgClass} ${layer.textClass} border ${layer.borderClass}`}
                        >
                          {p.label}
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

      {/* Right — Defense Rings SVG */}
      <div className="relative w-full aspect-square max-h-[560px] rounded-xl border border-navy-200/50 bg-navy/60 overflow-hidden">
        {/* Background glow */}
        {activeLayerObj && (
          <motion.div
            key={activeLayerObj.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${activeLayerObj.color}, transparent 60%)`,
            }}
          />
        )}

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Concentric rings — one per layer */}
          {layers.map((layer) => {
            const r = RING_RADII[layer.ringIndex];
            const isActive = activeLayer === layer.id;
            const isAnyActive = !!activeLayer;

            return (
              <motion.circle
                key={layer.id}
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke={isActive ? layer.color : "#0d2e4a"}
                strokeWidth={isActive ? 0.5 : 0.15}
                strokeDasharray={isActive ? "none" : "1.5 2.5"}
                animate={{
                  opacity: isActive ? 0.8 : isAnyActive ? 0.08 : 0.15,
                  strokeWidth: isActive ? 0.5 : 0.15,
                }}
                transition={{ duration: 0.5 }}
              />
            );
          })}

          {/* Active ring outer glow */}
          {activeLayerObj && (
            <motion.circle
              key={`glow-${activeLayerObj.id}`}
              cx={CENTER}
              cy={CENTER}
              r={RING_RADII[activeLayerObj.ringIndex]}
              fill="none"
              stroke={activeLayerObj.color}
              strokeWidth={1.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.05, 0.15, 0.05] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
          )}

          {/* Central core */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={7}
            fill="#001427"
            stroke={activeLayerObj ? activeLayerObj.color : "#0d2e4a"}
            strokeWidth={activeLayerObj ? 0.4 : 0.2}
            animate={{
              opacity: activeLayer ? 1 : 0.6,
            }}
            transition={{ duration: 0.5 }}
          />

          {/* Lock icon — Unicode as text */}
          <text
            x={CENTER}
            y={CENTER - 0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="4"
            fill={activeLayerObj ? activeLayerObj.color : "#4a5f55"}
            className="select-none"
          >
            &#x1F512;
          </text>
          <motion.text
            x={CENTER}
            y={CENTER + 5}
            textAnchor="middle"
            fontSize="1.8"
            className="font-mono"
            fill={activeLayerObj ? activeLayerObj.color : "#4a5f55"}
            animate={{ opacity: activeLayer ? 0.9 : 0.4 }}
            transition={{ duration: 0.4 }}
          >
            YOUR INFRA
          </motion.text>

          {/* Primitives on rings */}
          {layers.map((layer) => {
            const isActive = activeLayer === layer.id;
            const isAnyActive = !!activeLayer;

            return layer.primitives.map((prim, i) => {
              const pos = getPrimitivePosition(
                layer.ringIndex,
                i,
                layer.primitives.length
              );

              return (
                <g key={prim.id}>
                  {/* Primitive dot */}
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    fill={isActive ? layer.color : "#0d2e4a"}
                    animate={{
                      r: isActive ? 1.8 : 0.8,
                      opacity: isActive ? 1 : isAnyActive ? 0.1 : 0.3,
                    }}
                    transition={{
                      duration: 0.4,
                      type: "spring",
                      stiffness: 300,
                    }}
                  />

                  {/* Pulsing ring around active primitive */}
                  {isActive && (
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={3}
                      fill="none"
                      stroke={layer.color}
                      strokeWidth={0.12}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: i * 0.15,
                      }}
                    />
                  )}

                  {/* Label */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.text
                        x={pos.x}
                        y={pos.y + 4}
                        textAnchor="middle"
                        className="font-mono"
                        fill={layer.color}
                        fontSize="2"
                        initial={{ opacity: 0, y: pos.y + 2 }}
                        animate={{ opacity: 1, y: pos.y + 4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                      >
                        {prim.label}
                      </motion.text>
                    )}
                  </AnimatePresence>
                </g>
              );
            });
          })}

          {/* Connecting spokes from center to active ring */}
          {activeLayerObj &&
            activeLayerObj.primitives.map((prim, i) => {
              const pos = getPrimitivePosition(
                activeLayerObj.ringIndex,
                i,
                activeLayerObj.primitives.length
              );
              return (
                <motion.line
                  key={`spoke-${prim.id}`}
                  x1={CENTER}
                  y1={CENTER}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={activeLayerObj.color}
                  strokeWidth={0.12}
                  strokeDasharray="0.8 1.2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                />
              );
            })}
        </svg>

        {/* Hint */}
        {!activeLayer && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sage-dim text-sm font-mono mt-32">
              ← Hover a security layer to illuminate
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
