"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Terminal } from "lucide-react";

const tabs = [
  {
    id: "oneliner",
    label: "One-liner",
    command: `curl -fsSL https://physiclaw.dev | sh -s -- \\
  --cluster-name my-agents \\
  --enable-gpu \\
  --license oss`,
  },
  {
    id: "docker",
    label: "Docker",
    command: `docker run -d \\
  --name physiclaw-core \\
  --gpus all \\
  -p 8090:8090 \\
  -v /var/physiclaw/data:/data \\
  -e PL_LICENSE=oss \\
  -e PL_CLUSTER_NAME=my-agents \\
  ghcr.io/physiclaw/core:latest`,
  },
  {
    id: "helm",
    label: "Helm",
    command: `helm repo add physiclaw https://physiclaw.dev
helm repo update

helm install physiclaw-core physiclaw/core \\
  --namespace physiclaw \\
  --create-namespace \\
  --set global.license=oss \\
  --set gpu.enabled=true \\
  --set persistence.size=100Gi`,
  },
  {
    id: "source",
    label: "Source",
    command: `git clone https://github.com/CommanderZed/Physiclaw.git
cd Physiclaw

make deps
make build

./bin/physiclaw-server \\
  --config config/default.yaml \\
  --data-dir /var/physiclaw/data`,
  },
];

export default function QuickStartTerminal() {
  const [activeTab, setActiveTab] = useState("oneliner");
  const [copied, setCopied] = useState(false);

  const activeCommand = tabs.find((t) => t.id === activeTab)!;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(activeCommand.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeCommand.command]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Terminal Window */}
      <div className="rounded-xl border border-navy-200/50 bg-navy-300/80 backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-navy-200/60 border-b border-navy-200/60">
          <div className="flex items-center gap-2">
            {/* Traffic lights */}
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-crimson/80" />
              <div className="w-3 h-3 rounded-full bg-gold/80" />
              <div className="w-3 h-3 rounded-full bg-sage/80" />
            </div>
            <div className="ml-3 flex items-center gap-1.5 text-xs text-sage-dim">
              <Terminal className="w-3.5 h-3.5" />
              <span>physiclaw — quick-start</span>
            </div>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-sage hover:text-gold-light hover:bg-navy-200/50 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-sage-light" />
                <span className="text-sage-light">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-navy-200/60 bg-navy-200/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCopied(false);
              }}
              className={`relative px-4 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-gold"
                  : "text-sage-dim hover:text-sage-light"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="terminal-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Terminal Content */}
        <div className="p-5 min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <pre className="font-mono text-sm leading-relaxed">
                <code>
                  <span className="text-gold">$</span>{" "}
                  <span className="text-sage-light">
                    {activeCommand.command}
                  </span>
                  <span className="terminal-cursor text-gold ml-0.5">
                    █
                  </span>
                </code>
              </pre>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
