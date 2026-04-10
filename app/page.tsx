import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { formatPrice } from "@/lib/utils";
import { t } from "@/lib/i18n";

export default async function HomePage() {
  const [featuredProducts, categories, bundles] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, status: "ACTIVE", isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ take: 5 }),
    prisma.bundle.findMany({ take: 3, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-ink-200">
        <Container className="grid gap-12 py-20 md:grid-cols-[1.1fr_1fr] md:py-28 lg:py-32">
          <div className="flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
              {t.home.hero.eyebrow}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-ink-900 md:text-5xl lg:text-6xl">
              {t.home.hero.titleLine1}
              <br />
              {t.home.hero.titleLine2}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-600">
              {t.home.hero.description}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/shop">{t.home.hero.browseCta}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/license">{t.home.hero.licenseCta}</Link>
              </Button>
            </div>
          </div>

          {featuredProducts[0]?.images[0] ? (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-ink-200 bg-ink-100">
              <Image
                src={featuredProducts[0].images[0].url}
                alt={featuredProducts[0].title}
                fill
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </Container>
      </section>

      {/* Featured categories */}
      {categories.length > 0 ? (
        <section className="border-b border-ink-200">
          <Container className="py-20">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                  {t.home.categories.eyebrow}
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink-900">
                  {t.home.categories.title}
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden text-sm text-ink-700 hover:text-ink-900 sm:block"
              >
                {t.home.categories.viewAll}
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-ink-100"
                >
                  {c.coverUrl ? (
                    <Image
                      src={c.coverUrl}
                      alt={c.name}
                      fill
                      sizes="(min-width: 1024px) 20vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="font-display text-lg text-white">
                      {c.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Featured products */}
      {featuredProducts.length > 0 ? (
        <section className="border-b border-ink-200">
          <Container className="py-20">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                  {t.home.featured.eyebrow}
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink-900">
                  {t.home.featured.title}
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden text-sm text-ink-700 hover:text-ink-900 sm:block"
              >
                {t.home.featured.viewAll}
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((p) => (
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

      {/* Bundles teaser */}
      {bundles.length > 0 ? (
        <section className="border-b border-ink-200 bg-white">
          <Container className="py-20">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                  {t.home.bundlesTeaser.eyebrow}
                </p>
                <h2 className="mt-2 font-display text-3xl text-ink-900">
                  {t.home.bundlesTeaser.title}
                </h2>
              </div>
              <Link
                href="/bundles"
                className="hidden text-sm text-ink-700 hover:text-ink-900 sm:block"
              >
                {t.home.bundlesTeaser.viewAll}
              </Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {bundles.map((b) => (
                <Link
                  key={b.id}
                  href="/bundles"
                  className="group overflow-hidden rounded-2xl border border-ink-200 bg-ink-50"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    {b.coverUrl ? (
                      <Image
                        src={b.coverUrl}
                        alt={b.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                  <div className="p-6">
                    <div className="font-display text-xl text-ink-900">
                      {b.title}
                    </div>
                    <div className="mt-1 text-sm text-ink-500">
                      {b.subtitle}
                    </div>
                    <div className="mt-4 text-sm font-medium text-ink-900">
                      {t.home.bundlesTeaser.from} {formatPrice(b.priceCents, "USD")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Membership teaser */}
      <section className="border-b border-ink-200">
        <Container className="py-20">
          <div className="rounded-2xl border border-ink-200 bg-ink-900 px-10 py-16 text-center text-ink-50">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-300">
              {t.home.membership.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">
              {t.home.membership.title}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-300">
              {t.home.membership.description}
            </p>
          </div>
        </Container>
      </section>

      {/* Trust section */}
      <section>
        <Container className="py-20">
          <div className="grid gap-10 md:grid-cols-3">
            <TrustItem
              title={t.home.trust.item1Title}
              body={t.home.trust.item1Body}
            />
            <TrustItem
              title={t.home.trust.item2Title}
              body={t.home.trust.item2Body}
            />
            <TrustItem
              title={t.home.trust.item3Title}
              body={t.home.trust.item3Body}
            />
          </div>
        </Container>
      </section>
    </>
  );
}

function TrustItem({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="font-display text-xl text-ink-900">{title}</div>
      <p className="mt-2 text-sm text-ink-500">{body}</p>
    </div>
  );
}
