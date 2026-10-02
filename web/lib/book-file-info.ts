import "server-only";
import source from "@/data/book-file-info.json";
import type { Book, BookFileInfo } from "@/lib/types";

const fileInfo = source as { schemaVersion: string; checkedAt: string; books: Record<string, BookFileInfo> };

export function getBookFileInfo(id: string): BookFileInfo | undefined {
  return fileInfo.books[id];
}

export function getBookFileSize(book: Book, info?: BookFileInfo): string | undefined {
  const sizeMB = info ? info.sizeBytes / 1024 / 1024 : book.sizeMB;
  if (sizeMB === undefined || !Number.isFinite(sizeMB) || sizeMB <= 0) return undefined;
  return `${sizeMB.toLocaleString("zh-CN", { minimumFractionDigits: 1, maximumFractionDigits: sizeMB < 1 ? 2 : 1 })} MB`;
}

export function getBookTextSearchLabel(info: BookFileInfo): string {
  if (info.pagesWithText === 0) return "未检测到可检索文字";
  return `${info.pagesWithText} / ${info.pageCount} 页可检索`;
}
