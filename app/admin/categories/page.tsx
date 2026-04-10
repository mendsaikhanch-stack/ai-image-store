import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CreateCategoryForm } from "@/components/admin/CreateCategoryForm";
import { updateCategoryAction } from "@/lib/actions/categories";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <Container className="py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
        Catalog
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink-900">Categories</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-ink-500">
            Existing ({categories.length})
          </h2>
          <ul className="space-y-4">
            {categories.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-ink-200 bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg text-ink-900">
                      {c.name}
                    </h3>
                    <div className="font-mono text-xs text-ink-500">
                      /{c.slug}
                    </div>
                  </div>
                  <div className="text-right text-xs text-ink-500">
                    {c._count.products} product
                    {c._count.products === 1 ? "" : "s"}
                  </div>
                </div>
                <form
                  action={updateCategoryAction}
                  className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <input type="hidden" name="id" value={c.id} />
                  <div>
                    <Label htmlFor={`n-${c.id}`}>Name</Label>
                    <Input
                      id={`n-${c.id}`}
                      name="name"
                      defaultValue={c.name}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`d-${c.id}`}>Description</Label>
                    <Input
                      id={`d-${c.id}`}
                      name="description"
                      defaultValue={c.description ?? ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`cv-${c.id}`}>Cover URL</Label>
                    <Input
                      id={`cv-${c.id}`}
                      name="coverUrl"
                      type="url"
                      defaultValue={c.coverUrl ?? ""}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" size="sm" variant="outline">
                      Save
                    </Button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <aside>
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-ink-500">
            Create new
          </h2>
          <div className="rounded-2xl border border-ink-200 bg-white p-6">
            <CreateCategoryForm />
          </div>
        </aside>
      </div>
    </Container>
  );
}
