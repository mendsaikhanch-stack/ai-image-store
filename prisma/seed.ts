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
  // Credentials are env-driven so staging/production can set strong
  // values at deploy time. Dev defaults to admin123/user123 for
  // convenience.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@atelier.dev";
  const customerEmail = process.env.SEED_USER_EMAIL ?? "user@atelier.dev";
  const envAdminPassword = process.env.SEED_ADMIN_PASSWORD;
  const envUserPassword = process.env.SEED_USER_PASSWORD;

  if (process.env.NODE_ENV === "production") {
    if (!envAdminPassword || !envUserPassword) {
      console.error(
        "SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD must be set when seeding in production.",
      );
      process.exit(1);
    }
  }

  const adminPassword = envAdminPassword ?? "admin123";
  const customerPassword = envUserPassword ?? "user123";

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const userHash = await bcrypt.hash(customerPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash },
    create: {
      email: adminEmail,
      name: "Atelier Admin",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: { passwordHash: userHash },
    create: {
      email: customerEmail,
      name: "Sample Customer",
      passwordHash: userHash,
      role: Role.USER,
    },
  });

  // ── Licenses ────────────────────────────────────────────
  const personal = await prisma.license.upsert({
    where: { tier: LicenseTier.PERSONAL },
    update: {
      name: "Хувийн хэрэглээ",
      summary:
        "Арилжааны бус хувийн төсөл, ханын цаас, төсөл зураг, хувийн хэвлэл.",
      allowed: [
        "Хувийн хэвлэл, ханын цаас",
        "Төсөл зураг, үзэгчдэд",
        "Арилжааны бус сошиал контент",
      ],
      notAllowed: [
        "Файлыг дангаар нь дахин худалдах",
        "Арилжааны бүтээгдэхүүнд ашиглах",
        "Тараах эсвэл дахин лицензлэх",
        "Өөр цуглуулга, багц болгон дахин багцлах",
      ],
    },
    create: {
      tier: LicenseTier.PERSONAL,
      name: "Хувийн хэрэглээ",
      summary:
        "Арилжааны бус хувийн төсөл, ханын цаас, төсөл зураг, хувийн хэвлэл.",
      allowed: [
        "Хувийн хэвлэл, ханын цаас",
        "Төсөл зураг, үзэгчдэд",
        "Арилжааны бус сошиал контент",
      ],
      notAllowed: [
        "Файлыг дангаар нь дахин худалдах",
        "Арилжааны бүтээгдэхүүнд ашиглах",
        "Тараах эсвэл дахин лицензлэх",
        "Өөр цуглуулга, багц болгон дахин багцлах",
      ],
      priceMultiplier: 1.0,
    },
  });

  const standard = await prisma.license.upsert({
    where: { tier: LicenseTier.STANDARD_COMMERCIAL },
    update: {
      name: "Арилжааны стандарт",
      summary:
        "Маркетинг, вэб сайт, 5000 ширхэг хүртэлх хэвлэлийн арилжааны хэрэглээнд.",
      allowed: [
        "Арилжааны маркетинг, зар сурталчилгаа",
        "Вэб сайт, апп",
        "5000 ширхэг хүртэл бараа",
      ],
      notAllowed: [
        "Файлыг дангаар нь дахин худалдах",
        "Тараах эсвэл дахин лицензлэх",
        "Өөр цуглуулга, сан болгон дахин багцлах",
      ],
    },
    create: {
      tier: LicenseTier.STANDARD_COMMERCIAL,
      name: "Арилжааны стандарт",
      summary:
        "Маркетинг, вэб сайт, 5000 ширхэг хүртэлх хэвлэлийн арилжааны хэрэглээнд.",
      allowed: [
        "Арилжааны маркетинг, зар сурталчилгаа",
        "Вэб сайт, апп",
        "5000 ширхэг хүртэл бараа",
      ],
      notAllowed: [
        "Файлыг дангаар нь дахин худалдах",
        "Тараах эсвэл дахин лицензлэх",
        "Өөр цуглуулга, сан болгон дахин багцлах",
      ],
      priceMultiplier: 2.5,
    },
  });

  const extended = await prisma.license.upsert({
    where: { tier: LicenseTier.EXTENDED_COMMERCIAL },
    update: {
      name: "Арилжааны өргөтгөсөн",
      summary:
        "Хязгааргүй хэвлэлт, телевиз, олон брэндийн арилжааны хэрэглээнд.",
      allowed: [
        "Хязгааргүй хэвлэлт",
        "Телевиз, кино",
        "Олон брэндийн арилжааны хэрэглээ",
      ],
      notAllowed: [
        "Файлыг дангаар нь дахин худалдах",
        "Тараах эсвэл дахин лицензлэх",
        "Өөр цуглуулга, сан болгон дахин багцлах",
      ],
    },
    create: {
      tier: LicenseTier.EXTENDED_COMMERCIAL,
      name: "Арилжааны өргөтгөсөн",
      summary:
        "Хязгааргүй хэвлэлт, телевиз, олон брэндийн арилжааны хэрэглээнд.",
      allowed: [
        "Хязгааргүй хэвлэлт",
        "Телевиз, кино",
        "Олон брэндийн арилжааны хэрэглээ",
      ],
      notAllowed: [
        "Файлыг дангаар нь дахин худалдах",
        "Тараах эсвэл дахин лицензлэх",
        "Өөр цуглуулга, сан болгон дахин багцлах",
      ],
      priceMultiplier: 5.0,
    },
  });

  // ── Categories ──────────────────────────────────────────
  const categoriesData = [
    {
      slug: "abstract",
      name: "Абстракт",
      description: "Геометр, градиент, бүтэцтэй абстракт бүтээлүүд.",
      coverUrl: img("1557672172-298e090bd0f1"),
    },
    {
      slug: "nature",
      name: "Байгаль",
      description: "Ландшафт, ой, далай, ургамлын судалгаа.",
      coverUrl: img("1501854140801-50d01698950b"),
    },
    {
      slug: "portraits",
      name: "Хөрөг",
      description: "Загварлаг, AI-ээр үүсгэсэн хөрөг зургууд.",
      coverUrl: img("1544005313-94ddf0286df2"),
    },
    {
      slug: "architecture",
      name: "Архитектур",
      description: "Туршилтын болон түүхэн архитектурын бүтээлүүд.",
      coverUrl: img("1487958449943-2429e8be8625"),
    },
    {
      slug: "space",
      name: "Огторгуй",
      description: "Галактик, мананцар, сансарын тэнгэрийн хаяа.",
      coverUrl: img("1446776877081-d282a0f896e2"),
    },
  ];

  const categories = await Promise.all(
    categoriesData.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {
          name: c.name,
          description: c.description,
          coverUrl: c.coverUrl,
        },
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
      title: "Мананцарын зүүд 1-р боть",
      description:
        "Хэвлэл, редакцийн хэрэглээнд бэлтгэсэн өндөр нягтралтай арван хоёр сансарын бүтээл.",
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
      title: "Ойн чимээгүй",
      description:
        "Манан бүрхсэн ой, модны оройг зураачлаг гүнтэй, нам өнгөөр илэрхийлсэн цуглуулга.",
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
      title: "Брутал тэнгэрийн хаяа",
      description:
        "Бетон, ган, сунаса гэрэлтэй туршилтын архитектурын төсөөлөл.",
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
      title: "Өнгөт абстракт",
      description:
        "Редакцийн загвар, нүүрэнд тохирох тод градиент, геометр абстрактууд.",
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
      title: "Редакцийн хөрөг I",
      description:
        "Киноны гэрэлтүүлэг, саруул арын дэвсгэртэй загварлаг AI хөрөг зургууд.",
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
      title: "Далайн минимал",
      description:
        "Цэвэр тэнгэрийн хаяа, зөөлөн градиенттэй минимал далайн зураг.",
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
      title: "Гүн огторгуй",
      description:
        "Алс галактик, гүн сансарын зургуудыг хэвлэлтэд бэлэн нягтралтайгаар.",
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
      title: "Бетон ба гэрэл",
      description:
        "Бетон гадаргууд тусгасан чиглэсэн гэрлийн архитектурын зураг.",
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
      title: "Зөөлөн геометр",
      description:
        "Зөөлөн градиенттэй пастель абстрактууд — брэнд, бүтээгдэхүүний арын дэвсгэрт тохиромжтой.",
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
      title: "Арктикийн судалгаа",
      description:
        "Мөс, манан, бага ялгаралтай өвлийн өнгөний судалгаа.",
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
      update: {
        title: p.title,
        description: p.description,
        priceCents: p.priceCents,
        categoryId: byCat[p.category]!,
        isFeatured: p.isFeatured ?? false,
        isNew: p.isNew ?? false,
        isBestseller: p.isBestseller ?? false,
      },
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
      title: "Сансарын цуглуулга",
      subtitle: "Бүх огторгуйн багц. Нэг үнэ.",
      coverUrl: img("1446776877081-d282a0f896e2"),
      priceCents: 8900,
      productSlugs: ["nebula-dreams-vol-1", "deep-field"],
    },
    {
      slug: "nature-essentials",
      title: "Байгалийн гол багц",
      subtitle: "Ой, далай, хойд туйлын судалгаа.",
      coverUrl: img("1501854140801-50d01698950b"),
      priceCents: 9900,
      productSlugs: ["forest-silences", "oceanic-minimal", "arctic-study"],
    },
    {
      slug: "studio-starter",
      title: "Студио эхлэл",
      subtitle: "Студи, брэндэд зориулсан цуглуулга.",
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
      update: {
        title: b.title,
        subtitle: b.subtitle,
        coverUrl: b.coverUrl,
        priceCents: b.priceCents,
      },
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
  console.log(
    `  admin:    ${admin.email}  /  ${envAdminPassword ? "<from SEED_ADMIN_PASSWORD>" : adminPassword}`,
  );
  console.log(
    `  customer: ${customer.email}  /  ${envUserPassword ? "<from SEED_USER_PASSWORD>" : customerPassword}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
