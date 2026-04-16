"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Floating bottom-right switcher for the 3 storefront variants.
// Writes both a URL query param and localStorage so the selection
// survives navigation without a full cookie/server round-trip.
//
// Hidden on /admin/*.

type Theme = "midnight-gold" | "aurora-violet" | "stone-cinder";

const VALID: readonly Theme[] = [
  "midnight-gold",
  "aurora-violet",
  "stone-cinder",
] as const;

const STORAGE_KEY = "storefront-theme";

const THEMES: { id: Theme; label: string; swatch: string }[] = [
  {
    id: "midnight-gold",
    label: "Midnight Gold",
    swatch: "linear-gradient(135deg,#0d1024 0%,#d97706 120%)",
  },
  {
    id: "aurora-violet",
    label: "Aurora Violet",
    swatch: "linear-gradient(135deg,#8b5cf6 0%,#06b6d4 120%)",
  },
  {
    id: "stone-cinder",
    label: "Stone Cinder",
    swatch: "linear-gradient(135deg,#44332a 0%,#eab308 120%)",
  },
];

export function ThemeSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  // Restore from localStorage on first mount if the URL has no theme yet.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (searchParams?.get("theme")) return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && (VALID as readonly string[]).includes(saved)) {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("theme", saved);
      router.replace(`${pathname}?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const raw = searchParams?.get("theme") as Theme | null;
  const active: Theme =
    raw && (VALID as readonly string[]).includes(raw) ? raw : "midnight-gold";

  function setTheme(id: Theme) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("theme", id);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="rounded-full border border-ink-200 bg-white/80 p-1.5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-ink-100"
            aria-label="Toggle theme switcher"
            title="Style variants"
          >
            <span aria-hidden>🎨</span>
          </button>

          {expanded ? (
            <div className="flex items-center gap-1 pl-1 pr-2">
              {THEMES.map((t) => {
                const isActive = active === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`group flex items-center gap-2 rounded-full px-2 py-1 transition-colors ${
                      isActive
                        ? "bg-ink-900 text-ink-50"
                        : "text-ink-700 hover:bg-ink-100"
                    }`}
                    aria-pressed={isActive}
                    title={t.label}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-ink-200"
                      style={{ backgroundImage: t.swatch }}
                      aria-hidden
                    />
                    <span className="hidden text-xs font-medium sm:inline">
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="pr-2 text-[10px] uppercase tracking-wider text-ink-500">
              {active.replace("-", " ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
