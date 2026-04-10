import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-200 bg-white">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="font-display text-xl text-ink-900">Atelier</div>
            <p className="mt-3 max-w-xs text-sm text-ink-500">
              Curated AI image packs licensed for personal and commercial use.
            </p>
          </div>
          <FooterCol
            title="Shop"
            links={[
              { href: "/shop", label: "All products" },
              { href: "/bundles", label: "Bundles" },
              { href: "/license", label: "License" },
            ]}
          />
          <FooterCol
            title="Account"
            links={[
              { href: "/login", label: "Sign in" },
              { href: "/register", label: "Create account" },
              { href: "/account/downloads", label: "My downloads" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { href: "/license", label: "License terms" },
              { href: "#", label: "Privacy" },
              { href: "#", label: "Terms" },
            ]}
          />
        </div>
        <div className="mt-12 border-t border-ink-200 pt-6 text-xs text-ink-500">
          © {new Date().getFullYear()} Atelier. All rights reserved.
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
