"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/utils";

export type ProductActionState = {
  error?: string;
  success?: string;
};

// ─────────────────────────────────────────────────────────────
// Update product
// ─────────────────────────────────────────────────────────────

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, dashes"),
  description: z.string().trim().min(1, "Description is required").max(5000),
  categoryId: z.string().min(1, "Category is required"),
  priceCents: z.coerce.number().int().nonnegative().max(10_000_000),
  tagsCsv: z.string().max(1000).optional().default(""),
  isFeatured: z.coerce.boolean().optional().default(false),
  isNew: z.coerce.boolean().optional().default(false),
  isBestseller: z.coerce.boolean().optional().default(false),
});

export async function updateProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    priceCents: formData.get("priceCents"),
    tagsCsv: formData.get("tagsCsv") ?? "",
    isFeatured: formData.get("isFeatured") === "on",
    isNew: formData.get("isNew") === "on",
    isBestseller: formData.get("isBestseller") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  // Slug collision guard — allow unchanged slug, reject if another product owns it.
  const collision = await prisma.product.findFirst({
    where: { slug: data.slug, NOT: { id: data.id } },
    select: { id: true },
  });
  if (collision) {
    return { error: `Another product already uses slug "${data.slug}"` };
  }

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });
  if (!category) return { error: "Category not found" };

  // Resolve tag csv → Tag ids (upsert missing tags).
  const tagNames = data.tagsCsv
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 30);
  const tagRecords = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { slug: slugify(name), name },
      }),
    ),
  );

  await prisma.product.update({
    where: { id: data.id },
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      categoryId: data.categoryId,
      priceCents: data.priceCents,
      isFeatured: data.isFeatured,
      isNew: data.isNew,
      isBestseller: data.isBestseller,
      tags: { set: tagRecords.map((t) => ({ id: t.id })) },
    },
  });

  revalidatePath(`/admin/products/${data.id}/edit`);
  revalidatePath("/admin/products");
  revalidatePath(`/shop/${data.slug}`);
  revalidatePath("/shop");
  revalidatePath("/");

  return { success: "Saved" };
}

// ─────────────────────────────────────────────────────────────
// Status transitions (publish / archive / reactivate / delete)
// Enforced: DRAFT → ACTIVE (publish), ACTIVE → ARCHIVED (archive),
//           ARCHIVED → ACTIVE (reactivate), DRAFT → deleted.
// Published products can't be hard-deleted — archive instead.
// ─────────────────────────────────────────────────────────────

export async function publishProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!product) return;
  if (product.status !== "DRAFT") return;

  await prisma.product.update({
    where: { id },
    data: { status: "ACTIVE", isActive: true },
  });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function archiveProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!product || product.status !== "ACTIVE") return;

  await prisma.product.update({
    where: { id },
    data: { status: "ARCHIVED", isActive: false },
  });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/shop");
}

export async function reactivateProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!product || product.status !== "ARCHIVED") return;

  await prisma.product.update({
    where: { id },
    data: { status: "ACTIVE", isActive: true },
  });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/shop");
}

export async function deleteDraftProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!product) return;
  if (product.status !== "DRAFT") {
    // Never hard-delete a published product — archive it instead.
    return;
  }
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

// ─────────────────────────────────────────────────────────────
// Image ordering and deletion
// ─────────────────────────────────────────────────────────────

export async function moveProductImageAction(formData: FormData) {
  await requireAdmin();
  const imageId = String(formData.get("imageId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!imageId || (direction !== "up" && direction !== "down")) return;

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
  });
  if (!image) return;

  // Find neighbor image with the closest sortOrder in the requested direction.
  const neighbor = await prisma.productImage.findFirst({
    where: {
      productId: image.productId,
      sortOrder:
        direction === "up"
          ? { lt: image.sortOrder }
          : { gt: image.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;

  await prisma.$transaction([
    prisma.productImage.update({
      where: { id: image.id },
      data: { sortOrder: neighbor.sortOrder },
    }),
    prisma.productImage.update({
      where: { id: neighbor.id },
      data: { sortOrder: image.sortOrder },
    }),
  ]);
  revalidatePath(`/admin/products/${image.productId}/edit`);
}

export async function deleteProductImageAction(formData: FormData) {
  await requireAdmin();
  const imageId = String(formData.get("imageId") ?? "");
  if (!imageId) return;
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { productId: true },
  });
  if (!image) return;

  await prisma.productImage.delete({ where: { id: imageId } });
  revalidatePath(`/admin/products/${image.productId}/edit`);
}

// ─────────────────────────────────────────────────────────────
// License pricing overrides
// ─────────────────────────────────────────────────────────────

const overrideSchema = z.object({
  productId: z.string().min(1),
  licenseId: z.string().min(1),
  priceCents: z.string().trim(), // empty = delete override
});

export async function setLicensePriceOverrideAction(formData: FormData) {
  await requireAdmin();
  const parsed = overrideSchema.safeParse({
    productId: formData.get("productId"),
    licenseId: formData.get("licenseId"),
    priceCents: formData.get("priceCents"),
  });
  if (!parsed.success) return;

  const priceStr = parsed.data.priceCents.trim();
  if (!priceStr) {
    // Empty → remove override.
    await prisma.productLicensePrice
      .delete({
        where: {
          productId_licenseId: {
            productId: parsed.data.productId,
            licenseId: parsed.data.licenseId,
          },
        },
      })
      .catch(() => {});
  } else {
    const cents = Number.parseInt(priceStr, 10);
    if (!Number.isFinite(cents) || cents < 0) return;
    await prisma.productLicensePrice.upsert({
      where: {
        productId_licenseId: {
          productId: parsed.data.productId,
          licenseId: parsed.data.licenseId,
        },
      },
      update: { priceCents: cents },
      create: {
        productId: parsed.data.productId,
        licenseId: parsed.data.licenseId,
        priceCents: cents,
      },
    });
  }
  revalidatePath(`/admin/products/${parsed.data.productId}/edit`);
}

