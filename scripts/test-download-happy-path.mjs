// E2E happy-path test of the secure download route.
//
// 1. Finds an ImportAsset with a real file on disk (from Phase 2.5 upload)
// 2. Creates a temporary Product with that sourcePath
// 3. Creates a PAID Order + Download entitlement for the customer
// 4. Creates a DownloadToken
// 5. Returns all the pieces so the caller can curl the URL
//
// After the test, call this with `cleanup` as the first arg to undo.

import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { stat } from "node:fs/promises";

const prisma = new PrismaClient();
const mode = process.argv[2] ?? "setup";

if (mode === "setup") {
  const asset = await prisma.importAsset.findFirst({
    include: { candidate: true },
  });
  if (!asset) {
    console.error("NO import assets — upload test-assets.zip first");
    process.exit(1);
  }
  try {
    await stat(asset.sourcePath);
  } catch {
    console.error(`asset source missing on disk: ${asset.sourcePath}`);
    process.exit(1);
  }

  const customer = await prisma.user.findUnique({
    where: { email: "user@atelier.dev" },
  });
  if (!customer) {
    console.error("customer not found");
    process.exit(1);
  }

  const category = await prisma.category.findFirst();
  if (!category) {
    console.error("no category");
    process.exit(1);
  }

  const product = await prisma.product.create({
    data: {
      slug: `_test_dl_${nanoid(8)}`,
      title: "E2E download test product",
      description: "temp",
      priceCents: 1000,
      categoryId: category.id,
      sourcePath: asset.sourcePath,
      status: "ACTIVE",
      isActive: true,
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      status: "PAID",
      totalCents: 1000,
      paidAt: new Date(),
      providerRef: "e2e_test",
      items: {
        create: [
          {
            productId: product.id,
            licenseId: (await prisma.license.findFirstOrThrow()).id,
            priceCents: 1000,
          },
        ],
      },
    },
  });

  const download = await prisma.download.create({
    data: {
      userId: customer.id,
      orderId: order.id,
      productId: product.id,
      licenseTier: "PERSONAL",
      maxCount: 5,
      usedCount: 0,
    },
  });

  const token = nanoid(40);
  await prisma.downloadToken.create({
    data: {
      downloadId: download.id,
      token,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  console.log(`PRODUCT=${product.id}`);
  console.log(`ORDER=${order.id}`);
  console.log(`DOWNLOAD=${download.id}`);
  console.log(`TOKEN=${token}`);
  console.log(`SOURCE=${asset.sourcePath}`);
  console.log(`URL=/api/downloads/${token}`);
} else if (mode === "cleanup") {
  const products = await prisma.product.findMany({
    where: { slug: { startsWith: "_test_dl_" } },
  });
  for (const p of products) {
    // Cascade via orderItems / downloads / downloadTokens won't happen because
    // we don't have onDelete cascade on all relations. Delete children first.
    const orders = await prisma.order.findMany({
      where: { items: { some: { productId: p.id } } },
    });
    for (const o of orders) {
      await prisma.downloadToken.deleteMany({
        where: { download: { orderId: o.id } },
      });
      await prisma.download.deleteMany({ where: { orderId: o.id } });
      await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
      await prisma.order.delete({ where: { id: o.id } });
    }
    await prisma.product.delete({ where: { id: p.id } });
  }
  console.log(`cleaned up ${products.length} test product(s)`);
}

await prisma.$disconnect();
