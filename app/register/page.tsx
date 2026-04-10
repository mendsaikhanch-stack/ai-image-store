import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";

export const metadata = { title: "Бүртгэл үүсгэх" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/account");

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
            {t.auth.register.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink-900">
            {t.auth.register.title}
          </h1>
        </div>
        <div className="mt-10 rounded-2xl border border-ink-200 bg-white p-8">
          <RegisterForm />
        </div>
      </div>
    </Container>
  );
}
