import Image from "next/image";
import type { Book } from "@/lib/types";
import { bookImageAlt } from "@/lib/book-images";

export function BookCover({ book, priority = false }: { book: Book; priority?: boolean }) {
  return <div className="book-cover">
    <Image src={book.cover.src} alt={bookImageAlt(book)}
      width={book.cover.width} height={book.cover.height} priority={priority}
      sizes="(max-width: 639px) 42vw, (max-width: 1023px) 25vw, 230px" />
  </div>;
}
