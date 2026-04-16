import { headers } from "next/headers";

type RateLimitOptions = {
  key: string;
  windowMs: number;
  limit: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __rateLimitBuckets?: Map<string, Bucket>;
};

const buckets = globalForRateLimit.__rateLimitBuckets ?? new Map<string, Bucket>();

if (!globalForRateLimit.__rateLimitBuckets) {
  globalForRateLimit.__rateLimitBuckets = buckets;
}

function cleanupExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit({
  key,
  windowMs,
  limit,
}: RateLimitOptions): { ok: true; remaining: number } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count };
}

export async function getRequestClientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = store.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

// Test-only helper for isolated unit tests.
export function resetRateLimitBucketsForTest(): void {
  buckets.clear();
}
