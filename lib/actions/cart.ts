"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LicenseTier } from "@prisma/client";
import {
  clearCartCookie,
  readCart,
  writeCart,
  type CartItem,
} from "@/lib/cart";
import { prisma } from "@/lib/prisma";

const addSchema = z.object({
  productId: z.string().min(1),
  licenseTier: z.nativeEnum(LicenseTier),
});

export async function addToCartAction(formData: FormData) {
  const parsed = addSchema.safeParse({
    productId: formData.get("productId"),
    licenseTier: formData.get("licenseTier"),
  });
  if (!parsed.success) {
    redirect("/shop");
  }

  // Guard: make sure product is real, active, and published.
  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, isActive: true, status: true },
  });
  if (!product || !product.isActive || product.status !== "ACTIVE") {
    redirect("/shop");
  }

  const cart = await readCart();
  const existing = cart.find(
    (i) =>
      i.productId === parsed.data.productId &&
      i.licenseTier === parsed.data.licenseTier,
  );
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + 1);
  } else {
    const next: CartItem = {
      productId: parsed.data.productId,
      licenseTier: parsed.data.licenseTier,
      quantity: 1,
    };
    cart.push(next);
  }
  await writeCart(cart);
  revalidatePath("/cart");
  redirect("/cart");
}

export async function removeFromCartAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const licenseTierRaw = String(formData.get("licenseTier") ?? "");
  const tierParsed = z.nativeEnum(LicenseTier).safeParse(licenseTierRaw);
  if (!productId || !tierParsed.success) return;

  const cart = await readCart();
  const next = cart.filter(
    (i) =>
      !(i.productId === productId && i.licenseTier === tierParsed.data),
  );
  await writeCart(next);
  revalidatePath("/cart");
}

export async function clearCartAction() {
  await clearCartCookie();
  revalidatePath("/cart");
}
