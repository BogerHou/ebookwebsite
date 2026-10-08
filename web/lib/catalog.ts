import "server-only";
import source from "@/data/catalog.json";
import type { Book, Catalog, CatalogBook } from "@/lib/types";
import { getBookDetail } from "@/lib/book-details";
import { buildBookSearchTerms, buildBookSearchText } from "@/lib/catalog-search";
import { toCatalogBook } from "@/lib/catalog-list";
import { selectRelatedBooks } from "@/lib/related-books";

const sourceCatalog = source as Catalog;
const catalog: Catalog = {
  ...sourceCatalog,
  books: sourceCatalog.books.map((book) => ({ ...book, searchTerms: buildBookSearchTerms(book, getBookDetail(book.id)) })),
};
const catalogBooks = catalog.books.map((book) => toCatalogBook(book, buildBookSearchText(book)));

export function getCatalog(): Catalog { return catalog; }
export function getBooks(): Book[] { return catalog.books; }
export function getCatalogBooks(): CatalogBook[] { return catalogBooks; }
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
  return selectRelatedBooks(catalog.books, book);
}
