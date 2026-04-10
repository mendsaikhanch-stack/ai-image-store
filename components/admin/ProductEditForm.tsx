"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import {
  updateProductAction,
  type ProductActionState,
} from "@/lib/actions/product";

type Category = { id: string; name: string };

type Props = {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    priceCents: number;
    categoryId: string;
    isFeatured: boolean;
    isNew: boolean;
    isBestseller: boolean;
    tags: string[];
  };
  categories: Category[];
};

const initial: ProductActionState = {};

export function ProductEditForm({ product, categories }: Props) {
  const [state, action, pending] = useActionState(
    updateProductAction,
    initial,
  );

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={product.id} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={product.title}
          required
        />
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={product.slug}
          required
          pattern="[a-z0-9-]+"
        />
        <p className="mt-1 text-xs text-ink-500">
          Lowercase letters, numbers, and dashes only.
        </p>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={product.description}
          rows={5}
          required
          className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select
            id="categoryId"
            name="categoryId"
            defaultValue={product.categoryId}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="priceCents">Base price (cents)</Label>
          <Input
            id="priceCents"
            name="priceCents"
            type="number"
            min={0}
            step={100}
            defaultValue={product.priceCents}
            required
          />
          <p className="mt-1 text-xs text-ink-500">
            Personal license multiplier × 1.0. Override per tier below.
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="tagsCsv">Tags (comma separated)</Label>
        <Input
          id="tagsCsv"
          name="tagsCsv"
          defaultValue={product.tags.join(", ")}
          placeholder="e.g. sunset, landscape, minimal"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-ink-700">Flags</legend>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product.isFeatured}
              className="h-4 w-4 accent-ink-900"
            />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isNew"
              defaultChecked={product.isNew}
              className="h-4 w-4 accent-ink-900"
            />
            New
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isBestseller"
              defaultChecked={product.isBestseller}
              className="h-4 w-4 accent-ink-900"
            />
            Bestseller
          </label>
        </div>
      </fieldset>

      <div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
