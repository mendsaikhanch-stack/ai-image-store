import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { t } from "@/lib/i18n";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-200 bg-white">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="font-display text-xl text-ink-900">{t.brand}</div>
            <p className="mt-3 max-w-xs text-sm text-ink-500">
              {t.footer.tagline}
            </p>
          </div>
          <FooterCol
            title={t.footer.shop}
            links={[
              { href: "/shop", label: t.footer.allProducts },
              { href: "/bundles", label: t.footer.bundles },
              { href: "/license", label: t.footer.license },
            ]}
          />
          <FooterCol
            title={t.footer.account}
            links={[
              { href: "/login", label: t.footer.signIn },
              { href: "/register", label: t.footer.createAccount },
              { href: "/account/downloads", label: t.footer.myDownloads },
            ]}
          />
          <FooterCol
            title={t.footer.legal}
            links={[
              { href: "/license", label: t.footer.licenseTerms },
              { href: "#", label: t.footer.privacy },
              { href: "#", label: t.footer.terms },
            ]}
          />
        </div>
        <div className="mt-12 border-t border-ink-200 pt-6 text-xs text-ink-500">
          © {new Date().getFullYear()} {t.brand}. {t.footer.rightsReserved}
        </div>
      </Container>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
        {title}
      </div>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-ink-700 hover:text-ink-900 transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
