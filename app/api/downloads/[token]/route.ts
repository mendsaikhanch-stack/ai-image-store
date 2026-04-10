import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { noopWatermark } from "@/lib/watermark/types";

// Secure download endpoint.
//
// Flow:
//   1. Client POSTs /account/downloads → server action creates a
//      DownloadToken scoped to a Download entitlement, returns URL.
//   2. Client navigates here with the token.
//   3. This handler validates token belongs to the signed-in user,
//      token not expired, entitlement not exhausted.
//   4. Reads the source file from disk (storage/source/...)
//   5. Runs it through WatermarkProvider.embed() — today a no-op,
//      Phase 4 wires in per-buyer fingerprinting.
//   6. Streams the bytes back with download headers.
//   7. Atomically: increments Download.usedCount and marks the
//      token used so it can't be replayed.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

export async function GET(
  _request: Request,
  { params }: { params: Params },
) {
  const { token } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const record = await prisma.downloadToken.findUnique({
    where: { token },
    include: {
      download: {
        include: {
          order: { select: { status: true, userId: true } },
        },
      },
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (record.download.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (record.download.order.status !== "PAID") {
    return NextResponse.json({ error: "Order not paid" }, { status: 403 });
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }
  if (record.usedAt) {
    return NextResponse.json(
      { error: "Token already used" },
      { status: 410 },
    );
  }
  if (record.download.usedCount >= record.download.maxCount) {
    return NextResponse.json(
      { error: "Download limit reached" },
      { status: 429 },
    );
  }

  // Resolve the source file. Product.sourcePath is stored as a
  // relative or absolute path. Join with cwd if relative.
  const product = await prisma.product.findUnique({
    where: { id: record.download.productId },
    select: { sourcePath: true, title: true, slug: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product missing" }, { status: 404 });
  }

  const sourcePath = path.isAbsolute(product.sourcePath)
    ? product.sourcePath
    : path.join(process.cwd(), product.sourcePath);

  let bytes: Buffer;
  let mimeType = "application/octet-stream";
  try {
    await stat(sourcePath);
    bytes = await readFile(sourcePath);
  } catch {
    return NextResponse.json(
      {
        error:
          "Source file not found on disk. Seed data uses placeholder paths — approve an imported product to get a real downloadable file.",
      },
      { status: 404 },
    );
  }
  const ext = path.extname(sourcePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
  else if (ext === ".png") mimeType = "image/png";
  else if (ext === ".webp") mimeType = "image/webp";
  else if (ext === ".zip") mimeType = "application/zip";

  // TODO(watermark): invisible buyer fingerprinting injects here.
  // Current provider is a pass-through. Phase 4 can switch to a real
  // embedder keyed on `${user.id}:${record.download.orderId}:${record.download.productId}`
  // without touching any other call site.
  const fingerprint = `${user.id}:${record.download.orderId}:${record.download.productId}`;
  const streamBytes = await noopWatermark.embed({
    sourceBytes: bytes,
    fingerprint,
    mimeType,
  });

  // Atomically record the download. Do this AFTER the bytes are
  // prepared so a failed read doesn't burn through the user's quota.
  await prisma.$transaction([
    prisma.downloadToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.download.update({
      where: { id: record.downloadId },
      data: { usedCount: { increment: 1 } },
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "download",
        target: record.download.productId,
        metadata: {
          orderId: record.download.orderId,
          tokenId: record.id,
        },
      },
    }),
  ]);

  const filename =
    `${product.slug}${ext || ""}` || `download-${record.downloadId}${ext}`;

  return new NextResponse(new Uint8Array(streamBytes), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(streamBytes.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
