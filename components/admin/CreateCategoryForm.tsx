"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  createCategoryAction,
  type CategoryActionState,
} from "@/lib/actions/categories";

const initial: CategoryActionState = {};

export function CreateCategoryForm() {
  const [state, action, pending] = useActionState(
    createCategoryAction,
    initial,
  );

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input id="slug" name="slug" placeholder="auto from name" />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" />
      </div>
      <div>
        <Label htmlFor="coverUrl">Cover image URL</Label>
        <Input id="coverUrl" name="coverUrl" type="url" />
      </div>
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Create category"}
      </Button>
    </form>
  );
}
