import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/node-html-parser");
const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index < 0 ? fallback : args[index + 1];
};
const base = new URL(value("--base", "http://localhost:3001")).origin;
const canonicalOrigin = new URL(value("--canonical-origin", process.env.SITE_URL || base)).origin;
const preview = args.includes("--preview");
const output = value("--output", join(root, ".tooling", "qa", "seo-report.json"));
const catalog = JSON.parse(await readFile(join(root, "data", "catalog.json"), "utf8"));
const editorial = JSON.parse(await readFile(join(root, "data", "editorial.json"), "utf8"));
const notesSource = JSON.parse(await readFile(join(root, "data", "book-notes.json"), "utf8"));
const notes = notesSource.notes || {};
const details = JSON.parse(await readFile(join(root, "data", "book-details.json"), "utf8")).books || {};
const guides = editorial.guides;
if (!Array.isArray(guides)) throw new Error("editorial.json must contain a guides array.");
const checks = [];
const pages = [];
const documents = new Map();
const expect = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), ...(detail ? { detail } : {}) });
const canonicalUrl = (path) => new URL(path, canonicalOrigin).toString();
const sameUrl = (actual, expected) => {
  try { return new URL(actual).toString() === new URL(expected).toString(); }
  catch { return false; }
};
const privateUrl = /https?:\/\/(?:pan|yun)\.baidu\.com\/s\//i;
const constructionWords = /已核验|已核对|核验前页|导读整理说明|正在整理|资源正在准备|正在补充|排版转换|非全书评测|依据原书题名|购买功能暂未开放|AI\s*辅助/;
const constructionMatches = (text) => [...new Set([...text.matchAll(new RegExp(constructionWords.source, "g"))].map((match) => match[0]))];
const hrefPath = (href) => {
  try { return new URL(href, base).pathname; }
  catch { return ""; }
};
const cardPaths = (document) => document.querySelectorAll("#catalog .book-card-link").map((link) => hrefPath(link.getAttribute("href")));
const expectedCardPaths = (books) => books.map((book) => `/books/${book.slug}`);
const sameList = (actual, expected) => actual.length === expected.length && actual.every((item, index) => item === expected[index]);
const nonemptyText = (text) => typeof text === "string" && Boolean(text.trim());
const textList = (list) => Array.isArray(list) && list.length > 0 && list.every(nonemptyText);
const unique = (list) => Array.isArray(list) && new Set(list).size === list.length;
const bookIds = new Set(catalog.books.map((book) => book.id));
const categorySlugs = new Set(catalog.categories.map((category) => category.slug));
const linkedBooks = (ids) => Array.isArray(ids) && ids.length > 0 && unique(ids) && ids.every((id) => bookIds.has(id));

