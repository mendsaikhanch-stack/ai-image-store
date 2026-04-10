import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { DownloadButton } from "@/components/account/DownloadButton";
import { t } from "@/lib/i18n";

export const metadata = { title: "Татан авалт" };

type SearchParams = Promise<{ success?: string }>;

export default async function DownloadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/downloads");

  const { success } = await searchParams;

  const downloads = await prisma.download.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const productIds = Array.from(new Set(downloads.map((d) => d.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  return (
    <Container className="py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
        {t.downloads.eyebrow}
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink-900 md:text-5xl">
        {t.downloads.title}
      </h1>
      <p className="mt-3 text-ink-500">
        {t.downloads.description}
      </p>

      {success ? (
        <div className="mt-8">
          <Alert tone="success">
            {t.downloads.success}
          </Alert>
        </div>
      ) : null}

      <div className="mt-10">
        {downloads.length === 0 ? (
          <EmptyState
            title={t.downloads.empty.title}
            description={t.downloads.empty.description}
            action={
              <Button asChild variant="secondary">
                <Link href="/shop">{t.downloads.empty.cta}</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-white">
            {downloads.map((d) => {
              const product = productById.get(d.productId);
              if (!product) return null;
              const remaining = d.maxCount - d.usedCount;
              return (
                <li
                  key={d.id}
                  className="flex items-center gap-5 p-5"
                >
                  <Link
                    href={`/shop/${product.slug}`}
                    className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-ink-100"
                  >
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.title}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <Link
                        href={`/shop/${product.slug}`}
                        className="font-display text-lg text-ink-900 hover:text-accent"
                      >
                        {product.title}
                      </Link>
                      <Badge tone="muted">
                        {licenseLabel(d.licenseTier)}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                      {remaining > 0
                        ? t.downloads.remaining(remaining, d.maxCount)
                        : t.downloads.limitReached}
                    </div>
                  </div>
                  <DownloadButton
                    downloadId={d.id}
                    disabled={remaining <= 0}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-6 text-xs text-ink-500">
        {t.downloads.securityNote}
      </p>
    </Container>
  );
}

function licenseLabel(tier: string): string {
  return t.downloads.licenseLabels[tier] ?? tier;
}
