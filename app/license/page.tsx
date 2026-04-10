import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { t } from "@/lib/i18n";

export const metadata = {
  title: "Лицензийн нөхцөл",
  description:
    "Ателье дээрх AI зургийн багц бүрийн лицензийн нөхцлийг энгийн монгол хэлээр тайлбарласан.",
};

export default async function LicensePage() {
  const licenses = await prisma.license.findMany({
    orderBy: { priceMultiplier: "asc" },
  });

  return (
    <>
      <section className="border-b border-ink-200">
        <Container className="py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
            {t.license.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-4xl text-ink-900 md:text-5xl">
            {t.license.title}
          </h1>
          <p className="mt-4 max-w-2xl text-ink-500">
            {t.license.description}
          </p>
        </Container>
      </section>

      <section>
        <Container className="py-14">
          <div className="grid gap-6 md:grid-cols-3">
            {licenses.map((l) => (
              <article
                key={l.id}
                className="flex flex-col rounded-2xl border border-ink-200 bg-white p-6"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
                  {t.license.licenseLabel}
                </div>
                <h2 className="mt-2 font-display text-2xl text-ink-900">
                  {l.name}
                </h2>
                <p className="mt-3 text-sm text-ink-500">{l.summary}</p>

                <div className="mt-6 text-xs uppercase tracking-[0.2em] text-ink-500">
                  {t.license.allowed}
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                  {l.allowed.map((a) => (
                    <li key={a} className="flex gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 text-xs uppercase tracking-[0.2em] text-ink-500">
                  {t.license.notAllowed}
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                  {l.notAllowed.map((n) => (
                    <li key={n} className="flex gap-2">
                      <span className="text-red-500">✕</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 text-xs text-ink-500">
                  {t.license.multiplier}
                  {l.priceMultiplier}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-ink-200 bg-white p-8">
            <h2 className="font-display text-2xl text-ink-900">
              {t.license.neverAllowedTitle}
            </h2>
            <p className="mt-3 text-sm text-ink-600">
              {t.license.neverAllowedIntro}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-700">
              {t.license.neverAllowedList.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
