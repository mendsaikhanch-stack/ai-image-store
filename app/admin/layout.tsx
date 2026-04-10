import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { requireAdminOrRedirect } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/licenses", label: "Licenses" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/import/review", label: "Review queue" },
  { href: "/admin/abuse-reports", label: "Reports" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminOrRedirect();

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="border-b border-ink-200 bg-white">
        <Container className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="font-display text-lg text-ink-900"
            >
              Atelier / Admin
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              {ADMIN_NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="text-ink-600 hover:text-ink-900 transition-colors"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink-500">{user.email}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-ink-700 underline underline-offset-4 hover:text-red-600"
              >
                Sign out
              </button>
            </form>
          </div>
        </Container>
      </div>
      {children}
    </div>
  );
}
