import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Bundles",
  description: "Curated bundles of AI image packs at a single price.",
};

export default async function BundlesPage() {
  const bundles = await prisma.bundle.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  return (
    <>
      <section className="border-b border-ink-200">
        <Container className="py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
            Bundles
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink-900 md:text-5xl">
            Curated bundles
          </h1>
          <p className="mt-4 max-w-xl text-ink-500">
            Multi-pack collections at a single price. Great for studios and
            agencies who need variety.
          </p>
        </Container>
      </section>

      <section>
        <Container className="py-14">
          {bundles.length === 0 ? (
            <EmptyState
              title="No bundles yet"
              description="We'll add bundles as new packs are released."
              action={
                <Button asChild>
                  <Link href="/shop">Browse the shop</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-10">
              {bundles.map((b) => (
                <article
                  key={b.id}
                  className="grid gap-8 overflow-hidden rounded-2xl border border-ink-200 bg-white md:grid-cols-[1.1fr_1fr]"
                >
                  <div className="relative aspect-[16/10] md:aspect-auto">
                    {b.coverUrl ? (
                      <Image
                        src={b.coverUrl}
                        alt={b.title}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col justify-center p-8 md:p-10">
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                      {b.items.length} packs
                    </p>
                    <h2 className="mt-2 font-display text-3xl text-ink-900">
                      {b.title}
                    </h2>
                    {b.subtitle ? (
                      <p className="mt-2 text-ink-500">{b.subtitle}</p>
                    ) : null}

                    <ul className="mt-6 space-y-2 text-sm text-ink-700">
                      {b.items.map((item) => (
                        <li key={item.id} className="flex gap-2">
                          <span className="text-ink-400">•</span>
                          <Link
                            href={`/shop/${item.product.slug}`}
                            className="hover:text-ink-900"
                          >
                            {item.product.title}
                          </Link>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 flex items-center justify-between">
                      <div className="text-xl font-medium text-ink-900">
                        {formatPrice(b.priceCents, "USD")}
                      </div>
                      <Button asChild variant="secondary">
                        <Link href="/shop">View packs</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
