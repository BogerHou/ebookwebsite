import type { Book } from "@/lib/types";

export function bookImageCaption(book: Book): string {
  if (book.cover.kind === "placeholder" || book.cover.src.endsWith(".svg")) return "书籍题名";
  if (book.cover.kind === "title-page") return "原书标题页";
  if (book.cover.kind === "cover") return "原书封面";
  return "原书图像";
}
export function bookImageAlt(book: Book): string {
  return `${book.originalTitle}，${bookImageCaption(book)}`;
}
