import test from "node:test";
import assert from "node:assert/strict";
import AdmZip from "adm-zip";
import { extractZip } from "./zip";

function makeZip(entries: Array<{ name: string; content: Buffer | string }>) {
  const zip = new AdmZip();
  for (const entry of entries) {
    zip.addFile(
      entry.name,
      typeof entry.content === "string"
        ? Buffer.from(entry.content)
        : entry.content,
    );
  }
  return zip.toBuffer();
}

test("extractZip keeps supported images and skips non-images", () => {
  const zipBytes = makeZip([
    { name: "folder/one.jpg", content: "jpg" },
    { name: "folder/two.png", content: "png" },
    { name: "folder/readme.txt", content: "ignore" },
  ]);

  const extracted = extractZip(zipBytes, {
    maxEntries: 10,
    maxEntryBytes: 1024,
    maxTotalBytes: 4096,
  });

  assert.equal(extracted.length, 2);
  assert.deepEqual(
    extracted.map((entry) => entry.relativePath),
    ["folder/one.jpg", "folder/two.png"],
  );
});

test("extractZip rejects archives with too many entries", () => {
  const zipBytes = makeZip([
    { name: "a.jpg", content: "1" },
    { name: "b.jpg", content: "2" },
  ]);

  assert.throws(
    () =>
      extractZip(zipBytes, {
        maxEntries: 1,
        maxEntryBytes: 1024,
        maxTotalBytes: 4096,
      }),
    /too many files/i,
  );
});

test("extractZip rejects archives that expand beyond total size limit", () => {
  const zipBytes = makeZip([
    { name: "a.jpg", content: Buffer.alloc(5, 1) },
    { name: "b.png", content: Buffer.alloc(5, 2) },
  ]);

  assert.throws(
    () =>
      extractZip(zipBytes, {
        maxEntries: 10,
        maxEntryBytes: 10,
        maxTotalBytes: 9,
      }),
    /total extraction limit/i,
  );
});
