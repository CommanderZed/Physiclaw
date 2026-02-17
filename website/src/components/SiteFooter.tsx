"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import PhysiclawLogo from "@/components/PhysiclawLogo";
import XLogo from "@/components/XLogo";

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-navy-200/60">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <PhysiclawLogo height={20} />
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sage-dim">
            <Link href="/demo" className="text-sm hover:text-gold-light transition-colors">
              Demo
            </Link>
            <Link href="/docs" className="text-sm hover:text-gold-light transition-colors">
              Docs
            </Link>
            <Link href="/whitepaper" className="text-sm hover:text-gold-light transition-colors">
              Whitepaper
            </Link>
            <a
              href="https://github.com/CommanderZed/Physiclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-light transition-colors p-1"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://x.com/physiclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold-light transition-colors p-1"
              aria-label="X"
            >
              <XLogo size={20} className="w-5 h-5" />
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
