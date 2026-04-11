import { randomBytes } from "node:crypto";

const urlSafe = (n) => randomBytes(n).toString("base64").replace(/[+/=]/g, "");

console.log(`AUTH_SECRET=${urlSafe(48)}`);
console.log(`SEED_ADMIN_PASSWORD=${urlSafe(18)}`);
console.log(`SEED_USER_PASSWORD=${urlSafe(18)}`);