function inspectStaticContent() {
  expect("static: catalog contains the agreed 80 books, 12 categories and 6 guides", catalog.books.length === 80 && catalog.categories.length === 12 && guides.length === 6);
  expect("static: catalog book IDs and slugs are unique", unique(catalog.books.map((book) => book.id)) && unique(catalog.books.map((book) => book.slug)));
  expect("static: every book has an existing category", catalog.books.every((book) => categorySlugs.has(book.categorySlug)));
  const publicSource = JSON.stringify({ catalog, editorial, notes, details });
  expect("static: public editorial data excludes cloud share URLs and local paths", !privateUrl.test(publicSource) && !publicSource.includes("/Users/"));
  const publicNotes = Object.fromEntries(Object.entries(notes).map(([id, { evidenceLabel: _internalEvidenceLabel, ...note }]) => [id, note]));
  const readerCopy = JSON.stringify({ catalog, editorial, notes: publicNotes, details });
  const staticConstruction = constructionMatches(readerCopy);
  expect("static: public reader copy contains no construction-process wording", staticConstruction.length === 0, staticConstruction.join("、"));
  expect("static: reading notes cover every book and contain no unknown IDs", Object.keys(notes).length === catalog.books.length && catalog.books.every((book) => Object.hasOwn(notes, book.id)) && Object.keys(notes).every((id) => bookIds.has(id)));
  const noteBodies = [];
  for (const book of catalog.books) {
    const note = notes[book.id];
    expect(`static ${book.id}: note has all required editorial fields`, note && textList(note.paragraphs) && textList(note.readingTips) && nonemptyText(note.selectionNote) && nonemptyText(note.evidenceLabel));
    expect(`static ${book.id}: related IDs are real, unique and exclude the same book`, note && linkedBooks(note.relatedBookIds) && !note.relatedBookIds.includes(book.id));
    if (note && textList(note.paragraphs)) noteBodies.push(note.paragraphs.join("\n"));
  }
  expect("static: book-note bodies are distinct", new Set(noteBodies).size === noteBodies.length);
  expect("static: detailed book records cover every catalog book exactly once", Object.keys(details).length === catalog.books.length && catalog.books.every((book) => Object.hasOwn(details, book.id)) && Object.keys(details).every((id) => bookIds.has(id)));
  const detailBodies = [];
  for (const book of catalog.books) {
    const detail = details[book.id];
    const sections = (list) => Array.isArray(list) && list.length > 0 && list.every((item) => nonemptyText(item.title) && nonemptyText(item.description));
    expect(`static ${book.id}: detail has substantive sections and questions`, detail && textList(detail.overview) && sections(detail.topics) && sections(detail.readingPath) && detail.questions?.length > 0 && detail.questions.every((item) => nonemptyText(item.question) && nonemptyText(item.answer)));
    expect(`static ${book.id}: comparisons reference other catalog books`, detail && detail.comparisons?.length > 0 && unique(detail.comparisons.map((item) => item.bookId)) && detail.comparisons.every((item) => bookIds.has(item.bookId) && item.bookId !== book.id && nonemptyText(item.reason)));
    expect(`static ${book.id}: optional contents and author profiles have complete fields`, detail && (!detail.contents || nonemptyText(detail.contents.label) && detail.contents.items?.length > 0 && detail.contents.items.every((item) => nonemptyText(item.title))) && (!detail.authorProfiles || detail.authorProfiles.every((item) => nonemptyText(item.name) && nonemptyText(item.description))));
    expect(`static ${book.id}: external references use public HTTPS URLs`, detail && (!detail.sources || detail.sources.every((item) => nonemptyText(item.label) && /^https:\/\//.test(item.url) && !privateUrl.test(item.url) && !/localhost|\/Users\//.test(item.url))));
    if (detail?.overview) detailBodies.push(detail.overview.join("\n"));
  }
  expect("static: detailed book introductions are distinct", new Set(detailBodies).size === catalog.books.length);
  const categories = editorial.categories || [];
  expect("static: category editorials cover all 12 categories once", categories.length === catalog.categories.length && unique(categories.map((category) => category.slug)) && categories.every((category) => categorySlugs.has(category.slug)));
  for (const category of categories) {
    expect(`static category ${category.slug}: editorial fields are complete`, textList(category.intro) && textList(category.readingApproach) && Array.isArray(category.questions) && category.questions.length > 0 && category.questions.every((item) => nonemptyText(item.question) && nonemptyText(item.answer)));
    expect(`static category ${category.slug}: featured books reference real IDs`, linkedBooks(category.featuredBookIds));
  }
  expect("static: guide slugs are unique", unique(guides.map((guide) => guide.slug)));
  for (const guide of guides) {
    expect(`static guide ${guide.slug}: title, description and lead are complete`, nonemptyText(guide.title) && nonemptyText(guide.description) && nonemptyText(guide.lead));
    expect(`static guide ${guide.slug}: categories and books reference existing entries`, Array.isArray(guide.categorySlugs) && guide.categorySlugs.length > 0 && unique(guide.categorySlugs) && guide.categorySlugs.every((slug) => categorySlugs.has(slug)) && linkedBooks(guide.bookIds));
    expect(`static guide ${guide.slug}: sections have unique IDs and visible text`, Array.isArray(guide.sections) && guide.sections.length > 0 && unique(guide.sections.map((section) => section.id)) && guide.sections.every((section) => nonemptyText(section.id) && nonemptyText(section.title) && textList(section.paragraphs)));
    expect(`static guide ${guide.slug}: section book links match the guide book list`, Array.isArray(guide.sections) && guide.sections.every((section) => !section.bookIds || linkedBooks(section.bookIds) && section.bookIds.every((id) => guide.bookIds?.includes(id))));
    expect(`static guide ${guide.slug}: questions contain real text`, Array.isArray(guide.questions) && guide.questions.length > 0 && guide.questions.every((item) => nonemptyText(item.question) && nonemptyText(item.answer)));
    if (guide.previewReferences) {
      const guideText = guide.sections.flatMap((section) => section.paragraphs).join("\n");
      expect(`static guide ${guide.slug}: cited preview pages remain available and described`, guide.previewReferences.length > 0 && guide.previewReferences.every((reference) => {
        const book = catalog.books.find((book) => book.id === reference.bookId);
        return book && guide.bookIds.includes(book.id) && reference.pages.length > 0 && reference.pages.every((page) => book.previews.some((image) => image.page === page) && new RegExp(`第\\s*${page}\\s*页`).test(guideText));
      }));
    }
  }
}

async function request(path, redirect = "follow") {
  const started = performance.now();
  const response = await fetch(new URL(path, base), {
    redirect, headers: { "User-Agent": "Googlebot" }, signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  return { response, text, elapsedMs: Math.round(performance.now() - started) };
}

function schemas(document, path) {
  const output = [];
  for (const block of document.querySelectorAll('script[type="application/ld+json"]')) {
    try { output.push(JSON.parse(block.textContent)); }
    catch { expect(`${path}: JSON-LD parses`, false); }
  }
  const flattened = output.flatMap((schema) => Array.isArray(schema) ? schema : schema["@graph"] || [schema]);
  expect(`${path}: existing JSON-LD declares context and type`, output.every((schema) => schema["@context"]) && flattened.every((schema) => schema["@type"]));
  expect(`${path}: no fabricated review or irrelevant rich-result markup`, !flattened.some((schema) => ["AggregateRating", "Review", "Product", "FAQPage", "HowTo"].includes(schema["@type"])));
  return flattened;
}

async function inspect(path, { canonicalPath = new URL(path, base).pathname, noindex = preview } = {}) {
  const { response, text, elapsedMs } = await request(path);
  expect(`${path}: HTTP 200`, response.status === 200, `status ${response.status}`);
  expect(`${path}: public HTML contains no cloud share URL or local file path`, !privateUrl.test(text) && !text.includes("/Users/") && !text.includes("resource-links.json"));
  const document = parse(text);
  const readerDocument = parse(document.querySelector("main")?.outerHTML || document.outerHTML);
  readerDocument.querySelectorAll("script, style, [hidden]").forEach((element) => element.remove());
  const visibleConstruction = constructionMatches(readerDocument.textContent);
  const rawConstruction = constructionMatches(text);
  expect(`${path}: visitor-facing text contains no construction-process wording`, visibleConstruction.length === 0, visibleConstruction.join("、"));
  expect(`${path}: raw HTML contains no hidden construction-process wording`, rawConstruction.length === 0, rawConstruction.join("、"));
  const head = document.querySelector("head");
  const title = head?.querySelector("title")?.textContent?.trim();
  const description = head?.querySelector('meta[name="description"]')?.getAttribute("content");
  const canonical = head?.querySelector('link[rel="canonical"]')?.getAttribute("href");
  const robots = head?.querySelector('meta[name="robots"]')?.getAttribute("content") || "";
  const robotsHeader = response.headers.get("x-robots-tag") || "";
  expect(`${path}: title and description present in initial head`, Boolean(title && description));
  expect(`${path}: one canonical identifies the intended public page`, head?.querySelectorAll('link[rel="canonical"]').length === 1 && sameUrl(canonical, canonicalUrl(canonicalPath)));
  expect(`${path}: robots matches deployment and search mode`, noindex ? /\bnoindex\b/.test(robots) && /\bfollow\b/.test(robots) : !/\bnoindex\b/.test(robots));
  if (!noindex) expect(`${path}: no HTTP header accidentally blocks indexing`, !/\bnoindex\b/.test(robotsHeader));
  expect(`${path}: one visible primary heading`, document.querySelectorAll("h1").length === 1);
  expect(`${path}: Open Graph image supplied`, Boolean(head?.querySelector('meta[property="og:image"]')?.getAttribute("content")));
  const ld = schemas(document, path);
  pages.push({ path, status: response.status, title, description, canonical, noindex, htmlBytes: Buffer.byteLength(text), elapsedMs, schemaTypes: ld.map((schema) => schema["@type"]) });
  documents.set(path, { document, ld });
  return { document, ld };
}

async function inspectHttpContent() {
  const pageSize = 24;
  const pageCount = Math.ceil(catalog.books.length / pageSize);
  const libraryPaths = Array.from({ length: pageCount }, (_, index) => index === 0 ? "/" : `/library/${index + 1}`);
  const discovered = new Set();
  for (const path of libraryPaths) {
    const { document, ld } = await inspect(path);
    const links = cardPaths(document);
    const expectedCount = Math.min(pageSize, catalog.books.length - libraryPaths.indexOf(path) * pageSize);
    expect(`${path}: initial HTML lists the expected ${expectedCount} books`, links.length === expectedCount);
    links.forEach((href) => discovered.add(href));
    const pagination = document.querySelector('nav[aria-label="书籍目录分页"]');
    const pageLinks = pagination?.querySelectorAll("a").map((link) => hrefPath(link.getAttribute("href"))) || [];
    expect(`${path}: all other catalog pages have crawlable links`, libraryPaths.filter((other) => other !== path).every((other) => pageLinks.includes(other)));
    expect(`${path}: exactly one pagination and no competing load-more control`, document.querySelectorAll(".catalog-pagination").length === 1 && document.querySelectorAll(".load-more").length === 0);
    if (path !== "/") expect(`${path}: collection and breadcrumb schema`, ld.some((schema) => schema["@type"] === "CollectionPage") && ld.some((schema) => schema["@type"] === "BreadcrumbList"));
  }
  expect("catalog pagination exposes every book without clicking or running JavaScript", catalog.books.every((book) => discovered.has(`/books/${book.slug}`)) && discovered.size === catalog.books.length, `${discovered.size} unique book links / ${catalog.books.length} books`);

  const firstPage = await request("/library/1", "manual");
  expect("/library/1 permanently redirects to the homepage", firstPage.response.status === 308 && new URL(firstPage.response.headers.get("location"), base).pathname === "/");
  for (const path of ["/library/0", `/library/${pageCount + 1}`]) {
    const result = await request(path);
    expect(`${path}: out-of-range catalog page returns 404`, result.response.status === 404);
  }

  const allContentPaths = ["/categories", "/about", "/guides", ...catalog.categories.map((category) => `/categories/${category.slug}`), ...guides.map((guide) => `/guides/${guide.slug}`), ...catalog.books.map((book) => `/books/${book.slug}`)];
  // Keep concurrent requests bounded so this also works against a small preview.
  for (let offset = 0; offset < allContentPaths.length; offset += 6) {
    await Promise.all(allContentPaths.slice(offset, offset + 6).map((path) => inspect(path)));
  }

  for (const category of catalog.categories) {
    const path = `/categories/${category.slug}`;
    const { document, ld } = documents.get(path);
    const expected = catalog.books.filter((book) => book.categorySlug === category.slug).sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    const visible = cardPaths(document);
    const collection = ld.find((schema) => schema["@type"] === "CollectionPage");
    const schemaPaths = collection?.mainEntity?.itemListElement?.map((item) => hrefPath(item.url || item.item)) || [];
    expect(`${path}: catalog contains only the current category's books`, sameList(visible, expectedCardPaths(expected)));
    expect(`${path}: CollectionPage list matches the visible catalog`, collection?.mainEntity?.numberOfItems === visible.length && sameList(schemaPaths, visible));
    const categoryNavigation = document.querySelector(".category-filters");
    const categoryPaths = categoryNavigation?.querySelectorAll("a").map((link) => hrefPath(link.getAttribute("href"))) || [];
    expect(`${path}: theme controls are real navigation links`, categoryNavigation?.querySelectorAll("button").length === 0 && categoryPaths.includes("/") && catalog.categories.every((other) => categoryPaths.includes(`/categories/${other.slug}`)));
    expect(`${path}: no load-more control`, document.querySelectorAll(".load-more").length === 0);
  }

  for (const book of catalog.books) {
    const path = `/books/${book.slug}`;
    const { document, ld } = documents.get(path);
    expect(`${path}: server-rendered title matches its book`, document.querySelector("h1")?.textContent.trim() === book.title);
    const workType = book.resourceKind === "magazine" ? "PublicationIssue" : "Book";
    expect(`${path}: publication schema identifies the same work and resource kind`, ld.some((schema) => schema["@type"] === workType && schema.name === book.title && sameUrl(schema.url, canonicalUrl(path))));
    const note = notes[book.id];
    const introduction = document.querySelector("#introduction")?.textContent || "";
    const readingTips = document.querySelector("#reading-tips")?.textContent || "";
    const detail = details[book.id];
    expect(`${path}: detailed introduction is visible without JavaScript`, detail && detail.overview.every((paragraph) => introduction.includes(paragraph)));
    expect(`${path}: detailed reading path is visible without JavaScript`, detail && detail.readingPath.every((step) => readingTips.includes(step.title) && readingTips.includes(step.description)));
    expect(`${path}: core themes explain the book's specific content`, detail && detail.topics.every((topic) => document.querySelector("#highlights")?.textContent.includes(topic.title) && document.querySelector("#highlights")?.textContent.includes(topic.description)));
    expect(`${path}: contents appear only when actual chapter data exists`, detail?.contents?.items.length ? Boolean(document.querySelector("#contents")) && detail.contents.items.every((item) => document.querySelector("#contents").textContent.includes(item.title)) : !document.querySelector("#contents"));
    expect(`${path}: author profiles appear only with supplied biographical data`, detail?.authorProfiles?.length ? detail.authorProfiles.every((author) => document.querySelector("#authors")?.textContent.includes(author.name) && document.querySelector("#authors")?.textContent.includes(author.description)) : !document.querySelector("#authors"));
    expect(`${path}: reading questions have visible answers`, detail && detail.questions.every((item) => document.querySelector("#reading-questions")?.textContent.includes(item.question) && document.querySelector("#reading-questions")?.textContent.includes(item.answer)));
    expect(`${path}: book comparisons have specific explanations and real links`, detail && detail.comparisons.every((item) => document.querySelector("#book-comparisons")?.textContent.includes(item.reason) && document.querySelector(`#book-comparisons a[href="/books/${catalog.books.find((other) => other.id === item.bookId)?.slug}"]`)));
    const bookSchema = ld.find((schema) => schema["@type"] === workType);
    const isbn = detail?.bibliography?.isbn || book.isbn;
    const publisher = detail?.bibliography?.publisher;
    const languageCodes = { 英语: "en", 西班牙语: "es", 德语: "de", 法语: "fr", 意大利语: "it", 日语: "ja", 中文: "zh" };
    expect(`${path}: schema language matches the file's actual language`, bookSchema?.inLanguage === languageCodes[book.language]);
    expect(`${path}: schema ISBN and publisher match displayed bibliography`, (!isbn || bookSchema?.isbn === isbn && document.querySelector(".book-basic-fields")?.textContent.includes(isbn)) && (!publisher || bookSchema?.publisher?.name === publisher && document.querySelector(".book-basic-fields")?.textContent.includes(publisher)));
    const names = book.authors.flatMap((name) => name.split(";")).map((name) => name.trim()).filter(Boolean);
    const expectedAuthors = book.authorRole === "editor" ? [] : names;
    const expectedEditors = [...(book.authorRole === "editor" ? names : []), ...(book.editors || [])];
    expect(`${path}: schema distinguishes all authors and editors by exact name`, sameList((bookSchema?.author || []).map((person) => person.name), expectedAuthors) && sameList((bookSchema?.editor || []).map((person) => person.name), expectedEditors));
    if (book.authorTypes && book.authorRole !== "editor") expect(`${path}: schema contributor entity types match the recorded authors`, sameList((bookSchema?.author || []).map((author) => author["@type"]), book.authorTypes));
    if (book.editors?.length) expect(`${path}: editor names are also visible near the title`, book.editors.every((name) => document.querySelector(".detail-book-info")?.textContent.includes(name)) && (bookSchema?.editor || []).every((editor) => editor["@type"] === "Person"));
    const year = detail?.bibliography?.year || book.year;
    const edition = detail?.bibliography?.edition || book.edition;
    expect(`${path}: schema year and applicable edition match visible book information`, (year ? bookSchema?.datePublished === year && document.querySelector(".book-basic-fields")?.textContent.includes(year) : !bookSchema?.datePublished) && (!edition || document.querySelector(".book-basic-fields")?.textContent.includes(edition)) && (workType === "PublicationIssue" ? !bookSchema?.bookEdition : edition ? bookSchema?.bookEdition === edition : !bookSchema?.bookEdition));
    if (workType === "PublicationIssue") expect(`${path}: magazine issue belongs to its periodical without Book-only fields`, bookSchema?.isPartOf?.["@type"] === "Periodical" && bookSchema.isPartOf.name === book.periodicalTitle && bookSchema.encodingFormat === "application/pdf" && !bookSchema.bookFormat && !bookSchema.isbn);
    expect(`${path}: no invented ratings, reviews or FAQ rich-result markup`, !ld.some((schema) => schema["@type"] === "FAQPage" || schema.aggregateRating || schema.review));
    expect(`${path}: intended audience is visible without JavaScript`, document.querySelector("#audience")?.textContent.includes(book.audience[0] || ""));
    expect(`${path}: internal evidence label is not presented to visitors`, !note?.evidenceLabel || !document.textContent.includes(note.evidenceLabel));
    expect(`${path}: preview module and sidebar link appear only with actual previews`, book.previews.length > 0
      ? Boolean(document.querySelector("#previews")) && Boolean(document.querySelector('.book-reading-sidebar a[href="#previews"]')) && document.querySelectorAll("#previews .preview-grid figure").length === book.previews.length
      : !document.querySelector("#previews") && !document.querySelector('.book-reading-sidebar a[href="#previews"]'));
    const relatedLinks = document.querySelectorAll(".related-books .book-card-link").map((link) => link.getAttribute("href"));
    expect(`${path}: specified related books have crawlable links`, note && Array.isArray(note.relatedBookIds) && note.relatedBookIds.every((id) => relatedLinks.includes(`/books/${catalog.books.find((other) => other.id === id)?.slug}`)));
  }

  await inspectSearchVariants();

  for (const path of [...libraryPaths, ...allContentPaths]) {
    const { document } = documents.get(path);
    const broken = document.querySelectorAll("a[href]").map((link) => {
      const target = new URL(link.getAttribute("href"), new URL(path, base));
      const targetDocument = target.origin === base ? documents.get(target.pathname)?.document : undefined;
      const anchorExists = targetDocument?.querySelectorAll("[id]").some((element) => element.getAttribute("id") === decodeURIComponent(target.hash.slice(1)));
      return target.hash && targetDocument && !anchorExists ? `${target.pathname}${target.hash}` : undefined;
    }).filter(Boolean);
    expect(`${path}: links to page sections have existing targets`, broken.length === 0, [...new Set(broken)].join(", "));
  }

  const sitemap = await request("/sitemap.xml");
  const locations = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
  const expectedPaths = [...libraryPaths, ...allContentPaths];
  expect("sitemap returns HTTP 200 and XML", sitemap.response.status === 200 && /xml/.test(sitemap.response.headers.get("content-type") || ""));
  expect("sitemap lists every public book, category, guide and catalog page", expectedPaths.every((path) => locations.some((url) => sameUrl(url, canonicalUrl(path)))));
  expect("sitemap uses one production origin and contains no duplicates", locations.every((url) => new URL(url).origin === canonicalOrigin) && new Set(locations).size === locations.length);
  expect("sitemap excludes private APIs and cloud shares", !locations.some((url) => new URL(url).pathname.startsWith("/api/") || privateUrl.test(url)) && !locations.includes(canonicalUrl("/library/1")));

  const robots = await request("/robots.txt");
  expect("robots.txt declares sitemap and excludes resource APIs", robots.response.status === 200 && robots.text.includes(`Sitemap: ${canonicalUrl("/sitemap.xml")}`) && /Disallow:\s*\/api\//i.test(robots.text));
  expect("robots.txt allows public pages and rendering assets", /Allow:\s*\//i.test(robots.text) && !/Disallow:\s*\/(?:_next|books|categories|guides|$)/mi.test(robots.text));

  const homeImageUrl = documents.get("/").document.querySelector('meta[property="og:image"]').getAttribute("content");
  const imageUrl = new URL(homeImageUrl);
  const imagePath = `${imageUrl.pathname}${imageUrl.search}`;
  const image = await fetch(new URL(imagePath, base), { signal: AbortSignal.timeout(15000) });
  const imageBytes = new Uint8Array(await image.arrayBuffer());
  expect("default Open Graph image is a real generated PNG", image.status === 200 && image.headers.get("content-type")?.startsWith("image/png") && imageBytes[0] === 137 && imageBytes[1] === 80 && imageBytes[2] === 78 && imageBytes[3] === 71);

  if (args.includes("--check-resources")) {
    const privateMap = JSON.parse(await readFile(join(root, "data", "resource-links.json"), "utf8"));
    let verified = 0;
    for (const book of catalog.books) {
      const result = await request(`/api/resources/${book.id}`);
      const response = JSON.parse(result.text);
      const expected = privateMap.resources[book.id];
      expect(`${book.id}: resource API stays uncached and excluded from indexing`, /no-store/.test(result.response.headers.get("cache-control") || "") && /noindex/.test(result.response.headers.get("x-robots-tag") || ""));
      if (book.resourceStatus === "ready") {
        const matched = result.response.status === 200 && response.url === expected?.url && response.extractionCode === (expected?.extractionCode || null) && response.expiry === (expected?.expiry || null);
        expect(`${book.id}: free resource still matches the private server map`, matched);
        if (matched) verified += 1;
      } else expect(`${book.id}: unavailable book exposes no share URL`, result.response.status === 503 && !response.url);
    }
    expect("all currently ready resources verified against the private mapping", verified === catalog.books.filter((book) => book.resourceStatus === "ready").length, `${verified} resources verified; URLs and codes omitted from this report`);
  }
}

// Independently compute expected results from public fields; do not import the
// production filtering helper, so implementation mistakes can fail this check.
function expectedResults(query, sort = "recommended", categorySlug) {
  const tokens = query.normalize("NFKC").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).map((token) => {
    const compact = token.replace(/\p{Dash_Punctuation}/gu, "");
    return /^(?:\d{9}[\dx]|\d{13})$/.test(compact) ? compact : token;
  });
  return catalog.books.filter((book) => {
    const detail = details[book.id];
    const haystack = [book.title, book.originalTitle, ...book.authors, ...(book.editors || []), ...book.tags, book.subcategory, book.summary, book.isbn,
      ...(book.searchTerms || []), detail?.bibliography?.isbn, ...(detail?.topics || []).flatMap((topic) => [topic.title, topic.description]),
      ...(detail?.contents?.items || []).flatMap((item) => [item.title, item.originalTitle])].filter(Boolean).join(" ").normalize("NFKC").toLocaleLowerCase();
    return (!categorySlug || book.categorySlug === categorySlug) && tokens.every((token) => haystack.includes(token));
  }).sort((a, b) => sort === "pages" ? (b.pages || 0) - (a.pages || 0) : sort === "title" ? a.title.localeCompare(b.title, "zh-CN") : Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
}

async function inspectSearchVariants() {
  const cases = [
    { path: "/?q=跑步", query: "跑步", sort: "recommended", page: 1, expectedBookId: "0cc2f631bcefafdf29925da05f7f6ed7" },
    { path: "/?q=zzzz-shujing-no-match-2026", query: "zzzz-shujing-no-match-2026", sort: "recommended", page: 1, expectedCount: 0 },
    { path: "/library/2?sort=pages", query: "", sort: "pages", page: 2 },
    { path: "/categories/water-sailing?q=游泳", query: "游泳", sort: "recommended", page: 1, categorySlug: "water-sailing", expectedCount: 1 },
    { path: "/categories/fitness-dance?q=斗拱", query: "斗拱", sort: "recommended", page: 1, categorySlug: "fitness-dance", expectedCount: 0 },
  ];
  for (const [query, expectedBookId] of [
    ["功率计", "cc6e5b5d2e0758996e3554cfc1817182"], ["Ｂｉｋｅ Ｆｉｔ", "cc6e5b5d2e0758996e3554cfc1817182"],
    ["斗拱", "4f30dc14c7fcbb7eed32bf4a60292547"], ["二传", "65449a376f04d2e3e15dbdd1763fb8b5"],
    ["离机闪光", "33e89a740d9a525c74ab5afa12364253"], ["978-1-4925-5126-3", "cc6e5b5d2e0758996e3554cfc1817182"],
    ["Kinda Lenberg", "65449a376f04d2e3e15dbdd1763fb8b5"], ["Javair Gillett", "ca322432cfa1b017534cb591bae81419"],
  ]) cases.push({ path: `/?q=${encodeURIComponent(query)}`, query, sort: "recommended", page: 1, expectedBookId });
  const multiPageQuery = ["训练", "a", "the"].find((query) => expectedResults(query).length > 24);
  expect("search fixture has a real query spanning multiple catalog pages", Boolean(multiPageQuery));
  if (multiPageQuery) {
    cases.push({ path: `/?q=${encodeURIComponent(multiPageQuery)}&sort=title`, query: multiPageQuery, sort: "title", page: 1 });
    cases.push({ path: `/library/2?q=${encodeURIComponent(multiPageQuery)}&sort=title`, query: multiPageQuery, sort: "title", page: 2 });
  }
  for (const test of cases) {
    const { document, ld } = await inspect(test.path, { noindex: true });
    const expected = expectedResults(test.query, test.sort, test.categorySlug);
    const totalPages = Math.ceil(expected.length / 24);
    const currentPage = Math.min(test.page, Math.max(1, totalPages));
    const visibleExpected = expected.slice((currentPage - 1) * 24, currentPage * 24);
    const actual = cardPaths(document);
    expect(`${test.path}: initial HTML contains the expected filtered and sorted page`, sameList(actual, expectedCardPaths(visibleExpected)));
    if (test.expectedCount !== undefined) expect(`${test.path}: expected matching-book count`, expected.length === test.expectedCount && actual.length === test.expectedCount);
    if (test.expectedBookId) expect(`${test.path}: specific subject or contributor discovers its expected book`, actual.includes(`/books/${catalog.books.find((book) => book.id === test.expectedBookId)?.slug}`));
    expect(`${test.path}: query and sort are present in server-rendered controls`, document.querySelector('input[name="q"]')?.getAttribute("value") === test.query && document.querySelector('select[name="sort"] option[selected]')?.getAttribute("value") === test.sort);
    expect(`${test.path}: one result-pagination at most, and no load-more control`, document.querySelectorAll(".catalog-pagination").length === (totalPages > 1 ? 1 : 0) && document.querySelectorAll(".load-more").length === 0);
    if (!expected.length) expect(`${test.path}: empty result presents a clear empty state`, Boolean(document.querySelector("#catalog .empty-state")));
    const paginationLinks = document.querySelectorAll(".catalog-pagination a").map((link) => new URL(link.getAttribute("href"), base));
    expect(`${test.path}: result pagination preserves query, sort and catalog anchor`, paginationLinks.every((url) => (url.searchParams.get("q") || "") === test.query && (url.searchParams.get("sort") || "recommended") === test.sort && url.hash === "#catalog"));
    const collection = ld.find((schema) => schema["@type"] === "CollectionPage");
    if (collection) {
      const schemaPaths = collection.mainEntity?.itemListElement?.map((item) => hrefPath(item.url || item.item)) || [];
      expect(`${test.path}: schema matches the filtered visible book list`, sameList(schemaPaths, actual) && collection.mainEntity?.numberOfItems === actual.length);
    }
  }
}

try {
  inspectStaticContent();
  if (!args.includes("--static-only")) await inspectHttpContent();
} catch (error) {
  expect("validation completed", false, error.message);
}

const report = {
  checkedAt: new Date().toISOString(), base, canonicalOrigin, deploymentMode: preview ? "preview/noindex" : "local-or-production/indexable",
  counts: { books: catalog.books.length, bookNotes: Object.keys(notes).length, detailedBooks: Object.keys(details).length, booksWithContents: Object.values(details).filter((detail) => detail.contents?.items.length).length, booksWithAuthorProfiles: Object.values(details).filter((detail) => detail.authorProfiles?.length).length, booksWithPreviews: catalog.books.filter((book) => book.previews.length).length, categories: catalog.categories.length, guides: guides.length, publicPages: pages.filter((page) => !new URL(page.path, base).search).length, searchVariants: pages.filter((page) => new URL(page.path, base).search).length, fetchedPages: pages.length, checks: checks.length, failed: checks.filter((check) => !check.passed).length },
  measurement: args.includes("--static-only") ? "Static editorial coverage, required fields and internal references. No HTTP pages fetched." : "Static content plus initial HTML and HTTP responses. No JavaScript interaction, search-index status or field Core Web Vitals measured. Text completeness checks are not a ranking or minimum-word-count claim.",
  pages, checks,
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report.counts, report: output, failures: checks.filter((check) => !check.passed) }, null, 2));
if (report.counts.failed) process.exitCode = 1;
