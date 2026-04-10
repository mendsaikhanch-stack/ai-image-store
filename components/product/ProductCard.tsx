import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

type Props = {
  slug: string;
  title: string;
  priceCents: number;
  currency: string;
  imageUrl?: string | null;
  category?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
};

export function ProductCard({
  slug,
  title,
  priceCents,
  currency,
  imageUrl,
  category,
  isNew,
  isBestseller,
  isFeatured,
}: Props) {
  return (
    <Link
      href={`/shop/${slug}`}
      className="group block overflow-hidden rounded-2xl border border-ink-200 bg-white transition-colors hover:border-ink-300"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {isBestseller ? <Badge tone="accent">Bestseller</Badge> : null}
          {isNew ? <Badge tone="success">New</Badge> : null}
          {isFeatured && !isBestseller && !isNew ? (
            <Badge tone="muted">Featured</Badge>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="truncate font-display text-base text-ink-900">
            {title}
          </div>
          {category ? (
            <div className="text-xs uppercase tracking-wider text-ink-500">
              {category}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 text-sm font-medium text-ink-900">
          {formatPrice(priceCents, currency)}
        </div>
      </div>
    </Link>
  );
}
