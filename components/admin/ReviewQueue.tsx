"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ReviewCard, type ReviewCardProps } from "./ReviewCard";
import {
  bulkApproveImportCandidatesAction,
  bulkRejectImportCandidatesAction,
  type ImportActionState,
} from "@/lib/actions/import";

type Candidate = Omit<ReviewCardProps, "selected" | "onToggleSelect">;

type Category = ReviewCardProps["categories"][number];

const initial: ImportActionState = {};

export function ReviewQueue({
  candidates,
  categories,
}: {
  candidates: Candidate[];
  categories: Category[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approveState, approveAction, approvePending] = useActionState(
    bulkApproveImportCandidatesAction,
    initial,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    bulkRejectImportCandidatesAction,
    initial,
  );

  const pendingCandidates = candidates.filter((c) => c.status === "PENDING");
  const allPendingSelected =
    pendingCandidates.length > 0 &&
    pendingCandidates.every((c) => selected.has(c.id));

  // How many of the selected candidates are duplicates — bulk approve
  // will skip these server-side and we surface the count to the admin.
  const selectedDuplicateCount = candidates.filter(
    (c) => c.isDuplicate && c.status === "PENDING" && selected.has(c.id),
  ).length;
  const safeSelectedCount = selected.size - selectedDuplicateCount;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allPendingSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingCandidates.map((c) => c.id)));
    }
  }

  function selectSafeOnly() {
    setSelected(
      new Set(
        pendingCandidates.filter((c) => !c.isDuplicate).map((c) => c.id),
      ),
    );
  }

  const showBulkBar = selected.size > 0;
  const bulkState = approveState.error || approveState.success
    ? approveState
    : rejectState;

  return (
    <div>
      {showBulkBar ? (
        <div className="sticky top-14 z-30 mb-4 rounded-2xl border border-ink-900 bg-ink-900 px-5 py-4 text-ink-50 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{selected.size}</span> selected
              {selectedDuplicateCount > 0 ? (
                <span className="ml-2 text-xs text-amber-300">
                  ({selectedDuplicateCount} duplicate
                  {selectedDuplicateCount === 1 ? "" : "s"} will be skipped)
                </span>
              ) : null}
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-ink-300 underline underline-offset-4 hover:text-ink-50"
            >
              Clear
            </button>

            <form action={approveAction} className="flex items-center gap-2">
              {Array.from(selected).map((id) => (
                <input
                  key={id}
                  type="hidden"
                  name="candidateIds"
                  value={id}
                />
              ))}
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={approvePending || safeSelectedCount === 0}
              >
                {approvePending
                  ? "Approving…"
                  : `Approve ${safeSelectedCount} safe`}
              </Button>
            </form>

            <form action={rejectAction} className="flex items-center gap-2">
              {Array.from(selected).map((id) => (
                <input
                  key={id}
                  type="hidden"
                  name="candidateIds"
                  value={id}
                />
              ))}
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={rejectPending}
                className="border-ink-700 text-ink-50 hover:bg-ink-800"
              >
                {rejectPending ? "Rejecting…" : `Reject ${selected.size}`}
              </Button>
            </form>
          </div>
          {bulkState.error ? (
            <div className="mt-3">
              <Alert tone="error">{bulkState.error}</Alert>
            </div>
          ) : null}
          {bulkState.success ? (
            <div className="mt-3">
              <Alert tone="success">{bulkState.success}</Alert>
            </div>
          ) : null}
        </div>
      ) : null}

      {pendingCandidates.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-500">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleAll}
              className="underline underline-offset-4 hover:text-ink-900"
            >
              {allPendingSelected
                ? "Clear selection"
                : `Select all ${pendingCandidates.length} pending`}
            </button>
            <button
              type="button"
              onClick={selectSafeOnly}
              className="underline underline-offset-4 hover:text-ink-900"
            >
              Select non-duplicates only
            </button>
          </div>
          <span className="text-xs">
            Bulk approve skips duplicates automatically.
          </span>
        </div>
      ) : null}

      <div className="space-y-4">
        {candidates.map((c) => (
          <ReviewCard
            key={c.id}
            {...c}
            selected={selected.has(c.id)}
            onToggleSelect={() => toggleOne(c.id)}
            categories={categories}
          />
        ))}
      </div>
    </div>
  );
}
