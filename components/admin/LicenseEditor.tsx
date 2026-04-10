"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  updateLicenseAction,
  type LicenseActionState,
} from "@/lib/actions/licenses";

type Props = {
  license: {
    id: string;
    tier: string;
    name: string;
    summary: string;
    allowed: string[];
    notAllowed: string[];
    priceMultiplier: number;
  };
};

const initial: LicenseActionState = {};

export function LicenseEditor({ license }: Props) {
  const [state, action, pending] = useActionState(updateLicenseAction, initial);

  return (
    <form
      action={action}
      className="rounded-2xl border border-ink-200 bg-white p-6"
    >
      <input type="hidden" name="id" value={license.id} />

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
            {license.tier}
          </div>
          <h3 className="mt-1 font-display text-xl text-ink-900">
            {license.name}
          </h3>
        </div>
      </div>

      {state.error ? (
        <div className="mt-4">
          <Alert tone="error">{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="mt-4">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor={`name-${license.id}`}>Display name</Label>
          <Input
            id={`name-${license.id}`}
            name="name"
            defaultValue={license.name}
            required
          />
        </div>

        <div>
          <Label htmlFor={`summary-${license.id}`}>Summary</Label>
          <textarea
            id={`summary-${license.id}`}
            name="summary"
            defaultValue={license.summary}
            rows={2}
            className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`allowed-${license.id}`}>
              Allowed uses (one per line)
            </Label>
            <textarea
              id={`allowed-${license.id}`}
              name="allowedCsv"
              defaultValue={license.allowed.join("\n")}
              rows={5}
              className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm"
            />
          </div>
          <div>
            <Label htmlFor={`notallowed-${license.id}`}>
              Not allowed (one per line)
            </Label>
            <textarea
              id={`notallowed-${license.id}`}
              name="notAllowedCsv"
              defaultValue={license.notAllowed.join("\n")}
              rows={5}
              className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`mult-${license.id}`}>Price multiplier</Label>
          <Input
            id={`mult-${license.id}`}
            name="priceMultiplier"
            type="number"
            step="0.1"
            min="0.1"
            defaultValue={license.priceMultiplier}
            className="max-w-[120px]"
          />
        </div>

        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save license"}
        </Button>
      </div>
    </form>
  );
}
