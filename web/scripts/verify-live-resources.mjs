import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const usage = `Read-only verification of integrated, real resource links.
Run from web/ after building and starting the production server.

node scripts/verify-live-resources.mjs --base-url http://localhost:3001 --expected-ready 79 \\
  --manifest ../uploads/upload-manifest.json --shares ../uploads/baidu-shares.json

Options:
  --base-url URL       Running website origin (default http://localhost:3001)
  --expected-ready N   Required number of ready books; omitted uses catalog count
  --manifest PATH     Optional upload manifest; checks IDs and completed uploads
  --shares PATH       Optional private import detail; compares with server mapping
  --map PATH          Expected private map (default data/resource-links.json)
  --report PATH       Sanitized JSON report (default .tooling/qa/live-resources-report.json)
  --timeout-ms N      Per HTTP request timeout (default 15000)
  --skip-artifacts    Skip local build trace/public asset scan, e.g. for remote verification
  --help              Print this help without reading data or sending requests

The script only requests this website's API, book HTML and client JS.
It never opens cloud share URLs, downloads books, modifies maps, or prints URLs/codes.`;

const options = { baseUrl: "http://localhost:3001", map: "data/resource-links.json", report: ".tooling/qa/live-resources-report.json", timeoutMs: 15000, skipArtifacts: false };
const names = { "--base-url": "baseUrl", "--expected-ready": "expectedReady", "--manifest": "manifest", "--shares": "shares", "--map": "map", "--report": "report", "--timeout-ms": "timeoutMs" };
for (let index = 2; index < process.argv.length; index++) {
  const flag = process.argv[index];
  if (flag === "--help") { console.log(usage); process.exit(0); }
  if (flag === "--skip-artifacts") { options.skipArtifacts = true; continue; }
  if (!names[flag] || !process.argv[index + 1] || process.argv[index + 1].startsWith("--")) throw new Error("Unknown option or missing value; use --help.");
  options[names[flag]] = process.argv[++index];
}
for (const key of ["expectedReady", "timeoutMs"]) if (options[key] !== undefined) {
  options[key] = Number(options[key]);
  if (!Number.isInteger(options[key]) || options[key] < (key === "timeoutMs" ? 1 : 0)) throw new Error(`Invalid ${key}.`);
}
const base = new URL(options.baseUrl);
if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== "/") throw new Error("Base URL must be an HTTP(S) origin without credentials, path, query or fragment.");
const root = process.cwd();
const reportPath = resolve(root, options.report);
const report = { completedAt: null, passed: false, targetOrigin: base.origin, readyBooks: 0, privateEntries: 0, apiChecked: 0, bookPagesChecked: 0, unavailableChecked: 0, clientScriptsChecked: 0, localAssetsChecked: 0, traceChecked: false, assertions: [], errors: [], rows: [] };
const issue = (scope, reason) => report.errors.push({ scope, reason });
async function jsonFile(path, label) {
  let text;
  try { text = await readFile(resolve(root, path), "utf8"); } catch { throw new Error(`Cannot read ${label}.`); }
  try { return JSON.parse(text); } catch { throw new Error(`Cannot parse ${label} JSON.`); }
}
function privateSignature(entry) { return JSON.stringify([new URL(entry.url).toString(), entry.extractionCode, entry.expiry]); }
function publicTextIsSafe(text) {
  const normalized = text.replaceAll("\\/", "/");
  return !["pan.baidu.com/s/", "yun.baidu.com/s/", "/Users/"].some(marker => normalized.includes(marker));
}
async function request(path) {
  return fetch(new URL(path, base), { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(options.timeoutMs) });
}
async function inBatches(items, callback) {
  for (let index = 0; index < items.length; index += 4) await Promise.all(items.slice(index, index + 4).map(callback));
}
async function filesUnder(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await filesUnder(path));
    else if (entry.isFile()) paths.push(path);
  }
  return paths;
}

