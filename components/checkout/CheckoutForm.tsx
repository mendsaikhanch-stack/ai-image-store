"use client";

import { useActionState } from "react";
import { placeOrderAction, type CheckoutState } from "@/lib/actions/checkout";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const initial: CheckoutState = {};

export function CheckoutForm({ totalLabel }: { totalLabel: string }) {
  const [state, action, pending] = useActionState(placeOrderAction, initial);

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Button
        type="submit"
        variant="secondary"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Processing…" : `Confirm order · ${totalLabel}`}
      </Button>
      <p className="text-center text-xs text-ink-500">
        This is a demo checkout using a mock payment provider. No card is
        charged.
      </p>
    </form>
  );
}
