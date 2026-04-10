import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// Lazy secret resolver. Throws in production if AUTH_SECRET is missing
// so operators catch misconfiguration on first request instead of
// silently signing sessions with a dev fallback.
let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.AUTH_SECRET;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[auth] AUTH_SECRET must be set in production. " +
          "Configure it in your deployment platform's env vars.",
      );
    }
    cachedSecret = new TextEncoder().encode(
      "dev-secret-change-me-dev-secret-change-me-dev-secret-change-me",
    );
    return cachedSecret;
  }
  if (raw.length < 16) {
    throw new Error(
      "[auth] AUTH_SECRET must be at least 16 characters. Generate one with " +
        "`openssl rand -base64 32` or the PowerShell snippet in README.md.",
    );
  }
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

export const SESSION_COOKIE = "ais_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      (payload.role === "USER" || payload.role === "ADMIN")
    ) {
      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
