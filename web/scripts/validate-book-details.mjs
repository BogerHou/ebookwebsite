import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(await readFile(join(root, "data/catalog.json"), "utf8"));
const data = JSON.parse(await readFile(join(root, "data/book-details.json"), "utf8"));
const ids = new Set(catalog.books.map((book) => book.id));
const errors = [];
const rows = [];
function validIsbn(value) {
  const isbn = value.replace(/[-\s]/g, "");
  if (/^\d{13}$/.test(isbn)) return [...isbn].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0) % 10 === 0;
  if (/^\d{9}[\dX]$/i.test(isbn)) return [...isbn.toUpperCase()].reduce((sum, digit, index) => sum + (digit === "X" ? 10 : Number(digit)) * (10 - index), 0) % 11 === 0;
  return false;
}
if (Object.keys(data.books).length !== catalog.books.length || Object.keys(data.books).some((id) => !ids.has(id))) errors.push("Detail IDs must match the catalog exactly.");
for (const book of catalog.books) {
  const detail = data.books[book.id];
  if (!detail) { errors.push(`${book.id}: no detail`); continue; }
  for (const key of ["overview", "topics", "readingPath", "questions"]) if (!Array.isArray(detail[key]) || !detail[key].length) errors.push(`${book.id}: missing ${key}`);
  if (!Array.isArray(detail.comparisons)) errors.push(`${book.id}: missing comparisons array`);
  for (const key of ["topics", "readingPath"]) if (detail[key]?.some((item) => !item.title?.trim() || !item.description?.trim())) errors.push(`${book.id}: incomplete ${key}`);
  if (detail.overview?.some((paragraph) => typeof paragraph !== "string" || !paragraph.trim())) errors.push(`${book.id}: empty paragraph`);
  if (detail.questions?.some((item) => !item.question?.trim() || !item.answer?.trim())) errors.push(`${book.id}: empty question or answer`);
  if (detail.comparisons?.some((item) => !ids.has(item.bookId) || item.bookId === book.id || !item.reason?.trim())) errors.push(`${book.id}: invalid book comparison`);
  if (new Set(detail.comparisons?.map((item) => item.bookId)).size !== detail.comparisons?.length) errors.push(`${book.id}: duplicate comparison`);
  if (detail.contents && (!detail.contents.label?.trim() || !detail.contents.items?.length || detail.contents.items.some((item) => !item.title?.trim()))) errors.push(`${book.id}: incomplete contents`);
  if (detail.authorProfiles?.some((item) => !item.name?.trim() || !item.description?.trim())) errors.push(`${book.id}: incomplete author profile`);
  if (detail.bibliography?.isbn && !validIsbn(detail.bibliography.isbn)) errors.push(`${book.id}: invalid ISBN checksum ${detail.bibliography.isbn}`);
  if (detail.bibliography?.year && !/^\d{4}$/.test(detail.bibliography.year)) errors.push(`${book.id}: invalid publication year`);
  const text = JSON.stringify(detail);
  if (/\/Users\/|pan\.baidu\.com|yun\.baidu\.com|pdfPath|readPdfPages|metadataCorrections|previewCandidates|已核验|正在整理|导读整理说明/.test(text)) errors.push(`${book.id}: internal information in public detail`);
  rows.push({ id: book.id, title: book.title, chineseCharacters: [...text.matchAll(/\p{Script=Han}/gu)].length, topics: detail.topics?.length || 0, chapters: detail.contents?.items.length || 0, authorProfiles: detail.authorProfiles?.length || 0, questions: detail.questions?.length || 0, previews: book.previews.length });
}
const sorted = rows.map((row) => row.chineseCharacters).sort((a, b) => a - b);
const report = {
  checkedAt: new Date().toISOString(),
  coverage: { books: rows.length, contents: rows.filter((row) => row.chapters).length, authorProfiles: rows.filter((row) => row.authorProfiles).length, previews: rows.filter((row) => row.previews).length, previewImages: rows.reduce((sum, row) => sum + row.previews, 0) },
  contentVolume: { medianChineseCharacters: sorted[Math.floor(sorted.length / 2)] || 0, minimum: sorted[0] || 0, maximum: sorted.at(-1) || 0, note: "Descriptive measurement of Chinese text, not a ranking threshold or a quality score." },
  errors, books: rows,
};
await mkdir(join(root, ".tooling/qa"), { recursive: true });
await writeFile(join(root, ".tooling/qa/book-details-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ coverage: report.coverage, contentVolume: report.contentVolume, errors }, null, 2));
if (errors.length) process.exitCode = 1;
