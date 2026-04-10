"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Category = { slug: string; name: string };

type Props = {
  categories: Category[];
  current: {
    q?: string;
    category?: string;
    sort?: string;
  };
};

export function ShopFilters({ categories, current }: Props) {
  const router = useRouter();

  function submit(next: Partial<Props["current"]>) {
    const params = new URLSearchParams();
    const merged = { ...current, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.category) params.set("category", merged.category);
    if (merged.sort && merged.sort !== "new") params.set("sort", merged.sort);
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        submit({
          q: String(formData.get("q") ?? ""),
          category: String(formData.get("category") ?? ""),
          sort: String(formData.get("sort") ?? "new"),
        });
      }}
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
    >
      <Input
        name="q"
        defaultValue={current.q ?? ""}
        placeholder="Search packs…"
      />
      <Select
        name="category"
        defaultValue={current.category ?? ""}
        onChange={(e) =>
          submit({
            q: current.q,
            category: e.target.value,
            sort: current.sort,
          })
        }
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select
        name="sort"
        defaultValue={current.sort ?? "new"}
        onChange={(e) =>
          submit({
            q: current.q,
            category: current.category,
            sort: e.target.value,
          })
        }
      >
        <option value="new">Newest</option>
        <option value="price-asc">Price: Low to high</option>
        <option value="price-desc">Price: High to low</option>
      </Select>
    </form>
  );
}
