import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Atelier — Licensed AI Image Store",
    template: "%s · Atelier",
  },
  description:
    "A curated marketplace for print-ready AI image packs under clear commercial-use licenses.",
};

// Every route depends on per-request data (session cookie, cart cookie,
// live product data). Skip build-time prerender attempts.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
