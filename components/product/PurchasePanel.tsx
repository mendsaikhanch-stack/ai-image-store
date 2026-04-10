"use client";

import { useState } from "react";
import Image from "next/image";
import { LicenseTier } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { addToCartAction } from "@/lib/actions/cart";
import { cn, formatPrice } from "@/lib/utils";

type LicenseOption = {
  tier: LicenseTier;
  name: string;
  summary: string;
  priceCents: number;
};

type Props = {
  productId: string;
  title: string;
  currency: string;
  images: { url: string; alt: string | null }[];
  licenseOptions: LicenseOption[];
};

export function PurchasePanel({
  productId,
  title,
  currency,
  images,
  licenseOptions,
}: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [tier, setTier] = useState<LicenseTier>(
    licenseOptions[0]?.tier ?? "PERSONAL",
  );

  const selected = licenseOptions.find((o) => o.tier === tier);
  const selectedImage = images[activeImage] ?? images[0];

  return (
    <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
      {/* Gallery */}
      <div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-ink-100">
          {selectedImage ? (
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt ?? title}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="mt-4 grid grid-cols-5 gap-3">
            {images.map((img, i) => (
              <button
                key={img.url + i}
                type="button"
                onClick={() => setActiveImage(i)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-xl border-2 transition-colors",
                  i === activeImage
                    ? "border-ink-900"
                    : "border-transparent hover:border-ink-300",
                )}
                aria-label={`Show image ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? ""}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Purchase panel */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-ink-200 bg-white p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500">
            Select license
          </div>
          <div className="mt-4 space-y-2">
            {licenseOptions.map((opt) => {
              const checked = opt.tier === tier;
              return (
                <label
                  key={opt.tier}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    checked
                      ? "border-ink-900 bg-ink-50"
                      : "border-ink-200 hover:border-ink-300",
                  )}
                >
                  <input
                    type="radio"
                    name="license"
                    value={opt.tier}
                    checked={checked}
                    onChange={() => setTier(opt.tier)}
                    className="mt-1 accent-ink-900"
                  />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-ink-900">
                        {opt.name}
                      </span>
                      <span className="font-medium text-ink-900">
                        {formatPrice(opt.priceCents, currency)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">{opt.summary}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <form action={addToCartAction} className="mt-6">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="licenseTier" value={tier} />
            <Button type="submit" variant="secondary" className="w-full">
              Add to cart —{" "}
              {selected
                ? formatPrice(selected.priceCents, currency)
                : ""}
            </Button>
          </form>

          <p className="mt-3 text-center text-xs text-ink-500">
            Instant digital download after checkout
          </p>
        </div>
      </div>
    </div>
  );
}
