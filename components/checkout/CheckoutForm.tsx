"use client";

import { useActionState } from "react";
import { placeOrderAction, type CheckoutState } from "@/lib/actions/checkout";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { t } from "@/lib/i18n";

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
        {pending
          ? t.checkout.processing
          : `${t.checkout.confirmOrder} · ${totalLabel}`}
      </Button>
      <p className="text-center text-xs text-ink-500">
        {t.checkout.confirmOrderHint}
      </p>
    </form>
  );
}
