import Image from "next/image";
import Link from "next/link";
import { Prisma, type ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Products" };

type SearchParams = Promise<{
  status?: string;
  category?: string;
  q?: string;
}>;

const STATUS_TABS: { label: string; value: ProductStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Active", value: "ACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const statusFilter = (
    ["DRAFT", "ACTIVE", "ARCHIVED"] as const
  ).includes(params.status as ProductStatus)
    ? (params.status as ProductStatus)
    : "ALL";
  const categorySlug = params.category?.trim() || undefined;
  const q = params.q?.trim() || undefined;

  const where: Prisma.ProductWhereInput = {
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [products, categories, counts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      take: 100,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countByStatus: Record<string, number> = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all]),
  );
  const totalAll = counts.reduce((n, c) => n + c._count._all, 0);

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
            Catalog
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink-900">Products</h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            Edit titles, pricing, images, and license rules. Publish drafts
            here after reviewing bulk imports.
          </p>
        </div>
      </div>

      <nav className="mt-10 flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => {
          const active = statusFilter === t.value;
          const countLabel =
            t.value === "ALL"
              ? totalAll
              : (countByStatus[t.value] ?? 0);
          const qs = new URLSearchParams();
          if (t.value !== "ALL") qs.set("status", t.value);
          if (categorySlug) qs.set("category", categorySlug);
          if (q) qs.set("q", q);
          return (
            <Link
              key={t.value}
              href={qs.toString() ? `/admin/products?${qs}` : "/admin/products"}
              className={
                active
                  ? "rounded-full bg-ink-900 px-4 py-2 text-sm text-ink-50"
                  : "rounded-full border border-ink-200 px-4 py-2 text-sm text-ink-700 hover:border-ink-300"
              }
            >
              {t.label}
              <span
                className={
                  active ? "ml-2 text-ink-300" : "ml-2 text-ink-500"
                }
              >
                {countLabel}
              </span>
            </Link>
          );
        })}
      </nav>

      <form
        method="get"
        action="/admin/products"
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        {statusFilter !== "ALL" ? (
          <input type="hidden" name="status" value={statusFilter} />
        ) : null}
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search title, slug, description…"
        />
        <Select name="category" defaultValue={categorySlug ?? ""}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState
            title="No products match those filters"
            description="Try a different status, category, or clear the search."
          />
        ) : (
          <ul className="divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white">
            {products.map((p) => (
              <li key={p.id} className="flex items-center gap-5 p-5">
                <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0].url}
                      alt={p.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={p.status} />
                    <span className="text-xs uppercase tracking-wider text-ink-500">
                      {p.category.name}
                    </span>
                  </div>
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="mt-1 block truncate font-display text-lg text-ink-900 hover:text-accent"
                  >
                    {p.title}
                  </Link>
                  <div className="mt-0.5 truncate font-mono text-xs text-ink-500">
                    {p.slug}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-medium text-ink-900">
                    {formatPrice(p.priceCents, p.currency)}
                  </div>
                  <div className="mt-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/products/${p.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === "ACTIVE") return <Badge tone="success">Active</Badge>;
  if (status === "DRAFT") return <Badge tone="muted">Draft</Badge>;
  return <Badge tone="neutral">Archived</Badge>;
}
