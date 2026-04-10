// Extracts the "group key" that determines which ImportCandidate a
// file belongs to.
//
//   FOLDER mode: group key = parent folder path of the file
//                (top-level folder if the path has depth 1)
//   SINGLE mode: group key = filename base (one file = one candidate)

import type { ImportMode } from "@prisma/client";

export function groupKeyFor(
  mode: ImportMode,
  relativePath: string,
): string {
  const normalized = relativePath.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);

  if (mode === "SINGLE") {
    const last = parts[parts.length - 1] ?? normalized;
    return stripExtension(last);
  }

  // FOLDER mode: use parent folder. If the file is at the root of the
  // upload, fall back to the filename so the candidate is still created.
  if (parts.length <= 1) {
    return stripExtension(parts[0] ?? normalized);
  }
  return parts.slice(0, -1).join("/");
}

export function candidateTitleFromKey(key: string): string {
  const last = key.split("/").filter(Boolean).pop() ?? key;
  return last
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function stripExtension(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, "");
}
