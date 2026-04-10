import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { ProductCard } from "@/components/product/ProductCard";
import { resolveLicensePrice } from "@/lib/licensePrice";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });
  if (!product) return { title: "Not found" };
  return { title: product.title, description: product.description };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      licensePrices: true,
    },
  });

  if (!product || !product.isActive || product.status !== "ACTIVE")
    notFound();

  const licenses = await prisma.license.findMany({
    orderBy: { priceMultiplier: "asc" },
  });

  const licenseOptions = licenses.map((l) => ({
    tier: l.tier,
    name: l.name,
    summary: l.summary,
    priceCents: resolveLicensePrice({
      productBaseCents: product.priceCents,
      license: l,
      overrides: product.licensePrices,
    }),
  }));

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      status: "ACTIVE",
      categoryId: product.categoryId,
      NOT: { id: product.id },
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: true },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const allAllowed = Array.from(new Set(licenses.flatMap((l) => l.allowed)));
  const allNotAllowed = Array.from(
    new Set(licenses.flatMap((l) => l.notAllowed)),
  );

  return (
    <>
      <section className="border-b border-ink-200">
        <Container className="py-10">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
            <Link href="/shop" className="hover:text-ink-900">
              Shop
            </Link>
            <span>/</span>
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:text-ink-900"
            >
              {product.category.name}
            </Link>
            <span>/</span>
            <span className="text-ink-700">{product.title}</span>
          </nav>
        </Container>
      </section>

      <section>
        <Container className="py-12">
          <div className="mb-10 flex flex-wrap items-center gap-2">
            {product.isBestseller ? <Badge tone="accent">Bestseller</Badge> : null}
            {product.isNew ? <Badge tone="success">New</Badge> : null}
            {product.isFeatured && !product.isBestseller && !product.isNew ? (
              <Badge tone="muted">Featured</Badge>
            ) : null}
          </div>

          <h1 className="font-display text-4xl text-ink-900 md:text-5xl">
            {product.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-600">
            {product.description}
          </p>

          <div className="mt-12">
            <PurchasePanel
              productId={product.id}
              title={product.title}
              currency={product.currency}
              images={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
              licenseOptions={licenseOptions}
            />
          </div>

          <div className="mt-16 grid gap-10 md:grid-cols-2">
            <div className="rounded-2xl border border-ink-200 bg-white p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
                File details
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Format" value={product.fileFormat} />
                <Row label="Resolution" value={product.fileResolution} />
                <Row label="File count" value={`${product.fileCount} files`} />
                <Row label="Pack size" value={`${product.fileSizeMb} MB`} />
                <Row label="Delivery" value="Instant download after checkout" />
              </dl>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
                What&apos;s included
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink-700">
                <li>• {product.fileCount} high-resolution source files</li>
                <li>• Multiple aspect ratios for print and web</li>
                <li>• License certificate with your order</li>
                <li>• Free updates if the pack is revised</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
                Allowed uses
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink-700">
                {allAllowed.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
                Not allowed
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink-700">
                {allNotAllowed.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="text-red-500">✕</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/license"
                className="mt-4 inline-block text-sm text-ink-900 underline underline-offset-4 hover:text-accent"
              >
                Read the full license →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {related.length > 0 ? (
        <section className="border-t border-ink-200 bg-white">
          <Container className="py-16">
            <h2 className="font-display text-2xl text-ink-900">You may also like</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  slug={p.slug}
                  title={p.title}
                  priceCents={p.priceCents}
                  currency={p.currency}
                  imageUrl={p.images[0]?.url}
                  category={p.category.name}
                  isFeatured={p.isFeatured}
                  isNew={p.isNew}
                  isBestseller={p.isBestseller}
                />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-ink-900">{value}</dd>
    </div>
  );
}
