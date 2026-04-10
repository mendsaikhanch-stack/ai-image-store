import { createHash } from "node:crypto";

// SHA-256 hex digest of arbitrary bytes. Used for source-file dedup
// across imports and existing product images.
export function sha256Hex(data: Buffer | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}
