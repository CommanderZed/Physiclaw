"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import PhysiclawLogo from "@/components/PhysiclawLogo";

interface SiteNavProps {
  /** Optional link for logo (e.g. / on main site, / on docs) */
  logoHref?: string;
  /** Show "Docs" link in nav (e.g. true on main, false on docs) */
  showDocsLink?: boolean;
}

export default function SiteNav({ logoHref = "/", showDocsLink = false }: SiteNavProps) {
  return (
    <nav className="relative z-20 border-b border-navy-200/60">
      <div className="max-w-7xl mx-auto px-6 h-16 grid grid-cols-3 items-center">
        <div className="flex justify-start" />
        <Link
          href={logoHref}
          className="flex justify-center"
          aria-label="Physiclaw home"
        >
          <PhysiclawLogo height={26} />
        </Link>
        <div className="flex justify-end items-center gap-2">
          {showDocsLink && (
            <Link
              href="/docs"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
            >
              Docs
            </Link>
          )}
          <Link
            href="/whitepaper"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
          >
            Whitepaper
          </Link>
          <a
            href="https://github.com/physiclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-2 rounded-lg text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </nav>
  );
}
