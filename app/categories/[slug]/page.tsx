import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          category: true,
        },
      },
    },
  });

  if (!category) notFound();

  return (
    <>
      <section className="border-b border-ink-200">
        <Container className="py-16">
          <nav className="text-xs text-ink-500">
            <Link href="/shop" className="hover:text-ink-900">
              Shop
            </Link>
            <span> / </span>
            <span className="text-ink-700">{category.name}</span>
          </nav>
          <h1 className="mt-3 font-display text-4xl text-ink-900 md:text-5xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-4 max-w-xl text-ink-500">{category.description}</p>
          ) : null}
        </Container>
      </section>

      <section>
        <Container className="py-14">
          {category.products.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              description="We're still curating this category. Check back soon."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.products.map((p) => (
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
