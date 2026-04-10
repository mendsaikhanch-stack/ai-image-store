"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import {
  approveImportCandidateAction,
  mergeImportCandidateAction,
  rejectImportCandidateAction,
  updateImportCandidateAction,
  type ImportActionState,
} from "@/lib/actions/import";
import { cn } from "@/lib/utils";

type Asset = {
  id: string;
  previewPath: string;
  sourcePath: string;
  originalName: string;
};

type Category = { slug: string; name: string };

export type ReviewCardProps = {
  id: string;
  groupKey: string;
  suggestedTitle: string;
  suggestedDescription: string | null;
  suggestedCategory: string | null;
  suggestedTags: string[];
  confidence: number;
  isDuplicate: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdProductId: string | null;
  assets: Asset[];
  categories: Category[];
  batchId: string;
  batchMode: "FOLDER" | "SINGLE";
  batchCreatedAt: string; // ISO string (Dates don't cross server/client cleanly)
  selected?: boolean;
  onToggleSelect?: () => void;
};

const initial: ImportActionState = {};

export function ReviewCard(props: ReviewCardProps) {
  const [mode, setMode] = useState<"idle" | "edit" | "merge">("idle");
  const [updateState, updateAction, updatePending] = useActionState(
    updateImportCandidateAction,
    initial,
  );
  const [approveState, approveAction, approvePending] = useActionState(
    approveImportCandidateAction,
    initial,
  );
  const [mergeState, mergeAction, mergePending] = useActionState(
    mergeImportCandidateAction,
    initial,
  );

  const isPending = props.status === "PENDING";
  const confidencePct = Math.round(props.confidence * 100);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-white transition-colors",
        props.selected ? "border-ink-900" : "border-ink-200",
      )}
    >
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_2fr]">
        {/* Gallery */}
        <div>
          <div className="grid grid-cols-2 gap-2">
            {props.assets.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="relative aspect-square overflow-hidden rounded-xl bg-ink-100"
              >
                <Image
                  src={a.previewPath}
                  alt={a.originalName}
                  fill
                  sizes="(min-width: 768px) 15vw, 40vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          {props.assets.length > 4 ? (
            <div className="mt-2 text-center text-xs text-ink-500">
              +{props.assets.length - 4} more assets
            </div>
          ) : null}
        </div>

        {/* Details + actions */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {isPending && props.onToggleSelect ? (
                <label className="inline-flex items-center gap-2 text-xs text-ink-500">
                  <input
                    type="checkbox"
                    checked={props.selected ?? false}
                    onChange={props.onToggleSelect}
                    className="h-4 w-4 accent-ink-900"
                  />
                  Select
                </label>
              ) : null}
              <Badge tone="muted">{props.groupKey}</Badge>
              <Badge tone={confidencePct >= 50 ? "accent" : "neutral"}>
                {confidencePct}% confidence
              </Badge>
              {props.isDuplicate ? (
                <Badge tone="neutral">Possible duplicate</Badge>
              ) : null}
              <Badge
                tone={
                  props.status === "APPROVED"
                    ? "success"
                    : props.status === "REJECTED"
                      ? "neutral"
                      : "muted"
                }
              >
                {props.status}
              </Badge>
            </div>
          </div>

          <h3 className="mt-3 font-display text-2xl text-ink-900">
            {props.suggestedTitle}
          </h3>
          {props.suggestedDescription ? (
            <p className="mt-2 text-sm text-ink-600">
              {props.suggestedDescription}
            </p>
          ) : null}
          <div className="mt-2 text-sm text-ink-500">
            Category:{" "}
            <span className="text-ink-700">
              {props.suggestedCategory ?? "—"}
            </span>{" "}
            · {props.assets.length} asset
            {props.assets.length === 1 ? "" : "s"}
          </div>

          <dl className="mt-3 grid gap-1 text-xs text-ink-500 sm:grid-cols-[auto_1fr] sm:gap-x-3">
            <dt>Batch</dt>
            <dd className="truncate font-mono text-ink-700">
              {props.batchMode} · {new Date(props.batchCreatedAt).toLocaleString()}
            </dd>
            <dt>Source</dt>
            <dd
              className="truncate font-mono text-ink-700"
              title={props.assets[0]?.sourcePath}
            >
              {props.assets[0]?.sourcePath ?? "—"}
            </dd>
          </dl>
          {props.suggestedTags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {props.suggestedTags.map((t) => (
                <Badge key={t} tone="muted">
                  {t}
                </Badge>
              ))}
            </div>
          ) : null}

          {isPending ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setMode((m) => (m === "edit" ? "idle" : "edit"))
                }
              >
                {mode === "edit" ? "Close editor" : "Edit"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setMode((m) => (m === "merge" ? "idle" : "merge"))
                }
              >
                {mode === "merge" ? "Cancel merge" : "Merge into existing…"}
              </Button>

              <form action={approveAction}>
                <input type="hidden" name="candidateId" value={props.id} />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={approvePending}
                >
                  {approvePending ? "Approving…" : "Approve as draft"}
                </Button>
              </form>

              <form action={rejectImportCandidateAction}>
                <input type="hidden" name="candidateId" value={props.id} />
                <Button type="submit" variant="ghost" size="sm">
                  Reject
                </Button>
              </form>
            </div>
          ) : props.status === "APPROVED" && props.createdProductId ? (
            <p className="mt-5 text-sm text-ink-500">
              Approved → linked to product{" "}
              <span className="font-mono text-ink-700">
                {props.createdProductId.slice(-6)}
              </span>
            </p>
          ) : null}

          {approveState.error ? (
            <div className="mt-4">
              <Alert tone="error">{approveState.error}</Alert>
            </div>
          ) : null}
          {approveState.success ? (
            <div className="mt-4">
              <Alert tone="success">{approveState.success}</Alert>
            </div>
          ) : null}
          {mergeState.error ? (
            <div className="mt-4">
              <Alert tone="error">{mergeState.error}</Alert>
            </div>
          ) : null}
          {mergeState.success ? (
            <div className="mt-4">
              <Alert tone="success">{mergeState.success}</Alert>
            </div>
          ) : null}

          {mode === "edit" && isPending ? (
            <form action={updateAction} className="mt-5 space-y-4">
              <input type="hidden" name="candidateId" value={props.id} />
              <div>
                <Label htmlFor={`title-${props.id}`}>Title</Label>
                <Input
                  id={`title-${props.id}`}
                  name="suggestedTitle"
                  defaultValue={props.suggestedTitle}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`desc-${props.id}`}>Description</Label>
                <textarea
                  id={`desc-${props.id}`}
                  name="suggestedDescription"
                  defaultValue={props.suggestedDescription ?? ""}
                  rows={3}
                  className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                />
              </div>
              <div>
                <Label htmlFor={`category-${props.id}`}>Category</Label>
                <Select
                  id={`category-${props.id}`}
                  name="suggestedCategory"
                  defaultValue={props.suggestedCategory ?? ""}
                  required
                >
                  <option value="">Pick a category…</option>
                  {props.categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor={`tags-${props.id}`}>
                  Tags (comma separated)
                </Label>
                <Input
                  id={`tags-${props.id}`}
                  name="suggestedTags"
                  defaultValue={props.suggestedTags.join(", ")}
                />
              </div>

              {updateState.error ? (
                <Alert tone="error">{updateState.error}</Alert>
              ) : null}
              {updateState.success ? (
                <Alert tone="success">{updateState.success}</Alert>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={updatePending}
              >
                {updatePending ? "Saving…" : "Save changes"}
              </Button>
            </form>
          ) : null}

          {mode === "merge" && isPending ? (
            <form action={mergeAction} className="mt-5 space-y-3">
              <input type="hidden" name="candidateId" value={props.id} />
              <div>
                <Label htmlFor={`target-${props.id}`}>
                  Target product slug
                </Label>
                <Input
                  id={`target-${props.id}`}
                  name="targetSlug"
                  placeholder="e.g. nebula-dreams-vol-1"
                  required
                />
                <p className="mt-1 text-xs text-ink-500">
                  Images from this candidate are appended to the target
                  product. The candidate is marked approved.
                </p>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={mergePending}
              >
                {mergePending ? "Merging…" : "Merge images"}
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}
