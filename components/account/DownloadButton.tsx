"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  createDownloadTokenAction,
  type DownloadActionState,
} from "@/lib/actions/downloads";
import { t } from "@/lib/i18n";

const initial: DownloadActionState = {};

export function DownloadButton({
  downloadId,
  disabled,
}: {
  downloadId: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(
    createDownloadTokenAction,
    initial,
  );

  useEffect(() => {
    if (state.url) {
      window.location.href = state.url;
    }
  }, [state.url]);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="downloadId" value={downloadId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending || disabled}
      >
        {pending ? t.downloads.preparing : t.downloads.download}
      </Button>
      {state.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}
