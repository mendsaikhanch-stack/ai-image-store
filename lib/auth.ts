import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me-dev-secret-change-me",
);

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
    .sign(SECRET);
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
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
