import type { Book } from "@/lib/types";

const codes: Record<string, string> = { 英语: "en", 西班牙语: "es", 德语: "de", 法语: "fr", 意大利语: "it", 日语: "ja", 中文: "zh" };
export function bookLanguageCode(book: Pick<Book, "language">): string | undefined { return codes[book.language]; }
