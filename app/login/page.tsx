import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";

export const metadata = { title: "Нэвтрэх" };

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
            {t.auth.login.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink-900">
            {t.auth.login.title}
          </h1>
        </div>
        <div className="mt-10 rounded-2xl border border-ink-200 bg-white p-8">
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-ink-500">
          {t.auth.login.termsNote}{" "}
          <Link href="/license" className="underline underline-offset-4">
            {t.auth.login.termsLink}
          </Link>{" "}
          {t.auth.login.termsNoteEnd}
        </p>
      </div>
    </Container>
  );
}
