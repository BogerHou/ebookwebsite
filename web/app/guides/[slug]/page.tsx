import type { Metadata } from "next";
import Image from "@/components/book-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { getBookById, getCategory } from "@/lib/catalog";
import { editorialUpdatedAt, getGuide, getGuides } from "@/lib/editorial";
import { absoluteUrl, jsonLd, SITE_NAME } from "@/lib/site";
import type { Book } from "@/lib/types";

export const dynamicParams = false;
export function generateStaticParams() { return getGuides().map((guide) => ({ slug: guide.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return { title: guide.title, description: guide.description, alternates: { canonical: `/guides/${guide.slug}` }, openGraph: { type: "article", title: guide.title, description: guide.description, url: `/guides/${guide.slug}`, modifiedTime: editorialUpdatedAt(), images: [{ url: "/opengraph-image", width: 1200, height: 630 }] } };
}
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const books = guide.bookIds.map(getBookById).filter((book): book is Book => Boolean(book));
  const published = editorialUpdatedAt();
  return <div className="container guide-page">
    <nav className="breadcrumbs" aria-label="面包屑"><Link href="/">全部书籍</Link><ChevronRightIcon aria-hidden="true" /><Link href="/guides">选书指南</Link><ChevronRightIcon aria-hidden="true" /><span>{guide.title}</span></nav>
    <article>
      <header className="guide-article-header"><div><h1>{guide.title}</h1><p className="guide-lead">{guide.lead}</p><p className="editorial-byline"><Link href="/about">书径</Link><span>更新于 <time dateTime={published}>{published.replaceAll("-", "/")}</time></span></p></div>
        <div className="guide-cover-pair">{books.slice(0, 2).map((book) => <Link href={`/books/${book.slug}`} key={book.id}><Image src={book.cover.src} width={book.cover.width} height={book.cover.height} alt={`${book.title}原书图像`} sizes="(max-width: 767px) 120px, 150px" preload /></Link>)}</div>
      </header>
      <div className="guide-reading-layout"><div className="guide-body">
        <section className="reading-section" id="book-comparison"><h2>本篇提到的书</h2><div className="comparison-table-wrap"><table className="book-comparison"><caption className="sr-only">本篇书籍的题名、阅读主题与PDF页数</caption><thead><tr><th scope="col">书籍</th><th scope="col">阅读主题</th><th scope="col">PDF页数</th></tr></thead><tbody>{books.map((book) => <tr key={book.id}><th scope="row"><Link href={`/books/${book.slug}`}>{book.title}</Link><span lang="en">{book.originalTitle}</span></th><td>{book.subcategory || getCategory(book.categorySlug)?.title}</td><td>{book.pages ? `${book.pages} 页` : "—"}</td></tr>)}</tbody></table></div></section>
        {guide.sections.map((section) => <section className="reading-section" id={section.id} key={section.id}><h2>{section.title}</h2>{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}{section.bookIds && <div className="inline-book-links">{section.bookIds.map(getBookById).filter((book): book is Book => Boolean(book)).map((book) => <Link href={`/books/${book.slug}`} key={book.id}>查看《{book.title}》导读</Link>)}</div>}</section>)}
        {guide.questions.length > 0 && <section className="reading-section" id="reading-questions"><h2>选书时常见的问题</h2><div className="editorial-questions">{guide.questions.map((question) => <details key={question.question}><summary>{question.question}</summary><p>{question.answer}</p></details>)}</div></section>}
      </div><aside className="guide-sidebar"><nav aria-label="本篇目录"><h2>本篇目录</h2><a href="#book-comparison">本篇提到的书</a>{guide.sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}<a href="#reading-questions">常见问题</a></nav><div className="guide-topics"><h2>继续探索主题</h2>{guide.categorySlugs.map(getCategory).filter(Boolean).map((category) => category && <Link href={`/categories/${category.slug}`} key={category.slug}>{category.title}</Link>)}</div></aside></div>
    </article>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description, inLanguage: "zh-CN", datePublished: published, dateModified: published, author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/about") }, publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") }, mainEntityOfPage: absoluteUrl(`/guides/${guide.slug}`), ...(books[0] ? { image: absoluteUrl(books[0].cover.src) } : {}) }) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ name: "全部书籍", path: "/" }, { name: "选书指南", path: "/guides" }, { name: guide.title, path: `/guides/${guide.slug}` }].map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) }) }} />
  </div>;
}
