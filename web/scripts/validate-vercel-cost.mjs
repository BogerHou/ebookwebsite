import { readFile, readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import babel from "next/dist/compiled/babel/bundle.js";

const parser = babel.parser();
const types = babel.types();

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const option = (flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
const sourceOnly = args.includes("--source-only");
const base = option("--base");
const checks = [];
const expect = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), ...(detail ? { detail } : {}) });
const catalog = JSON.parse(await readFile(join(root, "data/catalog.json"), "utf8"));
const editorial = JSON.parse(await readFile(join(root, "data/editorial.json"), "utf8"));
const canonicalRoutes = ["/", "/categories", "/guides", "/about", "/help", "/privacy", "/contact",
  ...catalog.books.map((book) => `/books/${book.slug}`),
  ...catalog.categories.map((category) => `/categories/${category.slug}`),
  ...editorial.guides.map((guide) => `/guides/${guide.slug}`),
  ...Array.from({ length: Math.ceil(catalog.books.length / 24) - 1 }, (_, index) => `/library/${index + 2}`)];

async function files(directory) {
  return (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
  }))).flat();
}
function walk(node, visit, ancestors = []) {
  visit(node, ancestors);
  for (const key of types.VISITOR_KEYS[node.type] || []) {
    const children = Array.isArray(node[key]) ? node[key] : [node[key]];
    for (const child of children) if (child?.type) walk(child, visit, [...ancestors, node]);
  }
}
function attributes(node) { return node.attributes.filter((attribute) => attribute.type === "JSXAttribute"); }
function staticAttribute(node, name) {
  const value = attributes(node).find((attribute) => attribute.name.name === name)?.value;
  return value?.type === "StringLiteral" ? value.value : undefined;
}
function disabledPrefetch(node) {
  const value = attributes(node).find((attribute) => attribute.name.name === "prefetch")?.value;
  return value?.type === "JSXExpressionContainer" && value.expression.type === "BooleanLiteral" && value.expression.value === false;
}

try {
  const codeFiles = [...await files(join(root, "app")), ...await files(join(root, "components"))];
  for (const path of codeFiles) {
    const relative = path.slice(root.length);
    const source = parser.parse(await readFile(path, "utf8"), { sourceType: "module", plugins: ["typescript", "jsx"] });
    const linkNames = new Set(source.program.body.filter((node) => node.type === "ImportDeclaration" && node.source.value === "next/link")
      .flatMap((node) => node.specifiers.filter((specifier) => specifier.type === "ImportDefaultSpecifier").map((specifier) => specifier.local.name)));
    walk(source, (node, ancestors) => {
      if (node.type === "ImportDeclaration" && node.source.value === "next/image") {
        expect(`${relative}: no runtime optimizer component`, false);
      }
      if (node.type !== "JSXOpeningElement" || node.name.type !== "JSXIdentifier" || !linkNames.has(node.name.name)) return;
      const href = attributes(node).find((attribute) => attribute.name.name === "href")?.value;
      if ((href?.type === "StringLiteral" && href.value.includes("?")) || (href?.type === "JSXExpressionContainer" && href.expression.type === "CallExpression" && href.expression.callee.type === "Identifier" && href.expression.callee.name === "contactHref")) {
        expect(`${relative}:${node.loc.start.line}: query-dependent links use document navigation`, false);
      }
      const allDense = ["components/book-card.tsx", "components/guide-link.tsx", "components/catalog-pagination.tsx", "components/catalog-browser.tsx"].includes(relative);
      let inDenseGrid = false;
      for (const parent of ancestors) {
        if (parent.type === "JSXElement" && ["home-cover-shelf", "topic-link-grid", "category-directory"].includes(staticAttribute(parent.openingElement, "className"))) inDenseGrid = true;
      }
      if (allDense || inDenseGrid) expect(`${relative}:${node.loc.start.line}: dense link waits for a click`, disabledPrefetch(node));
    });
  }
  for (const name of ["proxy.ts", "proxy.js", "middleware.ts", "middleware.js"]) {
    let present = true;
    try { await stat(join(root, name)); } catch (error) { if (error.code === "ENOENT") present = false; else throw error; }
    expect(`public catalog has no per-request ${name}`, !present);
  }
  const publicFiles = await readdir(join(root, "public"), { recursive: true });
  expect("large ebook files are not served by the application", !publicFiles.some((name) => /\.(?:pdf|epub|mobi|zip)$/i.test(name)));

  if (!sourceOnly) {
    const prerender = JSON.parse(await readFile(join(root, ".next/prerender-manifest.json"), "utf8"));
    const images = JSON.parse(await readFile(join(root, ".next/images-manifest.json"), "utf8"));
    const functions = JSON.parse(await readFile(join(root, ".next/server/functions-config-manifest.json"), "utf8"));
    expect("production build disables runtime image transformations", images.images.unoptimized === true);
    expect("production build has no routing middleware function", !Object.hasOwn(functions.functions || {}, "/_middleware"));
    for (const route of canonicalRoutes) {
      const entry = prerender.routes[route];
      expect(`${route}: public canonical HTML is generated completely at build time`, entry && entry.initialRevalidateSeconds === false && entry.compute === "static" && entry.response === "complete");
    }
    const social = prerender.routes["/opengraph-image"];
    expect("social preview image is generated completely at build time", social && social.initialRevalidateSeconds === false && social.compute === "static" && social.response === "complete");
  }

  if (base) {
    const origin = new URL(base).origin;
    for (const path of ["/", "/categories/water-sailing", "/library/2", "/contact", "/books/swimming-anatomy", "/guides"]) {
      const response = await fetch(new URL(path, origin), { headers: { "User-Agent": "Googlebot" }, signal: AbortSignal.timeout(15000) });
      const cache = response.headers.get("cache-control") || "";
      await response.arrayBuffer();
      expect(`${path}: live default HTML permits shared cached delivery`, response.ok && Boolean(cache) && !/private|no-store/.test(cache), `status ${response.status}; cache ${cache}; Vercel ${response.headers.get("x-vercel-cache") || "unavailable"}`);
    }
    for (const path of ["/_next/image", "/_vercel/image"]) {
      const response = await fetch(new URL(`${path}?url=invalid-image-source&w=1&q=1`, origin), { signal: AbortSignal.timeout(15000) });
      await response.arrayBuffer();
      expect(`${path}: retired optimizer entry point is unavailable`, response.status === 404 || response.status === 403 && response.headers.get("x-vercel-mitigated") === "deny", `status ${response.status}`);
    }
  }
} catch (error) { expect("cost checks completed", false, error.message); }

const report = { checkedAt: new Date().toISOString(), sourceOnly, base: base || null,
  scope: "Project source/build and optional representative public HTTP behavior. This does not measure billing, field traffic or account remaining allowances.",
  canonicalRoutes: canonicalRoutes.length, checks, counts: { checks: checks.length, failed: checks.filter((check) => !check.passed).length } };
const output = option("--output");
if (output) { await mkdir(dirname(output), { recursive: true }); await writeFile(output, `${JSON.stringify(report, null, 2)}\n`); }
console.log(JSON.stringify({ ...report.counts, canonicalRoutes: report.canonicalRoutes, failures: checks.filter((check) => !check.passed), ...(output ? { report: output } : {}) }, null, 2));
if (report.counts.failed) process.exitCode = 1;
