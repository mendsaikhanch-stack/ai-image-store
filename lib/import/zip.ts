import AdmZip from "adm-zip";

export type ExtractedEntry = {
  relativePath: string;
  filename: string;
  data: Buffer;
};

// Extracts image entries from a zip Buffer. Ignores directories,
// macOS metadata, and non-image extensions.
export function extractZip(zipBytes: Buffer): ExtractedEntry[] {
  const zip = new AdmZip(zipBytes);
  const entries = zip.getEntries();

  const out: ExtractedEntry[] = [];
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName;
    if (name.startsWith("__MACOSX/") || name.endsWith(".DS_Store")) continue;
    if (!isImagePath(name)) continue;

    out.push({
      relativePath: name,
      filename: lastSegment(name),
      data: entry.getData(),
    });
  }
  return out;
}

function lastSegment(p: string): string {
  const parts = p.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] ?? p;
}

// Accepted per Phase 2.5 spec: JPEG, PNG, WebP only. Anything else in the
// zip is silently skipped to keep the review queue clean.
function isImagePath(name: string): boolean {
  return /\.(png|jpe?g|webp)$/i.test(name);
}
