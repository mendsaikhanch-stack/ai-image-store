import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Storage layout:
//
//   storage/source/imports/<batchId>/<relative-path>    (paid files, never public)
//   public/previews/imports/<batchId>/<hash>.webp        (served by Next)
//
// For MVP this is local disk. Swap for S3/GCS later by replacing these
// helpers — the rest of the code only touches storage through them.

const PROJECT_ROOT = process.cwd();

const SOURCE_ROOT = path.resolve(
  PROJECT_ROOT,
  process.env.STORAGE_SOURCE_DIR ?? "./storage/source",
);

const PREVIEW_ROOT = path.resolve(
  PROJECT_ROOT,
  process.env.STORAGE_PREVIEW_DIR ?? "./public/previews",
);

export function importSourceDir(batchId: string): string {
  return path.join(SOURCE_ROOT, "imports", batchId);
}

export function importPreviewDir(batchId: string): string {
  return path.join(PREVIEW_ROOT, "imports", batchId);
}

export function productPreviewDir(productId: string): string {
  return path.join(PREVIEW_ROOT, "products", productId);
}

// Public URL path (served under Next's /public). Always forward slashes.
export function importPreviewUrl(batchId: string, filename: string): string {
  return `/previews/imports/${batchId}/${filename}`;
}

export function productPreviewUrl(productId: string, filename: string): string {
  return `/previews/products/${productId}/${filename}`;
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function writeBytes(
  filePath: string,
  data: Buffer | Uint8Array,
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, data);
}

// Sanitize a path segment coming from an untrusted zip or directory
// upload. Drops "..", leading slashes, and Windows drive letters.
export function sanitizeRelativePath(input: string): string {
  const cleaned = input
    .replace(/\\/g, "/")
    .replace(/^[a-zA-Z]:/, "")
    .replace(/^\/+/, "")
    .split("/")
    .filter((seg) => seg && seg !== "." && seg !== "..")
    .join("/");
  return cleaned || "unnamed";
}
