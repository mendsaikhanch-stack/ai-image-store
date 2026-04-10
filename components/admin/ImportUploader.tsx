"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

type Mode = "FOLDER" | "SINGLE" | "ZIP";

type SelectedFile = {
  file: File;
  relativePath: string;
};

type ImportSummary = {
  candidateCount: number;
  assetCount: number;
  skippedCount: number;
  duplicateCandidateCount: number;
  totalBytes: number;
};

export function ImportUploader() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("FOLDER");
  const [selected, setSelected] = useState<SelectedFile[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setSelected([]);
    setZipFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleModeChange(next: Mode) {
    setMode(next);
    reset();
    setError(null);
    setSummary(null);
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (mode === "ZIP") {
      setZipFile(list[0] ?? null);
      return;
    }
    const next: SelectedFile[] = list.map((f) => ({
      file: f,
      // webkitRelativePath is only populated for <input webkitdirectory>,
      // otherwise it's "". Fall back to the bare filename.
      relativePath:
        (f as File & { webkitRelativePath?: string }).webkitRelativePath ||
        f.name,
    }));
    setSelected(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSummary(null);

    const formData = new FormData();
    formData.append("mode", mode);

    let totalBytes = 0;

    if (mode === "ZIP") {
      if (!zipFile) {
        setError("Pick a zip file to upload.");
        return;
      }
      formData.append("zip", zipFile);
      totalBytes = zipFile.size;
    } else {
      if (selected.length === 0) {
        setError(
          mode === "FOLDER"
            ? "Pick a folder to upload."
            : "Pick at least one image file.",
        );
        return;
      }
      for (const s of selected) {
        formData.append("files", s.file);
        formData.append("relativePaths", s.relativePath);
        totalBytes += s.file.size;
      }
    }

    setIsUploading(true);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        candidateCount?: number;
        assetCount?: number;
        skippedCount?: number;
        duplicateCandidateCount?: number;
      };
      if (!res.ok) {
        throw new Error(data.error ?? `Upload failed (HTTP ${res.status})`);
      }
      setSummary({
        candidateCount: data.candidateCount ?? 0,
        assetCount: data.assetCount ?? 0,
        skippedCount: data.skippedCount ?? 0,
        duplicateCandidateCount: data.duplicateCandidateCount ?? 0,
        totalBytes,
      });
      reset();
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  const pending = isUploading || isPending;
  const selectedLabel =
    mode === "ZIP"
      ? zipFile?.name ?? "No file selected"
      : selected.length > 0
        ? `${selected.length} file${selected.length === 1 ? "" : "s"} selected`
        : "No files selected";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
          Mode
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <ModeOption
            value="FOLDER"
            active={mode === "FOLDER"}
            title="Folder"
            description="Each sub-folder becomes one pack with multiple images."
            onSelect={handleModeChange}
          />
          <ModeOption
            value="SINGLE"
            active={mode === "SINGLE"}
            title="Single"
            description="Each image becomes its own single-image product."
            onSelect={handleModeChange}
          />
          <ModeOption
            value="ZIP"
            active={mode === "ZIP"}
            title="Zip archive"
            description="Upload a zip of folders. Extracted server-side."
            onSelect={handleModeChange}
          />
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
          Files
        </div>
        <div className="mt-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50 p-6 text-center">
          {mode === "FOLDER" ? (
            <input
              ref={fileRef}
              type="file"
              // webkitdirectory is a non-standard but widely-supported prop;
              // React types don't know about it so we cast.
              {...({
                webkitdirectory: "",
                directory: "",
              } as unknown as Record<string, string>)}
              multiple
              onChange={handleFilesSelected}
              className="block w-full text-sm text-ink-700 file:mr-4 file:rounded-full file:border file:border-ink-300 file:bg-white file:px-4 file:py-2 file:text-sm file:text-ink-800 hover:file:bg-ink-100"
            />
          ) : mode === "SINGLE" ? (
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesSelected}
              className="block w-full text-sm text-ink-700 file:mr-4 file:rounded-full file:border file:border-ink-300 file:bg-white file:px-4 file:py-2 file:text-sm file:text-ink-800 hover:file:bg-ink-100"
            />
          ) : (
            <input
              ref={fileRef}
              type="file"
              accept=".zip,application/zip"
              onChange={handleFilesSelected}
              className="block w-full text-sm text-ink-700 file:mr-4 file:rounded-full file:border file:border-ink-300 file:bg-white file:px-4 file:py-2 file:text-sm file:text-ink-800 hover:file:bg-ink-100"
            />
          )}
          <div className="mt-3 text-xs text-ink-500">{selectedLabel}</div>
        </div>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {summary ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-baseline justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">
              Import complete
            </div>
            <div className="text-xs text-emerald-700">
              {formatMb(summary.totalBytes)} uploaded
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Stat
              label="Total files"
              value={summary.assetCount + summary.skippedCount}
            />
            <Stat label="Imported" value={summary.assetCount} />
            <Stat label="Skipped" value={summary.skippedCount} />
            <Stat label="Duplicates" value={summary.duplicateCandidateCount} />
            <Stat label="Drafted" value={summary.candidateCount} />
          </div>
          <p className="mt-4 text-xs text-emerald-800">
            <span className="font-medium">Imported</span>: new asset rows
            saved. <span className="font-medium">Skipped</span>: exact hash
            already in a pending batch.{" "}
            <span className="font-medium">Duplicates</span>: matched an
            existing published product — flagged in the review queue.{" "}
            <span className="font-medium">Drafted</span>: candidates created
            for review.
          </p>
          <div className="mt-5">
            <Link
              href="/admin/import/review"
              className="inline-flex items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800"
            >
              Open review queue →
            </Link>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Uploading…" : "Start import"}
        </Button>
        <p className="text-xs text-ink-500">
          Products are saved as DRAFT. Nothing auto-publishes.
        </p>
      </div>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl text-ink-900">{value}</div>
    </div>
  );
}

function formatMb(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ModeOption({
  value,
  active,
  title,
  description,
  onSelect,
}: {
  value: Mode;
  active: boolean;
  title: string;
  description: string;
  onSelect: (v: Mode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "rounded-2xl border p-4 text-left transition-colors",
        active
          ? "border-ink-900 bg-ink-900 text-ink-50"
          : "border-ink-200 bg-white text-ink-800 hover:border-ink-300",
      )}
    >
      <div className="font-medium">{title}</div>
      <div
        className={cn(
          "mt-1 text-xs",
          active ? "text-ink-300" : "text-ink-500",
        )}
      >
        {description}
      </div>
    </button>
  );
}
