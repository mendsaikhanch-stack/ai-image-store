import { LicenseTier, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Use Unsplash as placeholder preview images. Production would serve
// our own watermarked previews from /public/previews.
const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

async function main() {
  console.log("→ seeding database");

  // ── Users ────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@atelier.dev" },
    update: {},
    create: {
      email: "admin@atelier.dev",
      name: "Atelier Admin",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "user@atelier.dev" },
    update: {},
    create: {
      email: "user@atelier.dev",
      name: "Sample Customer",
      passwordHash: userHash,
      role: Role.USER,
    },
  });

  // ── Licenses ────────────────────────────────────────────
  const personal = await prisma.license.upsert({
    where: { tier: LicenseTier.PERSONAL },
    update: {},
    create: {
      tier: LicenseTier.PERSONAL,
      name: "Personal Use",
      summary:
        "For non-commercial personal projects, wallpapers, moodboards, and private prints.",
      allowed: [
        "Personal prints & wallpapers",
        "Moodboards and sketches",
        "Non-commercial social media",
      ],
      notAllowed: [
        "Resale as a standalone file",
        "Use in commercial products",
        "Redistribution or sublicensing",
        "Repackaging into another asset bundle",
      ],
      priceMultiplier: 1.0,
    },
  });

  const standard = await prisma.license.upsert({
    where: { tier: LicenseTier.STANDARD_COMMERCIAL },
    update: {},
    create: {
      tier: LicenseTier.STANDARD_COMMERCIAL,
      name: "Standard Commercial",
      summary:
        "For commercial use in marketing, websites, and print runs up to 5,000 units.",
      allowed: [
        "Commercial marketing & ads",
        "Websites and apps",
        "Merchandise up to 5,000 units",
      ],
      notAllowed: [
        "Resale as a standalone file",
        "Redistribution or sublicensing",
        "Repackaging into another asset bundle or stock collection",
      ],
      priceMultiplier: 2.5,
    },
  });

  const extended = await prisma.license.upsert({
    where: { tier: LicenseTier.EXTENDED_COMMERCIAL },
    update: {},
    create: {
      tier: LicenseTier.EXTENDED_COMMERCIAL,
      name: "Extended Commercial",
      summary:
        "Unlimited print runs, broadcast, and multi-brand commercial use.",
      allowed: [
        "Unlimited print runs",
        "Broadcast & film",
        "Multi-brand commercial use",
      ],
      notAllowed: [
        "Resale as a standalone file",
        "Redistribution or sublicensing",
        "Repackaging into another asset bundle or stock collection",
      ],
      priceMultiplier: 5.0,
    },
  });

  // ── Categories ──────────────────────────────────────────
  const categoriesData = [
    {
      slug: "abstract",
      name: "Abstract",
      description: "Geometric, gradient, and textural abstract compositions.",
      coverUrl: img("1557672172-298e090bd0f1"),
    },
    {
      slug: "nature",
      name: "Nature",
      description: "Landscapes, forests, oceans, and botanical studies.",
      coverUrl: img("1501854140801-50d01698950b"),
    },
    {
      slug: "portraits",
      name: "Portraits",
      description: "Stylized AI-generated portrait studies.",
      coverUrl: img("1544005313-94ddf0286df2"),
    },
    {
      slug: "architecture",
      name: "Architecture",
      description: "Speculative and historical architectural imagery.",
      coverUrl: img("1487958449943-2429e8be8625"),
    },
    {
      slug: "space",
      name: "Space",
      description: "Galaxies, nebulae, and cosmic horizons.",
      coverUrl: img("1446776877081-d282a0f896e2"),
    },
  ];

  const categories = await Promise.all(
    categoriesData.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      }),
    ),
  );

  const byCat = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // ── Products ────────────────────────────────────────────
  type SeedProduct = {
    slug: string;
    title: string;
    description: string;
    priceCents: number;
    category: string;
    images: string[];
    isFeatured?: boolean;
    isNew?: boolean;
    isBestseller?: boolean;
  };

  const products: SeedProduct[] = [
    {
      slug: "nebula-dreams-vol-1",
      title: "Nebula Dreams Vol. 1",
      description:
        "Twelve high-resolution cosmic compositions rendered for print and editorial use.",
      priceCents: 4900,
      category: "space",
      images: [
        img("1446776877081-d282a0f896e2"),
        img("1462331940025-496dfbfc7564"),
        img("1419242902214-272b3f66ee7a"),
      ],
      isFeatured: true,
      isBestseller: true,
    },
    {
      slug: "forest-silences",
      title: "Forest Silences",
      description:
        "Misty forest and canopy studies with painterly depth and muted palettes.",
      priceCents: 3900,
      category: "nature",
      images: [
        img("1441974231531-c6227db76b6e"),
        img("1501785888041-af3ef285b470"),
        img("1473448912268-2022ce9509d8"),
      ],
      isFeatured: true,
      isNew: true,
    },
    {
      slug: "brutalist-horizons",
      title: "Brutalist Horizons",
      description:
        "Speculative architectural renderings in concrete, steel, and long light.",
      priceCents: 5900,
      category: "architecture",
      images: [
        img("1487958449943-2429e8be8625"),
        img("1460574283810-2aab119d8511"),
        img("1511818966892-d7d671e672a2"),
      ],
      isFeatured: true,
    },
    {
      slug: "chromatic-abstracts",
      title: "Chromatic Abstracts",
      description:
        "Bold gradient and geometric abstracts suitable for editorial layouts and covers.",
      priceCents: 3500,
      category: "abstract",
      images: [
        img("1557672172-298e090bd0f1"),
        img("1550537687-c91072c4792d"),
        img("1558618666-fcd25c85cd64"),
      ],
      isNew: true,
    },
    {
      slug: "editorial-portraits-i",
      title: "Editorial Portraits I",
      description:
        "Stylized AI portraits with cinematic lighting and neutral backdrops.",
      priceCents: 6900,
      category: "portraits",
      images: [
        img("1544005313-94ddf0286df2"),
        img("1531123897727-8f129e1688ce"),
        img("1508214751196-bcfd4ca60f91"),
      ],
      isBestseller: true,
    },
    {
      slug: "oceanic-minimal",
      title: "Oceanic Minimal",
      description:
        "Minimalist seascapes with clean horizons and subtle gradients.",
      priceCents: 3200,
      category: "nature",
      images: [
        img("1505142468610-359e7d316be0"),
        img("1439405326854-014607f694d7"),
        img("1519046904884-53103b34b206"),
      ],
    },
    {
      slug: "deep-field",
      title: "Deep Field",
      description:
        "Distant galaxies and deep-field cosmic imagery in print-ready resolution.",
      priceCents: 5900,
      category: "space",
      images: [
        img("1462331940025-496dfbfc7564"),
        img("1419242902214-272b3f66ee7a"),
        img("1446776877081-d282a0f896e2"),
      ],
      isFeatured: true,
    },
    {
      slug: "concrete-light",
      title: "Concrete & Light",
      description:
        "Architectural still-life of concrete surfaces catching directional light.",
      priceCents: 4500,
      category: "architecture",
      images: [
        img("1460574283810-2aab119d8511"),
        img("1487958449943-2429e8be8625"),
        img("1511818966892-d7d671e672a2"),
      ],
    },
    {
      slug: "soft-geometries",
      title: "Soft Geometries",
      description:
        "Pastel abstracts with soft gradients — ideal for brand and product backdrops.",
      priceCents: 2900,
      category: "abstract",
      images: [
        img("1550537687-c91072c4792d"),
        img("1558618666-fcd25c85cd64"),
        img("1557672172-298e090bd0f1"),
      ],
      isNew: true,
    },
    {
      slug: "arctic-study",
      title: "Arctic Study",
      description:
        "Cold-weather nature studies: ice, fog, and low-contrast winter palettes.",
      priceCents: 4200,
      category: "nature",
      images: [
        img("1501785888041-af3ef285b470"),
        img("1473448912268-2022ce9509d8"),
        img("1441974231531-c6227db76b6e"),
      ],
    },
  ];

  const createdProducts = [];
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        priceCents: p.priceCents,
        categoryId: byCat[p.category]!,
        sourcePath: `storage/source/${p.slug}.zip`,
        isFeatured: p.isFeatured ?? false,
        isNew: p.isNew ?? false,
        isBestseller: p.isBestseller ?? false,
        images: {
          create: p.images.map((url, i) => ({
            url,
            alt: p.title,
            sortOrder: i,
          })),
        },
      },
    });
    createdProducts.push(product);
  }

  // ── Bundles ─────────────────────────────────────────────
  const bundlesData = [
    {
      slug: "cosmic-collection",
      title: "The Cosmic Collection",
      subtitle: "Every space pack. One price.",
      coverUrl: img("1446776877081-d282a0f896e2"),
      priceCents: 8900,
      productSlugs: ["nebula-dreams-vol-1", "deep-field"],
    },
    {
      slug: "nature-essentials",
      title: "Nature Essentials",
      subtitle: "Forests, oceans, and arctic studies.",
      coverUrl: img("1501854140801-50d01698950b"),
      priceCents: 9900,
      productSlugs: ["forest-silences", "oceanic-minimal", "arctic-study"],
    },
    {
      slug: "studio-starter",
      title: "Studio Starter",
      subtitle: "A curated mix for studios and brands.",
      coverUrl: img("1487958449943-2429e8be8625"),
      priceCents: 12900,
      productSlugs: [
        "brutalist-horizons",
        "chromatic-abstracts",
        "editorial-portraits-i",
      ],
    },
  ];

  for (const b of bundlesData) {
    const bundle = await prisma.bundle.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        slug: b.slug,
        title: b.title,
        subtitle: b.subtitle,
        coverUrl: b.coverUrl,
        priceCents: b.priceCents,
      },
    });

    for (const slug of b.productSlugs) {
      const product = createdProducts.find((p) => p.slug === slug);
      if (!product) continue;
      await prisma.bundleItem.upsert({
        where: {
          bundleId_productId: {
            bundleId: bundle.id,
            productId: product.id,
          },
        },
        update: {},
        create: {
          bundleId: bundle.id,
          productId: product.id,
        },
      });
    }
  }

  // ── Sample orders (one paid, one pending) ──────────────
  const sampleProduct = createdProducts[0]!;
  const secondProduct = createdProducts[1]!;

  const existingPaid = await prisma.order.findFirst({
    where: { userId: customer.id, status: "PAID" },
  });
  if (!existingPaid) {
    const paidOrder = await prisma.order.create({
      data: {
        userId: customer.id,
        status: "PAID",
        totalCents: sampleProduct.priceCents,
        providerRef: "mock_seed_paid",
        paidAt: new Date(),
        items: {
          create: [
            {
              productId: sampleProduct.id,
              licenseId: standard.id,
              priceCents: Math.round(sampleProduct.priceCents * 2.5),
              quantity: 1,
            },
          ],
        },
      },
    });

    await prisma.download.create({
      data: {
        userId: customer.id,
        orderId: paidOrder.id,
        productId: sampleProduct.id,
        licenseTier: LicenseTier.STANDARD_COMMERCIAL,
        maxCount: 5,
        usedCount: 0,
      },
    });
  }

  const existingPending = await prisma.order.findFirst({
    where: { userId: customer.id, status: "PENDING" },
  });
  if (!existingPending) {
    await prisma.order.create({
      data: {
        userId: customer.id,
        status: "PENDING",
        totalCents: secondProduct.priceCents,
        items: {
          create: [
            {
              productId: secondProduct.id,
              licenseId: personal.id,
              priceCents: secondProduct.priceCents,
              quantity: 1,
            },
          ],
        },
      },
    });
  }

  console.log("✓ seeded");
  console.log(`  admin:    ${admin.email}  /  admin123`);
  console.log(`  customer: ${customer.email}  /  user123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
