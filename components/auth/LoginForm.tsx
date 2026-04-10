"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

const initial: AuthFormState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        {state.fieldErrors?.email ? (
          <p className="text-xs text-red-600">{state.fieldErrors.email}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.fieldErrors?.password ? (
          <p className="text-xs text-red-600">{state.fieldErrors.password}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-ink-500">
        No account?{" "}
        <Link href="/register" className="text-ink-900 hover:text-accent">
          Create one
        </Link>
      </p>
    </form>
  );
}
