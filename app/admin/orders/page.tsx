import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Orders" };

type SearchParams = Promise<{ status?: string }>;

const TABS: { label: string; value: OrderStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Paid", value: "PAID" },
  { label: "Pending", value: "PENDING" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filter = (
    ["PAID", "PENDING", "CANCELLED", "REFUNDED"] as const
  ).includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : "ALL";

  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: filter === "ALL" ? {} : { status: filter },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        items: { select: { id: true } },
      },
      take: 100,
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all]),
  ) as Record<string, number>;
  const totalAll = counts.reduce((n, c) => n + c._count._all, 0);

  return (
    <Container className="py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
        Commerce
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink-900">Orders</h1>

      <nav className="mt-8 flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const active = filter === t.value;
          const count =
            t.value === "ALL" ? totalAll : (countByStatus[t.value] ?? 0);
          return (
            <Link
              key={t.value}
              href={
                t.value === "ALL"
                  ? "/admin/orders"
                  : `/admin/orders?status=${t.value}`
              }
              className={
                active
                  ? "rounded-full bg-ink-900 px-4 py-2 text-sm text-ink-50"
                  : "rounded-full border border-ink-200 px-4 py-2 text-sm text-ink-700 hover:border-ink-300"
              }
            >
              {t.label}
              <span className={active ? "ml-2 text-ink-300" : "ml-2 text-ink-500"}>
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">
        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="When a customer checks out, their order will appear here."
          />
        ) : (
          <ul className="divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={o.status} />
                    <span className="text-xs uppercase tracking-wider text-ink-500">
                      #{o.id.slice(-8)}
                    </span>
                  </div>
                  <div className="mt-1 font-medium text-ink-900">
                    {o.user.name ?? o.user.email}
                  </div>
                  <div className="text-xs text-ink-500">
                    {o.user.email} · {o.items.length} item
                    {o.items.length === 1 ? "" : "s"} ·{" "}
                    {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right font-medium text-ink-900">
                  {formatPrice(o.totalCents, o.currency)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  if (status === "PAID") return <Badge tone="success">Paid</Badge>;
  if (status === "PENDING") return <Badge tone="muted">Pending</Badge>;
  return <Badge tone="neutral">{status.toLowerCase()}</Badge>;
}
