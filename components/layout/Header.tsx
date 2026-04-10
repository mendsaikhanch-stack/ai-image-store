import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getSession } from "@/lib/session";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/bundles", label: "Bundles" },
  { href: "/license", label: "License" },
];

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-ink-50/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl tracking-tight text-ink-900">
            Atelier
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
            Cart
          </Link>
          {session ? (
            <Link
              href="/account"
              className="text-sm font-medium text-ink-900 hover:text-accent transition-colors"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-ink-900 hover:text-accent transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}
