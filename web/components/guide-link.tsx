import Image from "@/components/book-image";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { getBookById } from "@/lib/catalog";
import type { ReadingGuide } from "@/lib/types";

export function GuideLink({ guide }: { guide: ReadingGuide }) {
  const book = guide.bookIds.map(getBookById).find(Boolean);
  return <Link className="guide-link" href={`/guides/${guide.slug}`}>
    {book && <div className="guide-link-image"><Image src={book.cover.src} width={book.cover.width} height={book.cover.height} alt={`${book.title}原书图像`} sizes="100px" /></div>}
    <div><h3>{guide.title}</h3><p>{guide.description}</p><span>阅读选书指南 <ArrowRightIcon aria-hidden="true" /></span></div>
  </Link>;
}
