import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/session";
import { resolveLicensePrice } from "@/lib/licensePrice";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { formatPrice } from "@/lib/utils";
import { t } from "@/lib/i18n";

export const metadata = { title: "Төлбөр тооцоо" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");

  const cart = await readCart();
  if (cart.length === 0) {
    return (
      <Container className="py-20">
        <h1 className="font-display text-4xl text-ink-900">{t.checkout.title}</h1>
        <div className="mt-10">
          <EmptyState
            title={t.checkout.empty.title}
            description={t.checkout.empty.description}
            action={
              <Button asChild variant="secondary">
                <Link href="/shop">{t.checkout.empty.cta}</Link>
              </Button>
            }
          />
        </div>
      </Container>
    );
  }

  const productIds = Array.from(new Set(cart.map((i) => i.productId)));
  const [products, licenses] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { licensePrices: true },
    }),
    prisma.license.findMany(),
  ]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const licenseByTier = new Map(licenses.map((l) => [l.tier, l]));

  type Line = {
    title: string;
    licenseName: string;
    lineTotal: number;
    quantity: number;
  };

  const lines: Line[] = [];
  let total = 0;
  for (const item of cart) {
    const product = productById.get(item.productId);
    const license = licenseByTier.get(item.licenseTier);
    if (!product || !license) continue;
    const priceCents = resolveLicensePrice({
      productBaseCents: product.priceCents,
      license,
      overrides: product.licensePrices,
    });
    const lineTotal = priceCents * item.quantity;
    total += lineTotal;
    lines.push({
      title: product.title,
      licenseName: license.name,
      lineTotal,
      quantity: item.quantity,
    });
  }

  return (
    <Container className="py-16">
      <h1 className="font-display text-4xl text-ink-900 md:text-5xl">
        {t.checkout.title}
      </h1>
      <p className="mt-3 text-ink-500">
        {t.checkout.signedInAs} <span className="text-ink-900">{user.email}</span>
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
            {t.checkout.orderSummary}
          </div>
          <ul className="mt-5 divide-y divide-ink-200">
            {lines.map((l, i) => (
              <li key={i} className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-ink-900">{l.title}</div>
                  <div className="text-xs uppercase tracking-wider text-ink-500">
                    {l.licenseName}
                    {l.quantity > 1 ? ` · ×${l.quantity}` : ""}
                  </div>
                </div>
                <div className="font-medium text-ink-900">
                  {formatPrice(l.lineTotal, "USD")}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-ink-200 pt-4">
            <span className="font-medium text-ink-900">{t.checkout.total}</span>
            <span className="text-xl font-medium text-ink-900">
              {formatPrice(total, "USD")}
            </span>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-ink-200 bg-white p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
            {t.checkout.payment}
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-ink-200 bg-ink-50 p-4 text-sm text-ink-600">
            <div className="font-medium text-ink-900">{t.checkout.mockProviderTitle}</div>
            <p className="mt-1">
              {t.checkout.mockProviderBody}{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5">
                lib/payments/
              </code>{" "}
              {t.checkout.mockProviderBody2}
            </p>
          </div>
          <div className="mt-6">
            <CheckoutForm totalLabel={formatPrice(total, "USD")} />
          </div>
        </aside>
      </div>
    </Container>
  );
}
