"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/utils";

export type ImportActionState = { error?: string; success?: string };

// ─────────────────────────────────────────────────────────────
// Update candidate suggestions
// ─────────────────────────────────────────────────────────────

const updateSchema = z.object({
  candidateId: z.string().min(1),
  suggestedTitle: z.string().trim().min(1, "Title is required").max(120),
  suggestedDescription: z.string().trim().max(2000).optional(),
  suggestedCategory: z.string().trim().min(1, "Category is required"),
  suggestedTags: z.string().max(500), // comma-separated input
});

export async function updateImportCandidateAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  await requireAdmin();
  const parsed = updateSchema.safeParse({
    candidateId: formData.get("candidateId"),
    suggestedTitle: formData.get("suggestedTitle"),
    suggestedDescription: formData.get("suggestedDescription") ?? undefined,
    suggestedCategory: formData.get("suggestedCategory"),
    suggestedTags: formData.get("suggestedTags"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const tags = parsed.data.suggestedTags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);

  await prisma.importCandidate.update({
    where: { id: parsed.data.candidateId },
    data: {
      suggestedTitle: parsed.data.suggestedTitle,
      suggestedDescription: parsed.data.suggestedDescription || null,
      suggestedCategory: parsed.data.suggestedCategory,
      suggestedTags: tags,
    },
  });

  revalidatePath("/admin/import/review");
  return { success: "Updated" };
}

// ─────────────────────────────────────────────────────────────
// Reject
// ─────────────────────────────────────────────────────────────

export async function rejectImportCandidateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("candidateId") ?? "");
  if (!id) return;
  await prisma.importCandidate.update({
    where: { id },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin/import/review");
}

// ─────────────────────────────────────────────────────────────
// Approve (single) — thin wrapper around the internal helper
// ─────────────────────────────────────────────────────────────

const approveSchema = z.object({
  candidateId: z.string().min(1),
});

export async function approveImportCandidateAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  await requireAdmin();
  const parsed = approveSchema.safeParse({
    candidateId: formData.get("candidateId"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const result = await approveCandidateInternal(parsed.data.candidateId);
  revalidatePath("/admin/import/review");
  return result.ok
    ? { success: `Created draft "${result.productTitle}"` }
    : { error: result.error };
}

// ─────────────────────────────────────────────────────────────
// Bulk approve
// ─────────────────────────────────────────────────────────────

// Bulk approve. Auto-skips any candidate flagged as a duplicate — the
// spec explicitly scopes bulk approve to "safe non-duplicate items".
// The admin can still approve a duplicate candidate individually from
// its review card.
export async function bulkApproveImportCandidatesAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  await requireAdmin();

  const ids = formData
    .getAll("candidateIds")
    .map((v) => String(v))
    .filter(Boolean);

  if (ids.length === 0) return { error: "Nothing selected" };

  // Pre-fetch just the flags so we can skip duplicates cleanly.
  const preflight = await prisma.importCandidate.findMany({
    where: { id: { in: ids } },
    select: { id: true, isDuplicate: true, status: true },
  });

  const approvable = preflight.filter(
    (c) => c.status === "PENDING" && !c.isDuplicate,
  );
  const skippedDuplicates = preflight.filter(
    (c) => c.status === "PENDING" && c.isDuplicate,
  ).length;

  let approved = 0;
  const errors: string[] = [];

  for (const { id } of approvable) {
    const result = await approveCandidateInternal(id);
    if (result.ok) {
      approved++;
    } else {
      errors.push(result.error);
    }
  }

  revalidatePath("/admin/import/review");

  const parts: string[] = [];
  if (approved > 0)
    parts.push(`Approved ${approved} candidate${approved === 1 ? "" : "s"}`);
  if (skippedDuplicates > 0)
    parts.push(`skipped ${skippedDuplicates} duplicate${skippedDuplicates === 1 ? "" : "s"}`);
  if (errors.length > 0) parts.push(`${errors.length} error${errors.length === 1 ? "" : "s"}`);

  if (approved === 0 && errors.length > 0) {
    return { error: `No candidates approved. ${errors[0]}` };
  }
  if (approved === 0 && skippedDuplicates > 0) {
    return {
      error: `All selected items are duplicates. Approve them individually if safe.`,
    };
  }
  if (approved === 0) return { error: "Nothing to approve." };

  return { success: parts.join(", ") };
}

// Bulk reject. Only flips PENDING candidates to REJECTED so we never
// undo a prior approval by accident.
export async function bulkRejectImportCandidatesAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  await requireAdmin();

  const ids = formData
    .getAll("candidateIds")
    .map((v) => String(v))
    .filter(Boolean);

  if (ids.length === 0) return { error: "Nothing selected" };

  const result = await prisma.importCandidate.updateMany({
    where: { id: { in: ids }, status: "PENDING" },
    data: { status: "REJECTED" },
  });

  revalidatePath("/admin/import/review");

  if (result.count === 0) {
    return { error: "Nothing to reject (selection may already be processed)" };
  }
  return {
    success: `Rejected ${result.count} candidate${result.count === 1 ? "" : "s"}`,
  };
}

// ─────────────────────────────────────────────────────────────
// Merge into an existing product
// ─────────────────────────────────────────────────────────────

const mergeSchema = z.object({
  candidateId: z.string().min(1),
  targetSlug: z.string().trim().min(1, "Target product slug required"),
});

export async function mergeImportCandidateAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  await requireAdmin();
  const parsed = mergeSchema.safeParse({
    candidateId: formData.get("candidateId"),
    targetSlug: formData.get("targetSlug"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const candidate = await prisma.importCandidate.findUnique({
    where: { id: parsed.data.candidateId },
    include: { assets: { orderBy: { sortOrder: "asc" } } },
  });
  if (!candidate) return { error: "Candidate not found" };
  if (candidate.status !== "PENDING")
    return { error: "Candidate is not pending" };

  const targetSlug = slugify(parsed.data.targetSlug);
  const target = await prisma.product.findUnique({
    where: { slug: targetSlug },
    include: { images: { orderBy: { sortOrder: "desc" }, take: 1 } },
  });
  if (!target) {
    return { error: `No product with slug "${targetSlug}"` };
  }

  const nextSortOrder = (target.images[0]?.sortOrder ?? -1) + 1;

  await prisma.$transaction([
    prisma.productImage.createMany({
      data: candidate.assets.map((a, i) => ({
        productId: target.id,
        url: a.previewPath,
        alt: candidate.suggestedTitle,
        sortOrder: nextSortOrder + i,
        hash: a.fileHash,
      })),
    }),
    prisma.importCandidate.update({
      where: { id: candidate.id },
      data: { status: "APPROVED", createdProductId: target.id },
    }),
  ]);

  revalidatePath("/admin/import/review");
  return { success: `Merged ${candidate.assets.length} images into ${target.title}` };
}

// ─────────────────────────────────────────────────────────────
// Internal: approve a single candidate. Not a server action — shared
// by approveImportCandidateAction and bulkApproveImportCandidatesAction.
// ─────────────────────────────────────────────────────────────

type ApproveResult =
  | { ok: true; productId: string; productTitle: string }
  | { ok: false; error: string };

async function approveCandidateInternal(
  candidateId: string,
): Promise<ApproveResult> {
  const candidate = await prisma.importCandidate.findUnique({
    where: { id: candidateId },
    include: { assets: { orderBy: { sortOrder: "asc" } } },
  });
  if (!candidate) return { ok: false, error: "Candidate not found" };
  if (candidate.status !== "PENDING")
    return { ok: false, error: `"${candidate.suggestedTitle}" is not pending` };
  if (!candidate.suggestedCategory) {
    return {
      ok: false,
      error: `"${candidate.suggestedTitle}" has no category`,
    };
  }
  if (candidate.assets.length === 0) {
    return {
      ok: false,
      error: `"${candidate.suggestedTitle}" has no assets`,
    };
  }

  const category = await prisma.category.findUnique({
    where: { slug: candidate.suggestedCategory },
  });
  if (!category) {
    return {
      ok: false,
      error: `Category "${candidate.suggestedCategory}" does not exist`,
    };
  }

  const primaryAsset = candidate.assets[0]!;
  const slug = await allocateSlug(candidate.suggestedTitle);

  const product = await prisma.$transaction(async (tx) => {
    const tagRecords = await Promise.all(
      candidate.suggestedTags.map((tagName) =>
        tx.tag.upsert({
          where: { slug: slugify(tagName) },
          update: {},
          create: { slug: slugify(tagName), name: tagName },
        }),
      ),
    );

    const created = await tx.product.create({
      data: {
        slug,
        title: candidate.suggestedTitle,
        description:
          candidate.suggestedDescription ??
          `Imported from ${candidate.groupKey}`,
        priceCents: 3900,
        categoryId: category.id,
        sourcePath: primaryAsset.sourcePath,
        status: "DRAFT",
        isActive: false,
        fileCount: candidate.assets.length,
        fileSizeMb: Math.max(
          1,
          Math.round(
            candidate.assets.reduce((n, a) => n + a.sizeBytes, 0) / 1_000_000,
          ),
        ),
        fileResolution:
          primaryAsset.width && primaryAsset.height
            ? `${primaryAsset.width}×${primaryAsset.height} px`
            : "4096×4096 px",
        tags: { connect: tagRecords.map((t) => ({ id: t.id })) },
        images: {
          create: candidate.assets.map((a, i) => ({
            url: a.previewPath,
            alt: candidate.suggestedTitle,
            sortOrder: i,
            hash: a.fileHash,
          })),
        },
      },
    });

    await tx.importCandidate.update({
      where: { id: candidate.id },
      data: { status: "APPROVED", createdProductId: created.id },
    });

    return created;
  });

  return { ok: true, productId: product.id, productTitle: product.title };
}

async function allocateSlug(title: string): Promise<string> {
  const base = slugify(title) || "untitled-pack";
  let candidate = base;
  let n = 1;
  while (
    await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    n++;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
