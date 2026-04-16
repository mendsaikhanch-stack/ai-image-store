"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import {
  type ProductActionState,
  uploadProductImagesAction,
} from "@/lib/actions/product";

const initialState: ProductActionState = {};

export function ProductImageUploadForm({
  productId,
}: {
  productId: string;
}) {
  const [state, action, pending] = useActionState(
    uploadProductImagesAction,
    initialState,
  );

  return (
    <form action={action} className="mt-5 space-y-4">
      <input type="hidden" name="productId" value={productId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div>
        <Label htmlFor="images">Add preview images</Label>
        <Input
          id="images"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          className="h-auto py-3"
        />
        <p className="mt-1 text-xs text-ink-500">
          Upload up to 8 JPG, PNG, or WebP files per batch. Images are converted
          to optimized WebP previews automatically.
        </p>
      </div>

      <div>
        <Label htmlFor="altBase">Alt text base (optional)</Label>
        <Input
          id="altBase"
          name="altBase"
          placeholder="e.g. Nebula Dreams preview"
        />
      </div>

      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Uploading…" : "Upload images"}
      </Button>
    </form>
  );
}