try {
  const catalog = await jsonFile("data/catalog.json", "public catalog");
  const mapping = await jsonFile(options.map, "expected private resource map");
  if (!Array.isArray(catalog.books) || !mapping.resources || typeof mapping.resources !== "object" || Array.isArray(mapping.resources)) throw new Error("Invalid catalog or resource map structure.");
  const books = new Map(catalog.books.map(book => [book.id, book]));
  if (books.size !== catalog.books.length) issue("catalog", "Duplicate book IDs.");
  const ready = catalog.books.filter(book => book.resourceStatus === "ready");
  const unavailable = catalog.books.filter(book => book.resourceStatus === "unavailable");
  report.readyBooks = ready.length;
  report.privateEntries = Object.keys(mapping.resources).length;
  report.expectedMapBytes = Buffer.byteLength(JSON.stringify(mapping));
  if (!ready.length) issue("catalog", "No real ready resources to verify.");
  if (options.expectedReady !== undefined && ready.length !== options.expectedReady) issue("catalog", "Ready resource count differs from --expected-ready.");
  if (mapping.access_mode && mapping.access_mode !== "free") issue("map", "Integrated resources are not configured for free access.");
  const tokens = new Set();
  for (const [id, entry] of Object.entries(mapping.resources)) {
    const book = books.get(id);
    if (!book || book.resourceStatus !== "ready") { issue(id, "Mapped book is missing or is not ready in the catalog."); continue; }
    if (!entry || entry.enabled === false || (entry.access_mode && entry.access_mode !== "free")) { issue(id, "Resource is disabled or not free."); continue; }
    let url;
    try { url = new URL(entry.url); } catch { issue(id, "Invalid share URL."); continue; }
    if (url.protocol !== "https:" || !["pan.baidu.com", "yun.baidu.com"].includes(url.hostname) || url.port || url.username || url.password || url.hash || url.search || !/^\/s\/[A-Za-z0-9_-]+$/.test(url.pathname)) issue(id, "Share URL is not a canonical HTTPS Baidu share address.");
    if (tokens.has(url.pathname)) issue(id, "Share token is assigned to more than one book.");
    tokens.add(url.pathname);
    if (!/^[A-Za-z0-9]{4}$/.test(entry.extractionCode || "")) issue(id, "Missing or invalid four-character extraction code.");
    if (!Object.hasOwn(entry, "expiry") || (entry.expiry !== null && (typeof entry.expiry !== "string" || !Number.isFinite(Date.parse(entry.expiry)) || Date.parse(entry.expiry) <= Date.now()))) issue(id, "Expiry is missing, invalid or already passed.");
  }
  for (const book of ready) if (!Object.hasOwn(mapping.resources, book.id)) issue(book.id, "Ready book has no private resource mapping.");
  if (options.manifest) {
    const manifest = await jsonFile(options.manifest, "upload manifest");
    if (!Array.isArray(manifest.books)) throw new Error("Upload manifest must contain books.");
    const uploads = new Map(manifest.books.map(book => [book.id, book]));
    if (uploads.size !== manifest.books.length) issue("manifest", "Duplicate upload IDs.");
    for (const book of ready) if (uploads.get(book.id)?.uploadStatus !== "completed") issue(book.id, "Ready book is not marked upload-completed in the manifest.");
    if (options.shares) {
      const detail = await jsonFile(options.shares, "private import detail");
      if (!detail.resources || typeof detail.resources !== "object") throw new Error("Private import detail must contain resources.");
      if (Object.keys(detail.resources).length !== report.privateEntries) issue("detail", "Private import detail and server mapping counts differ.");
      for (const book of ready) {
        const entry = detail.resources[book.id];
        if (!entry || entry.bookId !== book.id || entry.folderName !== uploads.get(book.id)?.folderName) { issue(book.id, "Import detail and manifest folder identity differ."); continue; }
        try { if (privateSignature(entry) !== privateSignature(mapping.resources[book.id])) issue(book.id, "Import detail and server mapping values differ."); }
        catch { issue(book.id, "Cannot compare import detail and server mapping."); }
      }
      report.assertions.push("Ready IDs match completed manifest entries and private import folder identities.");
    }
  } else if (options.shares) throw new Error("--shares requires --manifest for folder identity verification.");
  if (report.errors.length) throw new Error("Preflight failed; no HTTP verification was run.");
  report.assertions.push("All ready books have unique, active, free, unexpired private mappings.");
  const scripts = new Set();
  await inBatches(ready, async book => {
    const started = performance.now();
    const row = { id: book.id, slug: book.slug, apiStatus: null, pageStatus: null, valuesMatch: false, noStore: false, noIndex: false, publicHtmlSafe: false, milliseconds: null };
    try {
      const response = await request(`/api/resources/${encodeURIComponent(book.id)}`);
      row.apiStatus = response.status;
      row.noStore = /(?:^|,)\s*no-store(?:,|$)/i.test(response.headers.get("cache-control") || "");
      row.noIndex = /noindex/i.test(response.headers.get("x-robots-tag") || "");
      const data = await response.json();
      const expected = mapping.resources[book.id];
      row.valuesMatch = response.status === 200 && Object.keys(data).sort().join() === "expiry,extractionCode,url" && data.url === new URL(expected.url).toString() && data.extractionCode === expected.extractionCode && data.expiry === expected.expiry;
      if (!row.valuesMatch || !row.noStore || !row.noIndex) issue(book.id, "Live claim response differs from expected mapping or cache/index headers.");
      report.apiChecked++;
      const page = await request(`/books/${book.slug}`);
      row.pageStatus = page.status;
      const html = await page.text();
      row.publicHtmlSafe = page.status === 200 && publicTextIsSafe(html);
      if (!row.publicHtmlSafe) issue(book.id, "Book HTML failed or contains private address/local-path markers.");
      if (!book.resourceNote?.includes("正在整理") && html.includes("网盘资源正在整理")) issue(book.id, "Book HTML still shows preparation text; rebuild the current catalog.");
      for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
        const url = new URL(match[1].replaceAll("&amp;", "&"), base);
        if (url.origin === base.origin && url.pathname.startsWith("/_next/static/") && extname(url.pathname) === ".js") scripts.add(url.pathname + url.search);
      }
      report.bookPagesChecked++;
    } catch { issue(book.id, "Claim/page request failed, timed out, or did not return expected JSON/HTML."); }
    row.milliseconds = Math.round(performance.now() - started);
    report.rows.push(row);
  });
  await inBatches(unavailable, async book => {
    try {
      const response = await request(`/api/resources/${encodeURIComponent(book.id)}`);
      const body = await response.json();
      if (response.status !== 503 || body.error?.code !== "RESOURCE_UNAVAILABLE" || !/no-store/.test(response.headers.get("cache-control") || "")) issue(book.id, "Unavailable resource did not retain its disabled claim response.");
      report.unavailableChecked++;
    } catch { issue(book.id, "Unavailable resource request failed."); }
  });
  await inBatches([...scripts], async path => {
    try {
      const response = await request(path);
      if (response.status !== 200 || !publicTextIsSafe(await response.text())) issue("client", "A served client script failed or contains private address/local-path markers.");
      report.clientScriptsChecked++;
    } catch { issue("client", "Client script request failed."); }
  });
  if (!options.skipArtifacts) {
    const tracePath = join(root, ".next/server/app/api/resources/[id]/route.js.nft.json");
    const trace = await jsonFile(tracePath, "built resource API trace");
    if (!Array.isArray(trace.files)) throw new Error("API trace has no files list.");
    if (!trace.files.some(file => resolve(dirname(tracePath), file) === resolve(root, "data/resource-links.json"))) issue("trace", "Private mapping is missing from the API deployment trace.");
    const rawFormats = new Set([".pdf", ".epub", ".mobi", ".doc", ".zip"]);
    if (trace.files.some(file => rawFormats.has(extname(file).toLowerCase()))) issue("trace", "Original electronic book formats are present in the function trace.");
    report.traceChecked = true;
    for (const directory of [join(root, "public"), join(root, ".next/static")]) for (const path of await filesUnder(directory)) {
      if (rawFormats.has(extname(path).toLowerCase())) issue("artifacts", "An original electronic book format is present in public/client assets.");
      if (!publicTextIsSafe((await readFile(path)).toString("utf8"))) issue("artifacts", "Public/client assets contain private address/local-path markers.");
      report.localAssetsChecked++;
    }
  }
  report.assertions.push("Each real live API response matches expected url/code/expiry; no-store and noindex remain present.", "Ready book HTML and served client JavaScript contain no cloud share addresses or local paths.", "Unavailable book remains unavailable.");
} catch (error) {
  issue("verification", error.message || "Verification failed.");
}
report.completedAt = new Date().toISOString();
report.passed = report.errors.length === 0 && report.apiChecked === report.readyBooks && report.bookPagesChecked === report.readyBooks;
report.rows.sort((a, b) => a.slug.localeCompare(b.slug));
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
console.log(JSON.stringify({ passed: report.passed, readyBooks: report.readyBooks, apiChecked: report.apiChecked, bookPagesChecked: report.bookPagesChecked, unavailableChecked: report.unavailableChecked, clientScriptsChecked: report.clientScriptsChecked, errors: report.errors.length, report: reportPath }));
if (!report.passed) process.exitCode = 1;
