"use client";

import { usePathname, useSearchParams } from "next/navigation";

// Three atmospheric variants for the public storefront. Rendered as
// fixed, pointer-events-none overlays above the body background but
// below content, using mix-blend-mode so text/cards remain readable.
//
// Variant selection: ?theme=<id> query param. Persistence is handled
// by ThemeSwitcher.tsx writing to localStorage and syncing the URL.
//
// Hidden entirely on /admin/* — admin keeps its existing neutral look.

type Theme = "midnight-gold" | "aurora-violet" | "stone-cinder";
const VALID: readonly Theme[] = [
  "midnight-gold",
  "aurora-violet",
  "stone-cinder",
] as const;
const DEFAULT: Theme = "midnight-gold";

// Inline SVG turbulence noise, tiny (~250 bytes). Base64-free for
// cleaner reads in the CSS Tools tab.
const NOISE_URL = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`;

export function StorefrontBackground() {
  const pathname = usePathname();
  const sp = useSearchParams();

  // Admin is intentionally unthemed.
  if (pathname?.startsWith("/admin")) return null;

  const raw = sp?.get("theme") as Theme | null;
  const theme: Theme =
    raw && (VALID as readonly string[]).includes(raw) ? (raw as Theme) : DEFAULT;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {theme === "midnight-gold" ? <MidnightGoldLayers /> : null}
      {theme === "aurora-violet" ? <AuroraVioletLayers /> : null}
      {theme === "stone-cinder" ? <StoneCinderLayers /> : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Midnight Gold — warm luxury: dark navy shadows at edges,
// large gold glow top-right, secondary warm accent, grain.
// ─────────────────────────────────────────────────────────────

function MidnightGoldLayers() {
  return (
    <>
      {/* Dark navy vignette — pulls corners toward navy via multiply */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(13,16,36,0.28) 100%)",
          mixBlendMode: "multiply",
        }}
      />
      {/* Primary warm gold glow, top-right */}
      <div
        className="absolute right-[-15%] top-[-25%] h-[70vh] w-[80vw] rounded-full blur-2xl md:blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(217,119,6,0.55), rgba(217,119,6,0) 65%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Secondary amber accent, mid-left */}
      <div
        className="absolute left-[-10%] top-[35%] h-[50vh] w-[60vw] rounded-full blur-2xl md:blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(245,158,11,0.22), rgba(245,158,11,0) 70%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Deep navy shadow, bottom-left */}
      <div
        className="absolute bottom-[-25%] left-[-15%] h-[55vh] w-[60vw] rounded-full blur-2xl md:blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(13,16,36,0.4), rgba(13,16,36,0) 70%)",
          mixBlendMode: "multiply",
        }}
      />
      {/* Fine film grain — desktop only */}
      <div
        className="absolute inset-0 hidden opacity-[0.055] md:block"
        style={{
          backgroundImage: NOISE_URL,
          backgroundSize: "180px 180px",
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Aurora Violet — modern AI / futuristic: violet + cyan mesh
// with indigo depth, grain. No vignette so it feels open.
// ─────────────────────────────────────────────────────────────

function AuroraVioletLayers() {
  return (
    <>
      {/* Violet aurora, top-center */}
      <div
        className="absolute left-[15%] top-[-25%] h-[75vh] w-[70vw] rounded-full blur-2xl md:blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse, rgba(139,92,246,0.45), rgba(139,92,246,0) 65%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Cyan wash, bottom-right */}
      <div
        className="absolute bottom-[-20%] right-[-15%] h-[70vh] w-[70vw] rounded-full blur-2xl md:blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse, rgba(6,182,212,0.35), rgba(6,182,212,0) 65%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Indigo depth, mid-left */}
      <div
        className="absolute left-[-20%] top-[25%] h-[65vh] w-[65vw] rounded-full blur-2xl md:blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(79,70,229,0.28), rgba(79,70,229,0) 70%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Cool slate undertone across everything */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(30,27,75,0.1), rgba(8,47,73,0.08))",
          mixBlendMode: "multiply",
        }}
      />
      {/* Very fine grain */}
      <div
        className="absolute inset-0 hidden opacity-[0.04] md:block"
        style={{
          backgroundImage: NOISE_URL,
          backgroundSize: "180px 180px",
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Stone Cinder — editorial boutique: single warm gold accent
// at the bottom, gentle stone vignette, the quietest of the three.
// ─────────────────────────────────────────────────────────────

function StoneCinderLayers() {
  return (
    <>
      {/* Warm stone vignette — subtle warm shadow at corners */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(68,52,35,0.12) 100%)",
          mixBlendMode: "multiply",
        }}
      />
      {/* Single warm gold accent, low and wide */}
      <div
        className="absolute bottom-[-15%] left-[20%] h-[50vh] w-[60vw] rounded-full blur-2xl md:blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse, rgba(234,179,8,0.22), rgba(234,179,8,0) 70%)",
          mixBlendMode: "soft-light",
        }}
      />
      {/* Very faint warm undertone */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(120,100,80,0.04), rgba(120,100,80,0))",
          mixBlendMode: "multiply",
        }}
      />
      {/* Barely-there grain */}
      <div
        className="absolute inset-0 hidden opacity-[0.035] md:block"
        style={{
          backgroundImage: NOISE_URL,
          backgroundSize: "180px 180px",
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
}
