import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { ImportUploader } from "@/components/admin/ImportUploader";

export const metadata = { title: "Bulk import" };

export default async function ImportPage() {
  const [pendingCount, batches] = await Promise.all([
    prisma.importCandidate.count({ where: { status: "PENDING" } }),
    prisma.importBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { candidates: true } } },
    }),
  ]);

  return (
    <Container className="py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
        Bulk import
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink-900">
        Upload assets
      </h1>
      <p className="mt-3 max-w-2xl text-ink-500">
        Drop a folder or zip of images and the pipeline will create draft
        products for you to review. Nothing is ever published automatically.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <ImportUploader />
        </div>

        <aside className="h-fit rounded-2xl border border-ink-200 bg-white p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
            Review queue
          </div>
          <div className="mt-3 font-display text-4xl text-ink-900">
            {pendingCount}
          </div>
          <p className="mt-1 text-sm text-ink-500">
            candidates waiting for review
          </p>
          <Link
            href="/admin/import/review"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800"
          >
            Open review queue →
          </Link>

          {batches.length > 0 ? (
            <>
              <div className="mt-8 text-xs uppercase tracking-[0.2em] text-ink-500">
                Recent batches
              </div>
              <ul className="mt-3 divide-y divide-ink-200 text-sm">
                {batches.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <div className="font-medium text-ink-900">
                        {b.mode === "FOLDER" ? "Folder" : "Single"} import
                      </div>
                      <div className="text-xs text-ink-500">
                        {new Date(b.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-ink-700">
                      {b._count.candidates}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}
