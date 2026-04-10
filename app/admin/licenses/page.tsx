import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { LicenseEditor } from "@/components/admin/LicenseEditor";

export const metadata = { title: "Licenses" };

export default async function AdminLicensesPage() {
  const licenses = await prisma.license.findMany({
    orderBy: { priceMultiplier: "asc" },
  });

  return (
    <Container className="py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
        Commerce
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink-900">
        License tiers
      </h1>
      <p className="mt-3 max-w-2xl text-ink-500">
        Edit plain-English allowed and not-allowed rules. Changes are
        reflected immediately on the public <code>/license</code> page.
      </p>

      <div className="mt-10 space-y-6">
        {licenses.map((l) => (
          <LicenseEditor key={l.id} license={l} />
        ))}
      </div>
    </Container>
  );
}
