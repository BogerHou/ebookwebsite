import "server-only";
import source from "@/data/book-details.json";
import type { Book, BookDetail } from "@/lib/types";

const details = source as { updatedAt: string; books: Record<string, BookDetail> };
export function getBookDetail(id: string): BookDetail | undefined { return details.books[id]; }
export function getBookBibliography(book: Book, detail?: BookDetail) {
  return {
    year: detail?.bibliography?.year || book.year,
    edition: detail?.bibliography?.edition || book.edition,
    isbn: detail?.bibliography?.isbn || book.isbn,
    publisher: detail?.bibliography?.publisher,
    printPages: detail?.bibliography?.printPages,
  };
}
export function getBookDescription(book: Book, detail?: BookDetail): string {
  const description = detail?.topics.slice(0, 2).map((topic) => topic.description).join(" ") || book.summary;
  return Array.from(description).length > 150 ? `${Array.from(description).slice(0, 147).join("")}…` : description;
}
