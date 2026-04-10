import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { t } from "@/lib/i18n";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: string;
}>;

export const metadata = {
  title: "Дэлгүүр",
  description: "Ателье дээрх бүх лицензтэй AI зургийн багцуудыг харах.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim();
  const categorySlug = params.category?.trim();
  const sort = params.sort ?? "new";

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    status: "ACTIVE",
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price-asc"
      ? { priceCents: "asc" }
      : sort === "price-desc"
        ? { priceCents: "desc" }
        : { createdAt: "desc" };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <section className="border-b border-ink-200">
        <Container className="py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
            {t.shop.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink-900 md:text-5xl">
            {t.shop.title}
          </h1>
          <p className="mt-3 max-w-xl text-ink-500">
            {t.shop.description(products.length)}
          </p>
          <div className="mt-10">
            <ShopFilters
              categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
              current={{ q, category: categorySlug, sort }}
            />
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-14">
          {products.length === 0 ? (
            <EmptyState
              title={t.shop.empty.title}
              description={t.shop.empty.description}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
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
          )}
        </Container>
      </section>
    </>
  );
}
