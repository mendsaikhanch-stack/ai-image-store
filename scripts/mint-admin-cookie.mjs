// Mints an admin session JWT using the same signing logic as lib/auth.ts
// and prints it to stdout so we can pass it via curl -b.
//
// Used only for e2e testing — production never calls this.

import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);
if (!process.env.AUTH_SECRET) {
  console.error("AUTH_SECRET not set");
  process.exit(1);
}

const prisma = new PrismaClient();

const user = await prisma.user.findUnique({
  where: { email: "admin@atelier.dev" },
});
if (!user) {
  console.error("admin@atelier.dev not found — did you run db:seed?");
  process.exit(1);
}

const token = await new SignJWT({
  sub: user.id,
  email: user.email,
  role: user.role,
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime(`${60 * 60 * 24 * 7}s`)
  .sign(SECRET);

process.stdout.write(`ais_session=${token}`);
await prisma.$disconnect();
