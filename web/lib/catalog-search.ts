import type { Book, BookDetail } from "@/lib/types";

export const CATALOG_PAGE_SIZE = 24;
export type CatalogSort = "recommended" | "title" | "pages";
export type CatalogQuery = { query: string; sort: CatalogSort };
export type CatalogSearchParams = Record<string, string | string[] | undefined>;

export function getCatalogQuery(params: CatalogSearchParams): CatalogQuery {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const sort = first(params.sort);
  return { query: (first(params.q) || "").trim(), sort: sort === "title" || sort === "pages" ? sort : "recommended" };
}

/** Small, public search index built on the server from the book's actual topics. */
export function buildBookSearchTerms(book: Book, detail?: BookDetail): string[] {
  return [...new Set([
    ...(book.searchTerms || []),
    ...(book.editors || []),
    book.isbn,
    detail?.bibliography?.isbn,
    ...(detail?.topics.flatMap((topic) => [topic.title, topic.description]) || []),
    ...(detail?.contents?.items.flatMap((item) => [item.title, item.originalTitle]) || []),
  ].filter((term): term is string => typeof term === "string" && Boolean(term.trim())).map((term) => term.trim()))];
}

export function filterCatalog(books: Book[], { query, sort }: CatalogQuery): Book[] {
  const tokens = query.normalize("NFKC").toLocaleLowerCase().split(/\s+/).filter(Boolean).map((token) => {
    const compact = token.replace(/\p{Dash_Punctuation}/gu, "");
    return /^(?:\d{9}[\dx]|\d{13})$/.test(compact) ? compact : token;
  });
  return books.filter((book) => {
    const text = [book.title, book.originalTitle, ...book.authors, ...(book.editors || []), ...book.tags,
      book.subcategory, book.summary, book.isbn, ...(book.searchTerms || [])]
      .filter(Boolean).join(" ").normalize("NFKC").toLocaleLowerCase();
    return tokens.every((token) => text.includes(token));
  }).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "zh-CN") :
    sort === "pages" ? (b.pages || 0) - (a.pages || 0) : Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
}

export function catalogHref(page: number, query: CatalogQuery, categorySlug?: string): string {
  const path = categorySlug ? `/categories/${categorySlug}` : page === 1 ? "/" : `/library/${page}`;
  const params = new URLSearchParams();
  if (query.query.trim()) params.set("q", query.query.trim());
  if (query.sort !== "recommended") params.set("sort", query.sort);
  if (categorySlug && page > 1) params.set("page", String(page));
  return `${path}${params.size ? `?${params}` : ""}#catalog`;
}
