"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { clearCartCookie, readCart } from "@/lib/cart";
import { resolveLicensePrice } from "@/lib/licensePrice";
import { getPaymentProvider } from "@/lib/payments";

export type CheckoutState = {
  error?: string;
};

export async function placeOrderAction(
  _prev: CheckoutState,
  _formData: FormData,
): Promise<CheckoutState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  const cart = await readCart();
  if (cart.length === 0) return { error: "Your cart is empty." };

  // Load all products and licenses referenced by the cart.
  const productIds = Array.from(new Set(cart.map((i) => i.productId)));
  const [products, licenses] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, status: "ACTIVE" },
      include: { licensePrices: true },
    }),
    prisma.license.findMany(),
  ]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const licenseByTier = new Map(licenses.map((l) => [l.tier, l]));

  // Compute line totals.
  type Line = {
    productId: string;
    licenseId: string;
    priceCents: number;
    licenseTier: (typeof cart)[number]["licenseTier"];
    quantity: number;
  };

  const lines: Line[] = [];
  for (const item of cart) {
    const product = productById.get(item.productId);
    const license = licenseByTier.get(item.licenseTier);
    if (!product || !license) {
      return { error: "A product in your cart is no longer available." };
    }
    const priceCents = resolveLicensePrice({
      productBaseCents: product.priceCents,
      license: {
        id: license.id,
        tier: license.tier,
        priceMultiplier: license.priceMultiplier,
      },
      overrides: product.licensePrices,
    });
    lines.push({
      productId: product.id,
      licenseId: license.id,
      licenseTier: license.tier,
      priceCents,
      quantity: item.quantity,
    });
  }

  const totalCents = lines.reduce((n, l) => n + l.priceCents * l.quantity, 0);

  // Create the order up front in PENDING, call the provider, then finalize.
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      status: "PENDING",
      totalCents,
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          licenseId: l.licenseId,
          priceCents: l.priceCents,
          quantity: l.quantity,
        })),
      },
    },
  });

  const provider = getPaymentProvider();
  const charge = await provider.createCharge({
    orderId: order.id,
    amountCents: totalCents,
    currency: "USD",
    customerEmail: user.email,
  });

  if (charge.status !== "PAID") {
    return { error: "Payment was not completed. Please try again." };
  }

  // Mark paid, create Download entitlements, clear cart. All in one tx.
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        providerRef: charge.providerRef,
        paidAt: new Date(),
      },
    }),
    ...lines.map((l) =>
      prisma.download.create({
        data: {
          userId: user.id,
          orderId: order.id,
          productId: l.productId,
          licenseTier: l.licenseTier,
          maxCount: 5,
          usedCount: 0,
        },
      }),
    ),
  ]);

  await clearCartCookie();
  revalidatePath("/account/downloads");
  revalidatePath("/account");
  revalidatePath("/cart");
  redirect("/account/downloads?success=1");
}
