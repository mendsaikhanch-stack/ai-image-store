import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Abuse reports" };

export default async function AdminAbuseReportsPage() {
  const reports = await prisma.abuseReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { title: true, slug: true } },
      reporter: { select: { email: true } },
    },
  });

  return (
    <Container className="py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
        Trust &amp; safety
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink-900">
        Abuse reports
      </h1>
      <p className="mt-3 max-w-2xl text-ink-500">
        Reports flagged by users. Review, investigate, and resolve. This
        page is a functional scaffold — resolution actions will be added in
        a follow-up.
      </p>

      <div className="mt-10">
        {reports.length === 0 ? (
          <EmptyState
            title="No abuse reports"
            description="When a user flags a product, it will appear here."
          />
        ) : (
          <ul className="divide-y divide-ink-200 overflow-hidden rounded-2xl border border-ink-200 bg-white">
            {reports.map((r) => (
              <li key={r.id} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={r.resolved ? "success" : "accent"}>
                    {r.resolved ? "Resolved" : "Open"}
                  </Badge>
                  <span className="text-xs uppercase tracking-wider text-ink-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-sm text-ink-900">{r.reason}</div>
                {r.details ? (
                  <p className="mt-1 text-xs text-ink-500">{r.details}</p>
                ) : null}
                <div className="mt-2 text-xs text-ink-500">
                  {r.product ? (
                    <>
                      Product:{" "}
                      <span className="text-ink-700">{r.product.title}</span>{" "}
                      (<span className="font-mono">{r.product.slug}</span>)
                    </>
                  ) : (
                    "No product linked"
                  )}
                  {r.reporter ? <> · Reporter: {r.reporter.email}</> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}
