import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { BookCover } from "@/components/book-cover";
import type { Book } from "@/lib/types";

export function BookCard({ book, priority = false }: { book: Book; priority?: boolean }) {
  return <article className="book-card">
    <Link href={`/books/${book.slug}`} className="book-card-link">
      <BookCover book={book} priority={priority} />
      <div className="book-card-copy">
        <p className="book-card-subcategory">{book.subcategory || book.tags[0]}</p>
        <h3>{book.title}</h3>
        <p className="original-title">{book.originalTitle}</p>
        <p className="book-card-summary">{book.summary}</p>
        <p className="book-card-meta"><span>{book.format} / {book.language}</span>{book.pages ? <span>{book.pages} 页</span> : null}</p>
        {book.resourceStatus !== "ready" && <p className="book-card-availability">暂不提供下载</p>}
        <span className="book-card-more">阅读导读 <ArrowRightIcon aria-hidden="true" /></span>
      </div>
    </Link>
  </article>;
}
