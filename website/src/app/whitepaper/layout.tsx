import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whitepaper | Physiclaw",
  description:
    "Technical overview of Physiclaw: open-source agent orchestration for your infrastructure, security architecture, and design goals.",
};

export default function WhitepaperLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
