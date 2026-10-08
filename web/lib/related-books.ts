import type { Book } from "./types";

export function selectRelatedBooks(books: Book[], book: Book): Book[] {
  const sameTopic = (other: Book) => {
    const sameSubcategory = Boolean(book.subcategory && other.subcategory === book.subcategory);
    const sharedTag = other.tags.some((tag) => book.tags.includes(tag));
    return sameSubcategory && sharedTag;
  };
  return books.filter((other) => other.id !== book.id && other.categorySlug === book.categorySlug && sameTopic(other))
    .slice(0, 4);
}
