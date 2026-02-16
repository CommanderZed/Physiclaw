import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  // Use canonical domain so og:image/twitter:image are absolute URLs crawlers can fetch (www.physiclaw.dev).
  // Do not use VERCEL_URL here—it can be the *.vercel.app preview URL, which breaks link previews.
  metadataBase: new URL("https://www.physiclaw.dev"),
  title: "Physiclaw — Functional AI Agents on Your Hardware",
  description:
    "Open-source software that runs AI agents entirely on your own servers. No cloud, no telemetry, no lock-in. Deploy on bare metal, VMs, or Kubernetes and keep full control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-navy text-sage font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
