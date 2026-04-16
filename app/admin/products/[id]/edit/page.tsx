import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ProductEditForm } from "@/components/admin/ProductEditForm";
import { ProductImageUploadForm } from "@/components/admin/ProductImageUploadForm";
import {
  publishProductAction,
  archiveProductAction,
  reactivateProductAction,
  deleteDraftProductAction,
  moveProductImageAction,
  deleteProductImageAction,
  setLicensePriceOverrideAction,
} from "@/lib/actions/product";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Edit product" };

type Params = Promise<{ id: string }>;

export default async function ProductEditPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      tags: true,
      images: { orderBy: { sortOrder: "asc" } },
      licensePrices: true,
    },
  });
  if (!product) notFound();

  const [categories, licenses] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.license.findMany({ orderBy: { priceMultiplier: "asc" } }),
  ]);

  const overrideByLicenseId = new Map(
    product.licensePrices.map((p) => [p.licenseId, p.priceCents]),
  );

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <nav className="text-xs text-ink-500">
            <Link href="/admin/products" className="hover:text-ink-900">
              Products
            </Link>
            <span> / </span>
            <span className="text-ink-700">Edit</span>
          </nav>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-4xl text-ink-900">
            {product.title}
            <StatusBadge status={product.status} />
          </h1>
          <p className="mt-2 font-mono text-xs text-ink-500">{product.slug}</p>
        </div>

        <StatusActions
          id={product.id}
          status={product.status}
          slug={product.slug}
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-ink-500">
            Details
          </h2>
          <div className="rounded-2xl border border-ink-200 bg-white p-6">
            <ProductEditForm
              product={{
                id: product.id,
                title: product.title,
                slug: product.slug,
                description: product.description,
                priceCents: product.priceCents,
                categoryId: product.categoryId,
                isFeatured: product.isFeatured,
                isNew: product.isNew,
                isBestseller: product.isBestseller,
                tags: product.tags.map((t) => t.name),
              }}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            />
          </div>

          <h2 className="mb-4 mt-10 text-xs uppercase tracking-[0.2em] text-ink-500">
            License pricing overrides
          </h2>
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3 text-left">Tier</th>
                  <th className="px-5 py-3 text-left">Computed</th>
                  <th className="px-5 py-3 text-left">Override (cents)</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {licenses.map((l) => {
                  const override = overrideByLicenseId.get(l.id);
                  const computed = Math.round(
                    product.priceCents * l.priceMultiplier,
                  );
                  return (
                    <tr key={l.id}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-ink-900">
                          {l.name}
                        </div>
                        <div className="text-xs text-ink-500">
                          × {l.priceMultiplier}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-700">
                        {formatPrice(computed, product.currency)}
                      </td>
                      <td className="px-5 py-3">
                        <form
                          action={setLicensePriceOverrideAction}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="productId"
                            value={product.id}
                          />
                          <input
                            type="hidden"
                            name="licenseId"
                            value={l.id}
                          />
                          <Input
                            name="priceCents"
                            type="number"
                            min={0}
                            step={100}
                            defaultValue={override ?? ""}
                            placeholder="—"
                            className="h-9 w-32"
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Save
                          </Button>
                        </form>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-ink-500">
                        {override != null
                          ? `Override: ${formatPrice(override, product.currency)}`
                          : "No override"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside>
          <h2 className="mb-4 text-xs uppercase tracking-[0.2em] text-ink-500">
            Preview images
          </h2>
          <div className="rounded-2xl border border-ink-200 bg-white p-6">
            {product.images.length === 0 ? (
              <p className="text-sm text-ink-500">No images yet.</p>
            ) : (
              <ul className="space-y-3">
                {product.images.map((img, i) => (
                  <li
                    key={img.id}
                    className="flex items-center gap-3 rounded-xl border border-ink-200 p-3"
                  >
                    <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-xs text-ink-500">
                      <div className="truncate">#{i + 1}</div>
                      {img.hash ? (
                        <div className="truncate font-mono">
                          {img.hash.slice(0, 10)}…
                        </div>
                      ) : null}
                    </div>
                    <div className="flex gap-1">
                      <form action={moveProductImageAction}>
                        <input type="hidden" name="imageId" value={img.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          className="rounded-md border border-ink-200 px-2 py-1 text-xs text-ink-700 hover:bg-ink-100 disabled:opacity-30"
                          disabled={i === 0}
                        >
                          ↑
                        </button>
                      </form>
                      <form action={moveProductImageAction}>
                        <input type="hidden" name="imageId" value={img.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          className="rounded-md border border-ink-200 px-2 py-1 text-xs text-ink-700 hover:bg-ink-100 disabled:opacity-30"
                          disabled={i === product.images.length - 1}
                        >
                          ↓
                        </button>
                      </form>
                      <form action={deleteProductImageAction}>
                        <input type="hidden" name="imageId" value={img.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-ink-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <ProductImageUploadForm productId={product.id} />
          </div>

          <h2 className="mb-4 mt-10 text-xs uppercase tracking-[0.2em] text-ink-500">
            Metadata
          </h2>
          <dl className="space-y-2 rounded-2xl border border-ink-200 bg-white p-6 text-sm">
            <Row label="Source path" value={product.sourcePath} mono />
            <Row label="Format" value={product.fileFormat} />
            <Row label="Resolution" value={product.fileResolution} />
            <Row label="Files" value={`${product.fileCount}`} />
            <Row label="Size" value={`${product.fileSizeMb} MB`} />
            <Row
              label="Updated"
              value={new Date(product.updatedAt).toLocaleString()}
            />
          </dl>
        </aside>
      </div>
    </Container>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className={
          mono
            ? "truncate font-mono text-xs text-ink-700"
            : "text-ink-700"
        }
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === "ACTIVE") return <Badge tone="success">Active</Badge>;
  if (status === "DRAFT") return <Badge tone="muted">Draft</Badge>;
  return <Badge tone="neutral">Archived</Badge>;
}

function StatusActions({
  id,
  status,
  slug,
}: {
  id: string;
  status: ProductStatus;
  slug: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "ACTIVE" ? (
        <Button asChild variant="outline" size="sm">
          <Link href={`/shop/${slug}`} target="_blank">
            View live →
          </Link>
        </Button>
      ) : null}
      {status === "DRAFT" ? (
        <>
          <form action={publishProductAction}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="secondary" size="sm">
              Publish
            </Button>
          </form>
          <form action={deleteDraftProductAction}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="ghost" size="sm">
              Delete draft
            </Button>
          </form>
        </>
      ) : null}
      {status === "ACTIVE" ? (
        <form action={archiveProductAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="outline" size="sm">
            Archive
          </Button>
        </form>
      ) : null}
      {status === "ARCHIVED" ? (
        <form action={reactivateProductAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="secondary" size="sm">
            Reactivate
          </Button>
        </form>
      ) : null}
    </div>
  );
}
