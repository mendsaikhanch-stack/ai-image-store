// Dumps the state of the most recent ImportBatch: candidates, assets,
// disk layout. Used only to verify e2e tests.

import { PrismaClient } from "@prisma/client";
import { stat } from "node:fs/promises";

const prisma = new PrismaClient();

const batch = await prisma.importBatch.findFirst({
  orderBy: { createdAt: "desc" },
  include: {
    candidates: {
      include: {
        assets: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "asc" },
    },
  },
});

if (!batch) {
  console.log("NO BATCHES");
  process.exit(0);
}

console.log(`Batch ${batch.id}`);
console.log(`  mode      = ${batch.mode}`);
console.log(`  createdAt = ${batch.createdAt.toISOString()}`);
console.log(`  candidates = ${batch.candidates.length}`);
console.log("");

for (const c of batch.candidates) {
  console.log(`  [${c.status}] ${c.groupKey}`);
  console.log(`    title        = ${c.suggestedTitle}`);
  console.log(`    description  = ${c.suggestedDescription}`);
  console.log(`    category     = ${c.suggestedCategory}`);
  console.log(`    tags         = ${JSON.stringify(c.suggestedTags)}`);
  console.log(`    confidence   = ${c.confidence}`);
  console.log(`    isDuplicate  = ${c.isDuplicate}`);
  console.log(`    assets       = ${c.assets.length}`);
  for (const a of c.assets) {
    let sourceExists = "?";
    let previewExists = "?";
    try {
      await stat(a.sourcePath);
      sourceExists = "✓";
    } catch {
      sourceExists = "✗";
    }
    try {
      await stat("public" + a.previewPath); // previewPath is /previews/...
      previewExists = "✓";
    } catch {
      previewExists = "✗";
    }
    console.log(
      `      ${a.relativePath}  hash=${a.fileHash.slice(0, 12)}  src=${sourceExists} prev=${previewExists}`,
    );
  }
  console.log("");
}

await prisma.$disconnect();
