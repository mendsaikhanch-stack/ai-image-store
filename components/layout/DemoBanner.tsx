// Top-of-page strip shown when NEXT_PUBLIC_DEMO_MODE=true. The env var
// is inlined at build time so this renders without any client JS.

export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;
  return (
    <div className="sticky top-0 z-50 w-full border-b border-amber-300 bg-amber-400 text-amber-950">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider">
        <span aria-hidden>⚠</span>
        <span>
          Demo environment — mock payments, test data. Do not enter real
          card or personal details.
        </span>
      </div>
    </div>
  );
}
