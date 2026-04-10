import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [totalProducts, totalUsers, totalOrders, revenue, pendingImports] =
    await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalCents: true },
      }),
      prisma.importCandidate.count({ where: { status: "PENDING" } }),
    ]);

  const cards = [
    {
      label: "Total revenue",
      value: formatPrice(revenue._sum.totalCents ?? 0, "USD"),
    },
    { label: "Paid orders", value: totalOrders.toLocaleString() },
    { label: "Users", value: totalUsers.toLocaleString() },
    { label: "Products", value: totalProducts.toLocaleString() },
  ];

  return (
    <Container className="py-12">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
          Dashboard
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink-900">Overview</h1>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-ink-200 bg-white p-6"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
              {c.label}
            </div>
            <div className="mt-3 font-display text-3xl text-ink-900">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Link
          href="/admin/import"
          className="flex items-start justify-between gap-6 rounded-2xl border border-ink-200 bg-white p-6 transition-colors hover:border-ink-300"
        >
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
              Bulk import
            </div>
            <div className="mt-2 font-display text-2xl text-ink-900">
              Upload a folder or zip
            </div>
            <p className="mt-2 text-sm text-ink-500">
              Turn a folder of assets into draft products. Review, edit, and
              approve them before publishing.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
              Pending review
            </div>
            <div className="mt-2 font-display text-3xl text-ink-900">
              {pendingImports}
            </div>
          </div>
        </Link>
      </div>
    </Container>
  );
}
