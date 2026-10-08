import type { Book, BookDetail, CatalogBook } from "@/lib/types";

export const CATALOG_PAGE_SIZE = 24;
export type CatalogSort = "recommended" | "title" | "pages";
export type CatalogQuery = { query: string; sort: CatalogSort };
export type CatalogSearchParams = Record<string, string | string[] | undefined>;

export function getCatalogQuery(params: CatalogSearchParams): CatalogQuery {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const sort = first(params.sort);
  return { query: (first(params.q) || "").trim(), sort: sort === "title" || sort === "pages" ? sort : "recommended" };
}

export function getCatalogPage(pathname: string, params: CatalogSearchParams): number {
  const pathPage = pathname.match(/^\/library\/([1-9]\d*)$/)?.[1];
  const queryPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const value = pathPage || (pathname.startsWith("/categories/") ? queryPage : undefined);
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : 1;
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

function normalizeSearchText(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").normalize("NFKC")
    .replace(/[‘’‚‛ʼ]/g, "'").replace(/[“”„‟]/g, '"').toLocaleLowerCase();
}

export function buildBookSearchText(book: Book): string {
  return normalizeSearchText([book.title, book.originalTitle, ...book.authors, ...(book.editors || []), ...book.tags,
    book.subcategory, book.summary, book.isbn, ...(book.searchTerms || [])].filter(Boolean).join(" "));
}

export function filterCatalog<T extends Book | CatalogBook>(books: T[], { query, sort }: CatalogQuery): T[] {
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean).map((token) => {
    const compact = token.replace(/\p{Dash_Punctuation}/gu, "");
    return /^(?:\d{9}[\dx]|\d{13})$/.test(compact) ? compact : token;
  });
  return books.filter((book) => {
    const text = "searchText" in book ? book.searchText : buildBookSearchText(book);
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
