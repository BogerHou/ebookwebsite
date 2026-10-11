import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import sharp from "sharp";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getResponsiveBookImage } from "../lib/responsive-book-images.ts";

const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/node-html-parser");
const catalog = JSON.parse(await readFile(new URL("../data/catalog.json", import.meta.url), "utf8"));
const manifest = JSON.parse(await readFile(new URL("../data/image-variants.json", import.meta.url), "utf8"));
const sourceImages = new Map(catalog.books.flatMap((book) => [book.cover, ...book.previews]).map((image) => [image.src, image]));
let checks = 0;
let derivatives = 0;

for (const [src, image] of sourceImages) {
  const attrs = getResponsiveBookImage(src, image.width, image.height);
  assert.equal(attrs.src, src, "The original source must remain the fallback and full-size candidate");
  checks++;
  if (src.endsWith(".svg")) {
    assert.equal(attrs.srcSet, undefined, "SVG must not reference fabricated raster variants");
    checks++;
    continue;
  }
  const entry = manifest.images[src];
  assert(entry, `${src}: every catalog raster needs a manifest entry`);
  const candidates = attrs.srcSet.split(", ").map((candidate) => {
    const [url, descriptor] = candidate.split(" ");
    return { url, width: Number(descriptor.slice(0, -1)) };
  });
  const expectedWidths = manifest.widths.filter((width) => width < image.width);
  assert.deepEqual(candidates.map((candidate) => candidate.width), [...expectedWidths, image.width]);
  assert.equal(candidates.at(-1).url, src);
  checks += 3;
  for (const candidate of candidates.slice(0, -1)) {
    assert(candidate.url.startsWith("/books/responsive/") && !candidate.url.includes("?"));
    const metadata = await sharp(fileURLToPath(new URL(`../public${candidate.url}`, import.meta.url))).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, candidate.width, "Width descriptors must match the actual encoded image width");
    assert(Math.abs(metadata.height - image.height * candidate.width / image.width) <= 1, "Resizing must preserve the source aspect ratio");
    checks += 4;
    derivatives++;
  }
  assert.equal(getResponsiveBookImage(src, image.width + 1, image.height).srcSet, undefined, "Stale dimensions must not invent variants");
  checks++;
}

for (const src of ["/books/unknown.webp", "/books/nested/unknown.webp", "https://example.com/cover.webp", "/books/../cover.webp", "/books/example.webp?version=2"]) {
  assert.deepEqual(getResponsiveBookImage(src, 400, 600), { src });
  checks++;
}

// Compile the actual JSX component in memory, then inspect its React SSR output.
const { loadBindings, transform } = require("next/dist/build/swc");
await loadBindings();
const componentSource = await readFile(new URL("../components/book-image.tsx", import.meta.url), "utf8");
const transformed = await transform(componentSource, {
  filename: "book-image.tsx",
  jsc: { parser: { syntax: "typescript", tsx: true }, transform: { react: { runtime: "automatic" } } },
  module: { type: "commonjs" },
});
const componentModule = { exports: {} };
vm.runInNewContext(transformed.code, {
  exports: componentModule.exports, module: componentModule,
  require: (name) => name === "@/lib/responsive-book-images" ? { getResponsiveBookImage } : require(name),
});
const { BookImage } = componentModule.exports;
const fixture = [...sourceImages.values()].find((image) => image.src.endsWith(".webp"));
const props = { ...fixture, alt: "原书封面", sizes: "(max-width: 767px) 42vw, 230px" };
for (const flag of [undefined, "preload", "priority"]) {
  const document = parse(renderToStaticMarkup(React.createElement(BookImage, { ...props, ...(flag ? { [flag]: true } : {}) })));
  const img = document.querySelector("img");
  const preload = document.querySelector('link[rel="preload"][as="image"]');
  assert.equal(img.getAttribute("alt"), props.alt);
  assert.equal(img.getAttribute("width"), String(fixture.width));
  assert.equal(img.getAttribute("height"), String(fixture.height));
  assert.equal(img.getAttribute("sizes"), props.sizes);
  assert.equal(img.getAttribute("src"), fixture.src);
  assert.equal(img.getAttribute("decoding"), "async");
  assert(!img.hasAttribute("priority") && !img.hasAttribute("preload"), "Component-only props must not leak into HTML");
  if (flag) {
    assert.equal(img.getAttribute("loading"), "eager");
    assert.equal(img.getAttribute("fetchpriority"), "high");
    assert.equal(preload?.getAttribute("imagesrcset"), img.getAttribute("srcset"), "The preload must select the same responsive file as the image");
    assert.equal(preload?.getAttribute("imagesizes"), props.sizes);
    checks += 4;
  } else {
    assert.equal(img.getAttribute("loading"), "lazy");
    assert.equal(preload, null, "Default images must not preload below-the-fold content");
    checks += 2;
  }
  checks += 7;
}

console.log(`Responsive images passed: ${checks} checks across ${sourceImages.size} sources and ${derivatives} derivatives; lazy loading, responsive preloads and original fallbacks verified.`);
