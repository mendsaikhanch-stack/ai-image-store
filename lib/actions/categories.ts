"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/utils";

export type CategoryActionState = { error?: string; success?: string };

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, dashes")
    .optional(),
  description: z.string().trim().max(500).optional(),
  coverUrl: z.string().trim().max(500).optional(),
});

export async function createCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const slug = parsed.data.slug ?? slugify(parsed.data.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return { error: `Category "${slug}" already exists` };

  await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      coverUrl: parsed.data.coverUrl ?? null,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: `Created "${parsed.data.name}"` };
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  coverUrl: z.string().trim().max(500).optional(),
});

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
  });
  if (!parsed.success) return;

  await prisma.category.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      coverUrl: parsed.data.coverUrl ?? null,
    },
  });

  revalidatePath("/admin/categories");
}
