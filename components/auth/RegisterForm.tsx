"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

const initial: AuthFormState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <form action={action} className="space-y-5">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required />
        {state.fieldErrors?.name ? (
          <p className="text-xs text-red-600">{state.fieldErrors.name}</p>
        ) : null}
      </div>

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
          autoComplete="new-password"
          required
          minLength={6}
        />
        {state.fieldErrors?.password ? (
          <p className="text-xs text-red-600">{state.fieldErrors.password}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="text-ink-900 hover:text-accent">
          Sign in
        </Link>
      </p>
    </form>
  );
}
