"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export type LicenseActionState = { error?: string; success?: string };

const schema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(500),
  allowedCsv: z.string().max(2000),
  notAllowedCsv: z.string().max(2000),
  priceMultiplier: z.coerce.number().positive().max(100),
});

export async function updateLicenseAction(
  _prev: LicenseActionState,
  formData: FormData,
): Promise<LicenseActionState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    summary: formData.get("summary"),
    allowedCsv: formData.get("allowedCsv") ?? "",
    notAllowedCsv: formData.get("notAllowedCsv") ?? "",
    priceMultiplier: formData.get("priceMultiplier"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // One line per rule — split on newlines, trim, drop blanks.
  const toLines = (s: string) =>
    s
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 30);

  await prisma.license.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      summary: parsed.data.summary,
      allowed: toLines(parsed.data.allowedCsv),
      notAllowed: toLines(parsed.data.notAllowedCsv),
      priceMultiplier: parsed.data.priceMultiplier,
    },
  });

  revalidatePath("/admin/licenses");
  revalidatePath("/license");
  return { success: "License updated" };
}
