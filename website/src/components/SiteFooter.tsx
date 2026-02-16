"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import PhysiclawLogo from "@/components/PhysiclawLogo";

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-navy-200/60">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <PhysiclawLogo height={20} />
          </Link>
          <div className="flex items-center gap-6 text-sm text-sage-dim">
            <Link href="/demo" className="hover:text-gold-light transition-colors">
              Demo
            </Link>
            <Link href="/docs" className="hover:text-gold-light transition-colors">
              Docs
            </Link>
            <Link href="/whitepaper" className="hover:text-gold-light transition-colors">
              Whitepaper
            </Link>
            <a
              href="https://github.com/CommanderZed/Physiclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-light transition-colors flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
            <a
              href="https://www.apache.org/licenses/LICENSE-2.0.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-light transition-colors"
            >
              Apache 2.0
            </a>
          </div>
          <p className="text-xs text-sage-dim font-mono">
            &copy; {new Date().getFullYear()} Physiclaw Contributors
          </p>
        </div>
      </div>
    </footer>
  );
}
