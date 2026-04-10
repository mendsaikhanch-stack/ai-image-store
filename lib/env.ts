// Single source of truth for runtime environment checks.
//
// Call `assertRequiredEnv()` from a request-time code path (e.g. the
// root layout) so missing values fail loudly on the first request in
// production but don't break `next build` during CI.

const REQUIRED_IN_PROD = ["DATABASE_URL", "AUTH_SECRET"] as const;

let alreadyAsserted = false;

export function assertRequiredEnv(): void {
  if (alreadyAsserted) return;
  if (process.env.NODE_ENV !== "production") {
    alreadyAsserted = true;
    return;
  }
  // Next.js sets NEXT_PHASE during build; skip validation then so CI
  // can build without production secrets.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  const missing: string[] = [];
  for (const key of REQUIRED_IN_PROD) {
    if (!process.env[key]) missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required env vars in production: ${missing.join(", ")}.\n` +
        `Set them in your deployment platform (Railway → Variables).`,
    );
  }
  alreadyAsserted = true;
}

export function isDemoMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.DEMO_MODE === "true"
  );
}
