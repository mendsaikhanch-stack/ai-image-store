import { NextResponse } from "next/server";

// Lightweight health endpoint for Railway / uptime monitors.
// Intentionally does NOT touch the database — a DB outage should
// degrade the app gracefully, not kill the health check and cause
// the platform to recycle containers.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const START_TIME = Date.now();

export async function GET() {
  return NextResponse.json({
    status: "ok",
    uptime_ms: Date.now() - START_TIME,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV ?? "unknown",
    demo: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
  });
}
