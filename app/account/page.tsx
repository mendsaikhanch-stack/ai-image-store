import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";
import { t } from "@/lib/i18n";

export const metadata = { title: "Хэрэглэгч" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { select: { title: true, slug: true } },
          license: { select: { name: true } },
        },
      },
    },
    take: 20,
  });

  return (
    <Container className="py-16">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
            {t.account.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink-900 md:text-5xl">
            {user.name ?? t.account.titleFallback}
          </h1>
          <p className="mt-2 text-ink-500">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <Button variant="outline" type="submit">
            {t.account.signOut}
          </Button>
        </form>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <AccountNavCard
          title={t.account.navProfileTitle}
          description={t.account.navProfileDesc}
          href="/account"
          isActive
        />
        <AccountNavCard
          title={t.account.navDownloadsTitle}
          description={t.account.navDownloadsDesc}
          href="/account/downloads"
        />
        <AccountNavCard
          title={t.account.navOrdersTitle}
          description={t.account.navOrdersDesc(orders.length)}
          href="/account"
        />
      </div>

      <h2 className="mt-16 font-display text-2xl text-ink-900">{t.account.recentOrders}</h2>

      {orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t.account.emptyOrders.title}
            description={t.account.emptyOrders.description}
            action={
              <Button asChild variant="secondary">
                <Link href="/shop">{t.account.emptyOrders.cta}</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white">
          {orders.map((o) => (
            <li key={o.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
                    {t.account.orderNumber}{o.id.slice(-6)}
                  </div>
                  <div className="mt-1 text-sm text-ink-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-ink-900">
                    {formatPrice(o.totalCents, o.currency)}
                  </div>
                  <div className="mt-1">
                    <OrderStatusBadge status={o.status} />
                  </div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                {o.items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-4">
                    <span>
                      <Link
                        href={`/shop/${it.product.slug}`}
                        className="hover:text-ink-900"
                      >
                        {it.product.title}
                      </Link>
                      <span className="ml-2 text-xs uppercase tracking-wider text-ink-500">
                        {it.license.name}
                      </span>
                    </span>
                    <span>{formatPrice(it.priceCents, o.currency)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}

function AccountNavCard({
  title,
  description,
  href,
  isActive,
}: {
  title: string;
  description: string;
  href: string;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl border p-6 transition-colors ${
        isActive
          ? "border-ink-900 bg-ink-900 text-ink-50"
          : "border-ink-200 bg-white hover:border-ink-300"
      }`}
    >
      <div className="font-display text-lg">{title}</div>
      <p
        className={`mt-1 text-sm ${isActive ? "text-ink-300" : "text-ink-500"}`}
      >
        {description}
      </p>
    </Link>
  );
}

function OrderStatusBadge({
  status,
}: {
  status: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
}) {
  if (status === "PAID") return <Badge tone="success">{t.account.orderStatus.paid}</Badge>;
  if (status === "PENDING") return <Badge tone="muted">{t.account.orderStatus.pending}</Badge>;
  if (status === "CANCELLED") return <Badge tone="neutral">{t.account.orderStatus.cancelled}</Badge>;
  return <Badge tone="neutral">{t.account.orderStatus.refunded}</Badge>;
}
