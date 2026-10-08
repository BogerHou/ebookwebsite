import type { Book, CatalogBook } from "./types";

export function toCatalogBook(book: Book, searchText: string): CatalogBook {
  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    originalTitle: book.originalTitle,
    categorySlug: book.categorySlug,
    subcategory: book.subcategory,
    tags: book.tags,
    summary: book.summary,
    language: book.language,
    format: book.format,
    pages: book.pages,
    cover: book.cover,
    resourceStatus: book.resourceStatus,
    featured: book.featured,
    searchText,
  };
}
