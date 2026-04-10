import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";

export async function Header() {
  const session = await getSession();

  const NAV = [
    { href: "/shop", label: t.nav.shop },
    { href: "/bundles", label: t.nav.bundles },
    { href: "/license", label: t.nav.license },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-ink-50/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl tracking-tight text-ink-900">
            {t.brand}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-ink-500">
            / AI
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-700 hover:text-ink-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="text-sm text-ink-700 hover:text-ink-900 transition-colors"
          >
            {t.nav.cart}
          </Link>
          {session ? (
            <Link
              href="/account"
              className="text-sm font-medium text-ink-900 hover:text-accent transition-colors"
            >
              {t.nav.account}
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-ink-900 hover:text-accent transition-colors"
            >
              {t.nav.signIn}
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}
