import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Edge-safe admin guard. Runs BEFORE the server component tree, so
// non-admin requests never load Prisma or hit the database.
//
// Uses `jose` for JWT verification (works in the edge runtime).
// `lib/session.ts::requireAdminOrRedirect()` remains as a second
// line of defense in server components for defense-in-depth.

const SESSION_COOKIE = "ais_session";

let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.AUTH_SECRET;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[middleware] AUTH_SECRET must be set in production",
      );
    }
    cachedSecret = new TextEncoder().encode(
      "dev-secret-change-me-dev-secret-change-me-dev-secret-change-me",
    );
    return cachedSecret;
  }
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

async function isAdmin(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === "ADMIN";
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const ok = await isAdmin(token);

  if (ok) return NextResponse.next();

  // API routes return 403 JSON; page routes redirect to login.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL("/login", req.url);
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
