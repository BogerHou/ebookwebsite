import { readFile, stat } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = process.cwd();
const catalog = JSON.parse(await readFile(join(root, "data", "catalog.json"), "utf8"));
const errors = [];
const ids = new Set(), slugs = new Set(), categorySlugs = new Set();
if (!Array.isArray(catalog.books) || !Array.isArray(catalog.categories)) throw new Error("Catalog must contain books and categories arrays");
for (const category of catalog.categories) {
  if (!category.slug || !category.title || !category.description) errors.push("Category requires slug/title/description");
  if (categorySlugs.has(category.slug)) errors.push(`Duplicate category slug: ${category.slug}`);
  categorySlugs.add(category.slug);
}
for (const book of catalog.books) {
  for (const key of ["id", "slug", "title", "originalTitle", "summary", "introduction", "language", "format"]) {
    if (typeof book[key] !== "string" || !book[key].trim()) errors.push(`${book.id}: missing ${key}`);
  }
  if (!/^[a-z0-9][a-z0-9_-]{0,120}$/i.test(book.id)) errors.push(`Invalid book id: ${book.id}`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(book.slug)) errors.push(`Invalid book slug: ${book.slug}`);
  if (ids.has(book.id)) errors.push(`Duplicate book id: ${book.id}`);
  if (slugs.has(book.slug)) errors.push(`Duplicate book slug: ${book.slug}`);
  ids.add(book.id); slugs.add(book.slug);
  if (!categorySlugs.has(book.categorySlug)) errors.push(`${book.id}: unknown category`);
  for (const key of ["authors", "tags", "audience", "highlights", "previews"]) if (!Array.isArray(book[key])) errors.push(`${book.id}: ${key} must be array`);
  if (book.editors !== undefined && (!Array.isArray(book.editors) || !book.editors.every((name) => typeof name === "string" && name.trim()))) errors.push(`${book.id}: invalid editors`);
  if (book.authorTypes && (book.authorTypes.length !== book.authors.length || !book.authorTypes.every((type) => ["Person", "Organization"].includes(type)))) errors.push(`${book.id}: authorTypes must match authors`);
  if (book.resourceKind && !["book", "magazine"].includes(book.resourceKind)) errors.push(`${book.id}: invalid resourceKind`);
  if (book.resourceKind === "magazine" && !book.periodicalTitle?.trim()) errors.push(`${book.id}: magazine requires periodicalTitle`);
  if (!["ready", "preparing", "unavailable"].includes(book.resourceStatus)) errors.push(`${book.id}: invalid resourceStatus`);
  for (const image of [book.cover, ...(book.previews || [])]) {
    if (!image || !image.src?.startsWith("/books/") || image.src.includes("..") || !image.width || !image.height) { errors.push(`${book.id}: invalid image`); continue; }
    const absolute = resolve(root, "public", image.src.slice(1));
    if (!absolute.startsWith(resolve(root, "public", "books") + "/")) errors.push(`${book.id}: image escaped asset folder`);
    try { await stat(absolute); } catch { errors.push(`${book.id}: missing asset ${image.src}`); }
  }
}
const raw = JSON.stringify(catalog);
for (const forbidden of ["local_path", "source_paths", "source_item_url", "resource-links", "/Users/", "pan.baidu.com", "yun.baidu.com", "extractionCode"]) {
  if (raw.includes(forbidden)) errors.push(`Public catalog contains private field/value: ${forbidden}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Catalog valid: ${catalog.books.length} books, ${catalog.categories.length} categories. All public assets exist.`);
