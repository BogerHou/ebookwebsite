import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildBookSearchTerms, buildBookSearchText, filterCatalog } from "../lib/catalog-search.ts";
import { toCatalogBook } from "../lib/catalog-list.ts";
import { selectRelatedBooks } from "../lib/related-books.ts";

const source = JSON.parse(await readFile(new URL("../data/catalog.json", import.meta.url), "utf8"));
const details = JSON.parse(await readFile(new URL("../data/book-details.json", import.meta.url), "utf8"));
const books = source.books.map((book) => ({ ...book, searchTerms: buildBookSearchTerms(book, details.books[book.id]) }));
const original = JSON.stringify(books);
const list = books.map((book) => toCatalogBook(book, buildBookSearchText(book)));
const ids = (matches) => matches.map((book) => book.id);
const queries = new Set(["", "功率计", "Bike Fit", "ＢＩＫＥ　ＦＩＴ", "978-1-4925-5126-3", "功率计 CHEUNG", "斗拱", "二传", "离机闪光", "书径未收录的独立搜索测试词"]);
for (const book of books) {
  queries.add(book.title);
  queries.add(book.originalTitle);
  book.authors.forEach((name) => queries.add(name));
  book.editors?.forEach((name) => queries.add(name));
  if (book.isbn) queries.add(book.isbn);
}
let comparisons = 0;
for (const query of queries) {
  for (const sort of ["recommended", "title", "pages"]) {
    assert.deepEqual(ids(filterCatalog(list, { query, sort })), ids(filterCatalog(books, { query, sort })), `${query}: ${sort}`);
    comparisons++;
  }
}
for (const book of list) {
  for (const field of ["introduction", "audience", "highlights", "previews", "seoTitle", "seoDescription", "authors", "editors", "isbn", "searchTerms"]) {
    assert(!Object.hasOwn(book, field), `List props must omit ${field}`);
  }
  assert.equal(book.searchText, buildBookSearchText(books.find((full) => full.id === book.id)));
}
assert.equal(JSON.stringify(books), original, "Preparing list props must not mutate the source");
const beforeBytes = Buffer.byteLength(original);
const afterBytes = Buffer.byteLength(JSON.stringify(list));
assert(afterBytes < beforeBytes * 0.8, "List props should remove a material amount of unused data");
const bySlug = (slug) => {
  const book = books.find((book) => book.slug === slug);
  assert(book, `Missing test fixture: ${slug}`);
  return book;
};
assert.deepEqual(selectRelatedBooks(books, bySlug("complete-horse-riding-manual")), [], "Horse riding must not fall back to motorcycles or bicycles");
assert.deepEqual(selectRelatedBooks(books, bySlug("swimming-anatomy")), [], "Sharing a broad category does not make a book related");
assert(!selectRelatedBooks(books, books.find((book) => book.id === "d122fd2f0d705b63ff7ebc6ae7d0b326"))
  .some((book) => book.title.includes("驾驶")), "A broad shared subcategory must not connect home security to driving");
const cyclingRelated = selectRelatedBooks(books, bySlug("cycling-science"));
assert(cyclingRelated.length > 0 && cyclingRelated.every((book) => book.subcategory === bySlug("cycling-science").subcategory));
console.log(JSON.stringify({ books: list.length, searchComparisons: comparisons, beforeBytes, afterBytes, reductionPercent: Math.round((1 - afterBytes / beforeBytes) * 1000) / 10, relatedFallbackChecks: 4 }));
