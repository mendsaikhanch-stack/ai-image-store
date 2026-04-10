import { cookies } from "next/headers";
import { LicenseTier } from "@prisma/client";
import { z } from "zod";

export const CART_COOKIE = "ais_cart";

// Stored as compact JSON in an httpOnly cookie. Server-only.
const cartItemSchema = z.object({
  productId: z.string().min(1),
  licenseTier: z.nativeEnum(LicenseTier),
  quantity: z.number().int().min(1).max(99),
});

const cartSchema = z.array(cartItemSchema).max(50);

export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;

export async function readCart(): Promise<Cart> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = cartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function writeCart(cart: Cart): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearCartCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}

export function cartItemCount(cart: Cart): number {
  return cart.reduce((n, i) => n + i.quantity, 0);
}
