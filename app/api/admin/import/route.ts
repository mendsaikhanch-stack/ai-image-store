import { NextResponse } from "next/server";
import { ImportMode } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { extractZip } from "@/lib/import/zip";
import { processImport, type IncomingFile } from "@/lib/import/pipeline";

// Route handler, not a server action: server actions have a 1MB default
// body limit. Route handlers stream multipart form data without that cap.
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_TOTAL_BYTES = 500 * 1024 * 1024; // 500 MB hard ceiling per upload
// Phase 2.5 spec scopes accepted types to JPEG, PNG, WebP.
const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 },
    );
  }

  const modeRaw = String(form.get("mode") ?? "");
  if (modeRaw !== "FOLDER" && modeRaw !== "SINGLE" && modeRaw !== "ZIP") {
    return NextResponse.json(
      { error: "mode must be FOLDER, SINGLE, or ZIP" },
      { status: 400 },
    );
  }

  const note = (form.get("note") as string | null) || null;

  // ── ZIP upload ─────────────────────────────────────────────
  if (modeRaw === "ZIP") {
    const zipFile = form.get("zip");
    if (!(zipFile instanceof File)) {
      return NextResponse.json(
        { error: "Missing zip file" },
        { status: 400 },
      );
    }
    if (zipFile.size > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: "Zip exceeds 500 MB limit" },
        { status: 413 },
      );
    }

    const zipBytes = Buffer.from(await zipFile.arrayBuffer());
    const entries = extractZip(zipBytes);
    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Zip contained no image files" },
        { status: 400 },
      );
    }

    // A zip of folders always uses FOLDER mode for candidate grouping.
    // To import each image as its own product, the admin can use the
    // SINGLE-mode folder or file picker instead.
    const incoming: IncomingFile[] = entries.map((e) => ({
      relativePath: e.relativePath,
      filename: e.filename,
      data: e.data,
      mimeType: guessMime(e.filename),
    }));

    try {
      const result = await processImport(
        incoming,
        ImportMode.FOLDER,
        user.id,
        note,
      );
      return NextResponse.json({ ok: true, ...result });
    } catch (err) {
      console.error("[import] zip pipeline failed", err);
      return NextResponse.json(
        { error: "Import pipeline failed" },
        { status: 500 },
      );
    }
  }

  // ── Folder / single file upload ────────────────────────────
  const files = form.getAll("files");
  const relativePaths = form.getAll("relativePaths");
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }
  if (files.length !== relativePaths.length) {
    return NextResponse.json(
      { error: "files and relativePaths length mismatch" },
      { status: 400 },
    );
  }

  let total = 0;
  const incoming: IncomingFile[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!(file instanceof File)) continue;
    if (!ACCEPTED_MIME.has(file.type)) continue;
    total += file.size;
    if (total > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: "Upload exceeds 500 MB limit" },
        { status: 413 },
      );
    }
    incoming.push({
      relativePath: String(relativePaths[i] ?? file.name),
      filename: file.name,
      data: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
    });
  }

  if (incoming.length === 0) {
    return NextResponse.json(
      { error: "No valid image files in upload" },
      { status: 400 },
    );
  }

  const mode = modeRaw === "SINGLE" ? ImportMode.SINGLE : ImportMode.FOLDER;
  try {
    const result = await processImport(incoming, mode, user.id, note);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[import] pipeline failed", err);
    return NextResponse.json(
      { error: "Import pipeline failed" },
      { status: 500 },
    );
  }
}

function guessMime(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "tif":
    case "tiff":
      return "image/tiff";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}
