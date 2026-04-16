import AdmZip from "adm-zip";

export type ExtractedEntry = {
  relativePath: string;
  filename: string;
  data: Buffer;
};

type ExtractZipOptions = {
  maxEntries: number;
  maxEntryBytes: number;
  maxTotalBytes: number;
};

// Extracts image entries from a zip Buffer. Ignores directories,
// macOS metadata, and non-image extensions.
export function extractZip(
  zipBytes: Buffer,
  options: ExtractZipOptions,
): ExtractedEntry[] {
  const zip = new AdmZip(zipBytes);
  const entries = zip.getEntries();
  if (entries.length > options.maxEntries) {
    throw new Error(`Zip contains too many files (max ${options.maxEntries}).`);
  }

  const out: ExtractedEntry[] = [];
  let totalBytes = 0;
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName;
    if (name.startsWith("__MACOSX/") || name.endsWith(".DS_Store")) continue;
    if (!isImagePath(name)) continue;

    const declaredSize = entry.header.size;
    if (declaredSize > options.maxEntryBytes) {
      throw new Error(
        `Zip entry "${name}" exceeds the per-file limit of ${Math.floor(
          options.maxEntryBytes / (1024 * 1024),
        )} MB.`,
      );
    }

    const data = entry.getData();
    if (data.byteLength > options.maxEntryBytes) {
      throw new Error(
        `Zip entry "${name}" exceeds the per-file limit of ${Math.floor(
          options.maxEntryBytes / (1024 * 1024),
        )} MB after extraction.`,
      );
    }

    totalBytes += data.byteLength;
    if (totalBytes > options.maxTotalBytes) {
      throw new Error(
        `Zip expands beyond the total extraction limit of ${Math.floor(
          options.maxTotalBytes / (1024 * 1024),
        )} MB.`,
      );
    }

    out.push({
      relativePath: name,
      filename: lastSegment(name),
      data,
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
