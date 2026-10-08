import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildBookSearchTerms, buildBookSearchText, catalogHref, filterCatalog, getCatalogPage, getCatalogQuery, CATALOG_PAGE_SIZE } from "../lib/catalog-search.ts";

const source = JSON.parse(await readFile(new URL("../data/catalog.json", import.meta.url), "utf8"));
const details = JSON.parse(await readFile(new URL("../data/book-details.json", import.meta.url), "utf8"));
const sourceBefore = JSON.stringify(source);
const books = source.books.map((book) => ({ ...book, searchTerms: buildBookSearchTerms(book, details.books[book.id]) }));
const search = (query, sort = "recommended") => filterCatalog(books, { query, sort });
let checks = 0;
function includesBook(query, id) {
  assert(search(query).some((book) => book.id === id), `Search must find ${id}: ${query}`);
  checks++;
}

const cycling = "cc6e5b5d2e0758996e3554cfc1817182";
includesBook("功率计", cycling);
includesBook("Bike Fit", cycling);
includesBook("空气污染", cycling);
includesBook("斗拱", "4f30dc14c7fcbb7eed32bf4a60292547");
includesBook("二传", "65449a376f04d2e3e15dbdd1763fb8b5");
includesBook("离机闪光", "33e89a740d9a525c74ab5afa12364253");
includesBook("9781492551263", cycling);
includesBook("978-1-4925-5126-3", cycling);
includesBook("９７８１４９２５５１２６３", cycling);
includesBook("ＢＩＫＥ　ＦＩＴ", cycling);
includesBook("功率计 CHEUNG", cycling);
includesBook("Swimming Anatomy", "f3b481c0082b19be66b48a368a6104bd");
includesBook("跑步解剖学", "0cc2f631bcefafdf29925da05f7f6ed7");
includesBook("Agusti\u0301n Sa\u0301iz", "18adca3c74e8375b31ce5ea5b29f0f37");
includesBook("Agustin Saiz", "18adca3c74e8375b31ce5ea5b29f0f37");
includesBook("Jose Guilherme", "a5a2fd0e808c3d5d28a042d471c0e1c0");
includesBook("Julio Garganta", "a5a2fd0e808c3d5d28a042d471c0e1c0");
includesBook("Renee Mauborgne", "3c73bd307b7d16dc5988aa2189469d54");
includesBook("Router’s Full Potential", "01bb7f87ca4f747dc572cc999891ddbf");

const routerBook = books.find((book) => book.id === "01bb7f87ca4f747dc572cc999891ddbf");
const curlyTitleBook = { ...routerBook, originalTitle: routerBook.originalTitle.replaceAll("'", "’") };
assert.equal(filterCatalog([curlyTitleBook], { query: "Router's Full Potential", sort: "recommended" }).length, 1, "Typography folding must apply to the index as well as the query");
assert.equal(filterCatalog([{ ...curlyTitleBook, searchText: buildBookSearchText(curlyTitleBook) }], { query: "Router’s Full Potential", sort: "recommended" }).length, 1, "Precomputed indexes must use the same normalization");
checks += 2;

includesBook("Javair Gillett", "ca322432cfa1b017534cb591bae81419");
includesBook("BILL BURGOS", "ca322432cfa1b017534cb591bae81419");
includesBook("Kinda S. Lenberg", "65449a376f04d2e3e15dbdd1763fb8b5");

assert.equal(search("书径未收录的独立搜索测试词").length, 0);
assert.equal(search("功率计 斗拱").length, 0, "Every query token must match the same book");
assert.deepEqual(search(" swimming   ANATOMY ").map((book) => book.id), search("Swimming Anatomy").map((book) => book.id));
assert.deepEqual(getCatalogQuery({ q: ["  功率计  ", "ignored"], sort: ["pages", "title"] }), { query: "功率计", sort: "pages" });
assert.deepEqual(getCatalogQuery({ sort: "unknown" }), { query: "", sort: "recommended" });
checks += 5;

const recommended = search("");
assert.equal(recommended.length, 80);
assert.equal(new Set(recommended.map((book) => book.id)).size, 80);
const firstOrdinary = recommended.findIndex((book) => !book.featured);
assert(recommended.slice(firstOrdinary).every((book) => !book.featured), "Featured books precede ordinary books");
assert.deepEqual(recommended.filter((book) => !book.featured).map((book) => book.id), books.filter((book) => !book.featured).map((book) => book.id), "Ordinary books keep their catalog order");
const byPages = search("", "pages");
assert(byPages.every((book, index) => !index || (byPages[index - 1].pages || 0) >= (book.pages || 0)));
const byTitle = search("", "title");
assert(byTitle.every((book, index) => !index || byTitle[index - 1].title.localeCompare(book.title, "zh-CN") <= 0));
assert.deepEqual(Array.from({ length: Math.ceil(recommended.length / CATALOG_PAGE_SIZE) }, (_, index) => recommended.slice(index * CATALOG_PAGE_SIZE, (index + 1) * CATALOG_PAGE_SIZE).length), [24, 24, 24, 8]);
checks += 7;

assert.equal(catalogHref(2, { query: "功率计", sort: "pages" }), "/library/2?q=%E5%8A%9F%E7%8E%87%E8%AE%A1&sort=pages#catalog");
assert.equal(catalogHref(1, { query: "Bike Fit", sort: "recommended" }, "cycling-riding-snow"), "/categories/cycling-riding-snow?q=Bike+Fit#catalog");
assert.equal(catalogHref(2, { query: "", sort: "title" }, "ball-sports"), "/categories/ball-sports?sort=title&page=2#catalog");
assert.equal(getCatalogPage("/library/2", {}), 2);
assert.equal(getCatalogPage("/library/3", { page: "2" }), 3, "The library page belongs to the path");
assert.equal(getCatalogPage("/categories/ball-sports", { page: ["2", "3"] }), 2);
assert.equal(getCatalogPage("/", { page: "2" }), 1, "The first global page ignores unsupported page parameters");
for (const page of ["0", "-1", "2.5", "text", "9007199254740992"]) assert.equal(getCatalogPage("/categories/ball-sports", { page }), 1);
assert.equal(JSON.stringify(source), sourceBefore, "Building the public index must not mutate source records");
assert(books.every((book) => book.searchTerms.every((term) => typeof term === "string")), "Only strings are serialized into the search index");
assert(!JSON.stringify(books.map((book) => book.searchTerms)).match(/\/Users\/|pan\.baidu\.com|extractionCode|pdfPath/), "Search props must stay public");
checks += 15;

console.log(`Catalog search passed: ${checks} checks across ${books.length} books. Topic, title, contributor, ISBN, Unicode, sorting and pagination checks passed.`);
