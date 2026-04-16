import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { StorefrontBackground } from "@/components/decor/StorefrontBackground";
import { ThemeSwitcher } from "@/components/decor/ThemeSwitcher";
import { assertRequiredEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: {
    default: "Ателье — Лицензтэй AI зургийн дэлгүүр",
    template: "%s · Ателье",
  },
  description:
    "Тодорхой арилжааны лицензтэй, хэвлэлтэд бэлэн AI зургийн багцуудын нарийн шалгагдсан дэлгүүр.",
};

// Every route depends on per-request data (session cookie, cart cookie,
// live product data). Skip build-time prerender attempts.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fail loudly at request time if required env vars are missing in
  // production. Cached after first call, so no per-request overhead.
  assertRequiredEnv();

  return (
    <html lang="mn">
      <body className="relative isolate min-h-screen flex flex-col">
        {/* Decor sits above body bg but below content (content uses
            its own background classes; transparent sections let the
            decor show through). Hidden on /admin/*. */}
        <Suspense fallback={null}>
          <StorefrontBackground />
        </Suspense>

        {/* Relative z-10 wrapper so existing content stacks above the
            fixed decor layer. */}
        <div className="relative z-10 flex min-h-screen flex-col">
          <DemoBanner />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>

        <Suspense fallback={null}>
          <ThemeSwitcher />
        </Suspense>
      </body>
    </html>
  );
}
