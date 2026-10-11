import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const widths = [120, 240, 360, 480, 640, 960, 1280];
const encoding = {
  algorithm: "book-responsive-webp-v1",
  widths,
  resize: { withoutEnlargement: true },
  webp: { quality: 82, effort: 4 },
};
const encodingKey = JSON.stringify(encoding);
const started = performance.now();
const catalog = JSON.parse(await readFile(join(root, "data", "catalog.json"), "utf8"));
const sources = [...new Set(catalog.books.flatMap((book) => [book.cover.src, ...book.previews.map((preview) => preview.src)]))]
  .filter((src) => src.endsWith(".webp"))
  .sort();
const outputDirectory = join(root, "public", "books", "responsive");
await mkdir(outputDirectory, { recursive: true });
sharp.concurrency(1);

const entries = new Map();
const summary = { sources: sources.length, files: 0, generated: 0, reused: 0, repaired: 0, bytes: 0 };
let cursor = 0;

async function processSource(src) {
  // Only catalog-listed, flat local WebP files are eligible for generation.
  if (!/^\/books\/[a-zA-Z0-9_-]+\.webp$/.test(src)) throw new Error(`Unsupported image source: ${src}`);
  const input = await readFile(join(root, "public", src.slice(1)));
  const original = await sharp(input).metadata();
  if (original.format !== "webp" || !original.width || !original.height || (original.pages && original.pages > 1)) {
    throw new Error(`Expected a non-animated WebP image with dimensions: ${src}`);
  }
  const version = createHash("sha256").update(input).update(encodingKey).digest("hex").slice(0, 12);
  const selectedWidths = widths.filter((width) => width < original.width);
  const stem = parse(src).name;

  for (const width of selectedWidths) {
    const path = join(outputDirectory, `${stem}-${version}-w${width}.webp`);
    const expectedHeight = Math.round(original.height * width / original.width);
    let existing = false;
    let valid = false;
    try {
      const details = await stat(path);
      existing = true;
      if (details.isFile() && details.size > 0) {
        const metadata = await sharp(path).metadata();
        valid = metadata.format === "webp" && metadata.width === width && metadata.height === expectedHeight && (!metadata.pages || metadata.pages === 1);
        if (valid) summary.bytes += details.size;
      }
    } catch (error) {
      if (error.code !== "ENOENT" && !existing) throw error;
      // A truncated or invalid generated image is repaired from its original.
    }

    if (valid) summary.reused += 1;
    else {
      const result = await sharp(input)
        .resize({ width, ...encoding.resize })
        .webp(encoding.webp)
        .toBuffer({ resolveWithObject: true });
      if (result.info.width !== width || result.info.height !== expectedHeight) {
        throw new Error(`Unexpected generated dimensions: ${src} at ${width}px`);
      }
      await writeFile(path, result.data);
      summary.bytes += result.data.length;
      summary.generated += 1;
      if (existing) summary.repaired += 1;
    }
    summary.files += 1;
  }
  entries.set(src, { version, width: original.width, height: original.height, widths: selectedWidths });
}

async function worker() {
  while (cursor < sources.length) {
    const src = sources[cursor++];
    await processSource(src);
  }
}

await Promise.all(Array.from({ length: Math.min(4, sources.length) }, worker));
const manifest = {
  schemaVersion: 1,
  widths,
  images: Object.fromEntries(sources.map((src) => [src, entries.get(src)])),
};
const manifestPath = join(root, "data", "image-variants.json");
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
let oldManifest;
try { oldManifest = await readFile(manifestPath, "utf8"); }
catch (error) { if (error.code !== "ENOENT") throw error; }
if (oldManifest !== manifestText) {
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, manifestText);
}

console.log(JSON.stringify({ ...summary, megabytes: Number((summary.bytes / 1_000_000).toFixed(2)), seconds: Number(((performance.now() - started) / 1000).toFixed(2)) }));
