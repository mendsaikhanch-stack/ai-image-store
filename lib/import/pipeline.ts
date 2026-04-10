import path from "node:path";
import sharp from "sharp";
import type { ImportMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sha256Hex } from "@/lib/hash";
import {
  ensureDir,
  importPreviewDir,
  importPreviewUrl,
  importSourceDir,
  sanitizeRelativePath,
  writeBytes,
} from "@/lib/storage";
import { getVisionProvider } from "@/lib/vision";
import { candidateTitleFromKey, groupKeyFor } from "./filenameParser";

// One incoming file, regardless of whether it came from a folder
// upload, a zip, or a single-file pick.
export type IncomingFile = {
  relativePath: string;
  filename: string;
  data: Buffer;
  mimeType: string;
};

export type PipelineResult = {
  batchId: string;
  // Candidates created (one per folder in FOLDER mode, one per file in SINGLE).
  candidateCount: number;
  // Asset rows written (images stored to disk).
  assetCount: number;
  // Files skipped because an identical hash is already in a pending batch.
  skippedCount: number;
  // Candidates flagged because at least one asset matched an existing
  // published product. They exist in the review queue with a warning.
  duplicateCandidateCount: number;
};

// Accepts an array of incoming files and produces ImportBatch +
// ImportCandidate + ImportAsset rows. Synchronous MVP — move to a
// background job (BullMQ / Inngest / SQS) once volumes grow.
//
// TODO(watermark): at this stage we store source bytes verbatim. The
// buyer-specific fingerprint is injected later at download time, not
// at import time. See lib/watermark/types.ts for the seam.
export async function processImport(
  files: IncomingFile[],
  mode: ImportMode,
  userId: string,
  note: string | null = null,
): Promise<PipelineResult> {
  const batch = await prisma.importBatch.create({
    data: { createdBy: userId, mode, note },
  });

  const sourceDir = importSourceDir(batch.id);
  const previewDir = importPreviewDir(batch.id);
  await ensureDir(sourceDir);
  await ensureDir(previewDir);

  // Load known category slugs once so we don't query per-file.
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });
  const knownCategorySlugs = categories.map((c) => c.slug);
  const vision = getVisionProvider();

  // Group incoming files by (batch, groupKey).
  const groups = new Map<string, IncomingFile[]>();
  for (const file of files) {
    const key = groupKeyFor(mode, file.relativePath);
    const bucket = groups.get(key);
    if (bucket) bucket.push(file);
    else groups.set(key, [file]);
  }

  let candidateCount = 0;
  let assetCount = 0;
  let skippedCount = 0;
  let duplicateCandidateCount = 0;

  for (const [groupKey, groupFiles] of groups) {
    // Use the first file in the group for suggestion metadata.
    const primary = groupFiles[0];
    if (!primary) continue;

    const suggestion = await vision.suggest({
      filename: primary.filename,
      relativePath: primary.relativePath,
      knownCategorySlugs,
      imageBytes: primary.data,
      mimeType: primary.mimeType,
    });

    // Process assets: hash, write source, generate preview, collect metadata.
    type StagedAsset = {
      sourcePath: string;
      previewPath: string;
      originalName: string;
      relativePath: string;
      fileHash: string;
      sizeBytes: number;
      mimeType: string;
      width: number | null;
      height: number | null;
      sortOrder: number;
    };

    const staged: StagedAsset[] = [];
    let duplicateAgainstProduct: string | null = null;

    for (let i = 0; i < groupFiles.length; i++) {
      const file = groupFiles[i]!;
      const hash = sha256Hex(file.data);

      // Dedup check: against published product images and pending candidates.
      const dupProductImage = await prisma.productImage.findFirst({
        where: { hash },
        select: { productId: true },
      });
      const dupPendingAsset = dupProductImage
        ? null
        : await prisma.importAsset.findFirst({
            where: { fileHash: hash },
            select: { id: true },
          });

      if (dupProductImage) {
        duplicateAgainstProduct = dupProductImage.productId;
        // Still store this asset so the admin can see what was flagged,
        // but mark the whole candidate as duplicate later.
      } else if (dupPendingAsset) {
        // Already uploaded in a prior pending batch; skip entirely.
        skippedCount++;
        continue;
      }

      const safeRel = sanitizeRelativePath(file.relativePath);
      const sourceDest = path.join(sourceDir, safeRel);
      await writeBytes(sourceDest, file.data);

      // Preview: resized webp under public/previews.
      const previewFilename = `${hash.slice(0, 16)}-${i}.webp`;
      const previewDest = path.join(previewDir, previewFilename);

      let width: number | null = null;
      let height: number | null = null;
      try {
        const img = sharp(file.data, { failOn: "none" });
        const meta = await img.metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
        await img
          .resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(previewDest);
      } catch {
        // If sharp can't handle it (corrupt, unsupported), fall back to
        // just copying the original into the preview dir.
        await writeBytes(previewDest, file.data);
      }

      staged.push({
        sourcePath: sourceDest,
        previewPath: importPreviewUrl(batch.id, previewFilename),
        originalName: file.filename,
        relativePath: file.relativePath,
        fileHash: hash,
        sizeBytes: file.data.byteLength,
        mimeType: file.mimeType,
        width,
        height,
        sortOrder: i,
      });
    }

    if (staged.length === 0) continue;

    const title =
      suggestion.title && suggestion.title !== "Untitled"
        ? suggestion.title
        : candidateTitleFromKey(groupKey);

    await prisma.importCandidate.create({
      data: {
        batchId: batch.id,
        groupKey,
        suggestedTitle: title,
        suggestedDescription: suggestion.description,
        suggestedCategory: suggestion.categorySlug,
        suggestedTags: suggestion.tags,
        confidence: suggestion.confidence,
        isDuplicate: duplicateAgainstProduct !== null,
        duplicateOfProductId: duplicateAgainstProduct,
        assets: {
          create: staged,
        },
      },
    });

    candidateCount++;
    assetCount += staged.length;
    if (duplicateAgainstProduct !== null) duplicateCandidateCount++;
  }

  return {
    batchId: batch.id,
    candidateCount,
    assetCount,
    skippedCount,
    duplicateCandidateCount,
  };
}
