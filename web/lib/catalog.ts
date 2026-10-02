import "server-only";
import source from "@/data/catalog.json";
import type { Book, Catalog } from "@/lib/types";
import { getBookDetail } from "@/lib/book-details";
import { buildBookSearchTerms } from "@/lib/catalog-search";

const sourceCatalog = source as Catalog;
const catalog: Catalog = {
  ...sourceCatalog,
  books: sourceCatalog.books.map((book) => ({ ...book, searchTerms: buildBookSearchTerms(book, getBookDetail(book.id)) })),
};

export function getCatalog(): Catalog { return catalog; }
export function getBooks(): Book[] { return catalog.books; }
export function getCategoryCounts(): Record<string, number> {
  return Object.fromEntries(catalog.categories.map((category) => [category.slug, catalog.books.filter((book) => book.categorySlug === category.slug).length]));
}
export function getBook(slug: string): Book | undefined {
  return catalog.books.find((book) => book.slug === slug);
}
export function getBookById(id: string): Book | undefined {
  return catalog.books.find((book) => book.id === id);
}
export function getCategory(slug: string) {
  return catalog.categories.find((category) => category.slug === slug);
}
export function getRelatedBooks(book: Book): Book[] {
  return catalog.books.filter((other) => other.id !== book.id)
    .sort((a, b) => Number(b.categorySlug === book.categorySlug) - Number(a.categorySlug === book.categorySlug))
    .slice(0, 4);
}
