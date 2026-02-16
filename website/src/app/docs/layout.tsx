import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Documentation | Physiclaw",
  description:
    "Physiclaw documentation: what it is, how to install, configure, and run AI agents on your own infrastructure.",
};

export default function DocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-navy bg-grid relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gold/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <SiteNav logoHref="/" showDocsLink />
      <div className="relative z-10">{children}</div>
      <SiteFooter />
    </div>
  );
}
