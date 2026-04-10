import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ReviewQueue } from "@/components/admin/ReviewQueue";

export const metadata = { title: "Review queue" };

type SearchParams = Promise<{ status?: string }>;

export default async function ImportReviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filter =
    params.status === "APPROVED" || params.status === "REJECTED"
      ? params.status
      : "PENDING";

  const [candidates, categories, counts] = await Promise.all([
    prisma.importCandidate.findMany({
      where: { status: filter },
      include: {
        assets: { orderBy: { sortOrder: "asc" } },
        batch: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.importCandidate.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all]),
  ) as Record<string, number>;

  const categoryOptions = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
  }));

  const mapped = candidates.map((c) => ({
    id: c.id,
    groupKey: c.groupKey,
    suggestedTitle: c.suggestedTitle,
    suggestedDescription: c.suggestedDescription,
    suggestedCategory: c.suggestedCategory,
    suggestedTags: c.suggestedTags,
    confidence: c.confidence,
    isDuplicate: c.isDuplicate,
    status: c.status,
    createdProductId: c.createdProductId,
    assets: c.assets.map((a) => ({
      id: a.id,
      previewPath: a.previewPath,
      sourcePath: a.sourcePath,
      originalName: a.originalName,
    })),
    categories: categoryOptions,
    batchId: c.batchId,
    batchMode: c.batch.mode,
    batchCreatedAt: c.batch.createdAt.toISOString(),
  }));

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
            Bulk import
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink-900">
            Review queue
          </h1>
          <p className="mt-3 max-w-2xl text-ink-500">
            Approve, edit, reject, or merge imported candidates. Nothing is
            public until an admin changes the product status to ACTIVE.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/import">← Upload more</Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <CountCard
          label="Pending"
          value={countByStatus.PENDING ?? 0}
          active={filter === "PENDING"}
          href="/admin/import/review?status=PENDING"
        />
        <CountCard
          label="Approved"
          value={countByStatus.APPROVED ?? 0}
          active={filter === "APPROVED"}
          href="/admin/import/review?status=APPROVED"
        />
        <CountCard
          label="Rejected"
          value={countByStatus.REJECTED ?? 0}
          active={filter === "REJECTED"}
          href="/admin/import/review?status=REJECTED"
        />
      </div>

      <div className="mt-10">
        {mapped.length === 0 ? (
          <EmptyState
            title={
              filter === "PENDING"
                ? "No candidates waiting for review"
                : `No ${filter.toLowerCase()} candidates`
            }
            description="Upload a folder or zip to create new draft products."
            action={
              <Button asChild variant="secondary">
                <Link href="/admin/import">Upload assets</Link>
              </Button>
            }
          />
        ) : (
          <ReviewQueue candidates={mapped} categories={categoryOptions} />
        )}
      </div>
    </Container>
  );
}

function CountCard({
  label,
  value,
  active,
  href,
}: {
  label: string;
  value: number;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-2xl border border-ink-900 bg-ink-900 p-5 text-ink-50"
          : "rounded-2xl border border-ink-200 bg-white p-5 hover:border-ink-300"
      }
    >
      <div
        className={
          active
            ? "text-xs uppercase tracking-[0.2em] text-ink-300"
            : "text-xs uppercase tracking-[0.2em] text-ink-500"
        }
      >
        {label}
      </div>
      <div className="mt-2 font-display text-3xl">{value}</div>
    </Link>
  );
}
