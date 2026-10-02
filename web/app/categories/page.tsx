import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "主题分类", description: "按运动、航海、攀登、工艺等主题探索原版书籍与中文导读。", alternates: { canonical: "/categories" } };
export default function Categories() {
  const catalog = getCatalog();
  return <div className="container categories-page"><div className="page-introduction"><h1>从一个主题开始</h1><p>找到你关心的领域，沿着兴趣继续读下去。</p></div>
    <div className="category-directory">{catalog.categories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} className="category-directory-item"><div><p>{catalog.books.filter((book) => book.categorySlug === category.slug).length} 本书</p><h2>{category.title}</h2><p>{category.description}</p></div><ArrowRightIcon aria-hidden="true" /></Link>)}</div>
  </div>;
}
