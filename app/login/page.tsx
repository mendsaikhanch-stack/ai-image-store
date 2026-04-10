import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/session";

export const metadata = { title: "Sign in" };

type SearchParams = Promise<{ next?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  if (session) redirect("/account");

  const { next } = await searchParams;

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
            Welcome back
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink-900">
            Sign in to Atelier
          </h1>
        </div>
        <div className="mt-10 rounded-2xl border border-ink-200 bg-white p-8">
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-ink-500">
          By signing in you agree to our{" "}
          <Link href="/license" className="underline underline-offset-4">
            license terms
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
