// Builds the exact test-assets.zip layout the user asked for:
//
//   nature/sunsets/a.jpg
//   nature/sunsets/b.jpg
//   abstract/shapes/c.png
//   abstract/shapes/d.png
//   duplicates/a-copy.jpg   ← byte-identical copy of a.jpg (dedup test)

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import AdmZip from "adm-zip";

const OUT = "test-fixtures";

async function solid(kind, r, g, b) {
  const img = sharp({
    create: {
      width: 640,
      height: 640,
      channels: 3,
      background: { r, g, b },
    },
  });
  if (kind === "jpg") return img.jpeg({ quality: 80 }).toBuffer();
  return img.png({ compressionLevel: 6 }).toBuffer();
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const a = await solid("jpg", 255, 180, 80);
  const b = await solid("jpg", 240, 140, 60);
  const c = await solid("png", 60, 110, 200);
  const d = await solid("png", 120, 80, 200);

  const zip = new AdmZip();
  zip.addFile("nature/sunsets/a.jpg", a);
  zip.addFile("nature/sunsets/b.jpg", b);
  zip.addFile("abstract/shapes/c.png", c);
  zip.addFile("abstract/shapes/d.png", d);
  // byte-identical to a.jpg → must trigger dedup
  zip.addFile("duplicates/a-copy.jpg", a);

  const p = path.join(OUT, "test-assets.zip");
  await writeFile(p, zip.toBuffer());
  console.log(`✓ ${p}`);
  console.log("  nature/sunsets/a.jpg");
  console.log("  nature/sunsets/b.jpg");
  console.log("  abstract/shapes/c.png");
  console.log("  abstract/shapes/d.png");
  console.log("  duplicates/a-copy.jpg  (byte-identical to a.jpg)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
