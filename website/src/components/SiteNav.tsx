"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Github, Menu, X } from "lucide-react";
import PhysiclawLogo from "@/components/PhysiclawLogo";

interface SiteNavProps {
  logoHref?: string;
  showDocsLink?: boolean;
}

export default function SiteNav({ logoHref = "/", showDocsLink = false }: SiteNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = (
    <>
      <Link
        href="/demo"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
        onClick={() => setMobileOpen(false)}
      >
        Demo
      </Link>
      {showDocsLink && (
        <Link
          href="/docs"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
          onClick={() => setMobileOpen(false)}
        >
          Docs
        </Link>
      )}
      <Link
        href="/whitepaper"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
        onClick={() => setMobileOpen(false)}
      >
        Whitepaper
      </Link>
      <a
        href="https://github.com/CommanderZed/Physiclaw"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center p-2 rounded-lg text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
        aria-label="GitHub"
      >
        <Github className="w-4 h-4" />
      </a>
    </>
  );

  return (
    <nav className="relative z-20 border-b border-navy-200/60" ref={menuRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Mobile: logo left */}
        <Link
          href={logoHref}
          className="flex shrink-0 md:hidden"
          aria-label="Physiclaw home"
          onClick={() => setMobileOpen(false)}
        >
          <PhysiclawLogo height={24} />
        </Link>

        {/* Desktop: centered logo + right links */}
        <div className="hidden md:grid md:flex-1 md:grid-cols-3 md:items-center">
          <div className="flex justify-start" />
          <Link href={logoHref} className="flex justify-center" aria-label="Physiclaw home">
            <PhysiclawLogo height={26} />
          </Link>
          <div className="flex justify-end items-center gap-2">
            {navLinks}
          </div>
        </div>

        {/* Mobile: menu button right */}
        <div className="flex md:hidden items-center justify-end gap-2 flex-1">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="p-2 rounded-lg text-sage-light bg-navy-300/60 border border-navy-200/60 hover:border-sage/15 hover:text-gold-light transition-all"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-navy border-b border-navy-200/60 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
            <Link
              href="/demo"
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-sage-light hover:bg-navy-300/60 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Demo
            </Link>
            {showDocsLink && (
              <Link
                href="/docs"
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-sage-light hover:bg-navy-300/60 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Docs
              </Link>
            )}
            <Link
              href="/whitepaper"
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-sage-light hover:bg-navy-300/60 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Whitepaper
            </Link>
            <a
              href="https://github.com/CommanderZed/Physiclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-sage-light hover:bg-navy-300/60 transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
