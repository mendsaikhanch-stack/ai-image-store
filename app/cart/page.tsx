import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { readCart } from "@/lib/cart";
import { resolveLicensePrice } from "@/lib/licensePrice";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";
import {
  clearCartAction,
  removeFromCartAction,
} from "@/lib/actions/cart";
import { t } from "@/lib/i18n";

export const metadata = { title: "Сагс" };

export default async function CartPage() {
  const cart = await readCart();

  if (cart.length === 0) {
    return (
      <Container className="py-20">
        <h1 className="font-display text-4xl text-ink-900">{t.cart.title}</h1>
        <div className="mt-10">
          <EmptyState
            title={t.cart.empty.title}
            description={t.cart.empty.description}
            action={
              <Button asChild variant="secondary">
                <Link href="/shop">{t.cart.empty.cta}</Link>
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
      where: { id: { in: productIds } },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        licensePrices: true,
      },
    }),
    prisma.license.findMany(),
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));
  const licenseByTier = new Map(licenses.map((l) => [l.tier, l]));

  type Line = {
    productId: string;
    productSlug: string;
    productTitle: string;
    imageUrl: string | undefined;
    licenseTier: (typeof cart)[number]["licenseTier"];
    licenseName: string;
    priceCents: number;
    quantity: number;
    lineTotal: number;
  };

  const lines: Line[] = [];
  for (const item of cart) {
    const product = productById.get(item.productId);
    const license = licenseByTier.get(item.licenseTier);
    if (!product || !license) continue;
    const priceCents = resolveLicensePrice({
      productBaseCents: product.priceCents,
      license,
      overrides: product.licensePrices,
    });
    lines.push({
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      imageUrl: product.images[0]?.url,
      licenseTier: item.licenseTier,
      licenseName: license.name,
      priceCents,
      quantity: item.quantity,
      lineTotal: priceCents * item.quantity,
    });
  }

  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);

  return (
    <Container className="py-16">
      <h1 className="font-display text-4xl text-ink-900 md:text-5xl">
        {t.cart.title}
      </h1>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <ul className="divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-white">
          {lines.map((l) => (
            <li
              key={`${l.productId}-${l.licenseTier}`}
              className="flex gap-5 p-5"
            >
              <Link
                href={`/shop/${l.productSlug}`}
                className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100"
              >
                {l.imageUrl ? (
                  <Image
                    src={l.imageUrl}
                    alt={l.productTitle}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : null}
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/shop/${l.productSlug}`}
                      className="font-display text-lg text-ink-900 hover:text-accent"
                    >
                      {l.productTitle}
                    </Link>
                    <div className="mt-1 text-xs uppercase tracking-wider text-ink-500">
                      {l.licenseName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-ink-900">
                      {formatPrice(l.lineTotal, "USD")}
                    </div>
                    {l.quantity > 1 ? (
                      <div className="text-xs text-ink-500">
                        {formatPrice(l.priceCents, "USD")} × {l.quantity}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-auto pt-3">
                  <form action={removeFromCartAction}>
                    <input
                      type="hidden"
                      name="productId"
                      value={l.productId}
                    />
                    <input
                      type="hidden"
                      name="licenseTier"
                      value={l.licenseTier}
                    />
                    <button
                      type="submit"
                      className="text-xs text-ink-500 underline underline-offset-4 hover:text-red-600"
                    >
                      {t.cart.remove}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-ink-200 bg-white p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
            {t.cart.summary}
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">{t.cart.subtotal}</dt>
              <dd className="text-ink-900">{formatPrice(subtotal, "USD")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">{t.cart.tax}</dt>
              <dd className="text-ink-500">{t.cart.taxAtCheckout}</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-ink-200 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-ink-900">{t.cart.total}</span>
              <span className="text-xl font-medium text-ink-900">
                {formatPrice(subtotal, "USD")}
              </span>
            </div>
          </div>

          <Button asChild variant="secondary" className="mt-6 w-full">
            <Link href="/checkout">{t.cart.proceedToCheckout}</Link>
          </Button>

          <form action={clearCartAction}>
            <button
              type="submit"
              className="mt-4 w-full text-center text-xs text-ink-500 underline underline-offset-4 hover:text-red-600"
            >
              {t.cart.emptyCart}
            </button>
          </form>
        </aside>
      </div>
    </Container>
  );
}
