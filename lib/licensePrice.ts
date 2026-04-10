import { LicenseTier } from "@prisma/client";

type LicenseLite = {
  id: string;
  tier: LicenseTier;
  priceMultiplier: number;
};

type PriceOverride = {
  licenseId: string;
  priceCents: number;
};

// Resolves the effective price for a given product + license tier.
// If the product has a ProductLicensePrice override for that license,
// use it. Otherwise fall back to base price × license multiplier.
export function resolveLicensePrice(args: {
  productBaseCents: number;
  license: LicenseLite;
  overrides?: PriceOverride[];
}): number {
  const override = args.overrides?.find(
    (o) => o.licenseId === args.license.id,
  );
  if (override) return override.priceCents;
  return Math.round(args.productBaseCents * args.license.priceMultiplier);
}

// Convenience: build a tier → price map for display.
export function buildPriceMap(
  baseCents: number,
  licenses: LicenseLite[],
  overrides?: PriceOverride[],
): Record<LicenseTier, number> {
  const map = {} as Record<LicenseTier, number>;
  for (const license of licenses) {
    map[license.tier] = resolveLicensePrice({
      productBaseCents: baseCents,
      license,
      overrides,
    });
  }
  return map;
}
