import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";
import { getCatalog, getCategoryCounts } from "@/lib/catalog";
import { absoluteUrl, jsonLd, SITE_NAME } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { getGuides } from "@/lib/editorial";
import { GuideLink } from "@/components/guide-link";
import { getCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-search";

const homeMetadata: Metadata = { title: { absolute: "外文原版书籍与中文选书导读｜书径" }, description: "按运动、航海、木工、攀登等主题发现外文原版书籍。阅读中文介绍、选书比较、原书信息与精选内页，找到适合自己的原版读物。", alternates: { canonical: "/" } };
export async function generateMetadata({ searchParams }: { searchParams: Promise<CatalogSearchParams> }): Promise<Metadata> {
  const query = getCatalogQuery(await searchParams);
  return { ...homeMetadata, ...(query.query || query.sort !== "recommended" ? { robots: { index: false, follow: true } } : {}) };
}
export default async function Home({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const catalog = getCatalog();
  const query = getCatalogQuery(await searchParams);
  const guides = getGuides();
  const heroBooks = catalog.books.filter((book) => book.featured).slice(0, 3);
  return <div className="container home-page">
    <section className="home-editorial-hero"><div><h1>外文原版书籍，<br />从中文导读开始</h1><p>{catalog.books.length} 本书，{catalog.categories.length} 个主题。从运动、航海到工程手作，先了解一本书讲什么、适合谁，再阅读原书。</p><div className="hero-actions"><a className="button button-primary" href="#catalog">查找书籍</a><Link className="text-link" href="/guides">先读选书指南 <ArrowRightIcon aria-hidden="true" /></Link></div></div>
      <div className="home-cover-shelf">{heroBooks.map((book, index) => <Link href={`/books/${book.slug}`} key={book.id} className={`shelf-book shelf-book-${index + 1}`}><Image src={book.cover.src} width={book.cover.width} height={book.cover.height} alt={`${book.title}原书图像`} sizes="(max-width: 767px) 100px, 140px" priority={index === 0} /></Link>)}</div>
    </section>
    <section className="home-reading-paths" aria-labelledby="reading-paths-title"><div className="section-title"><h2 id="reading-paths-title">从一个阅读问题开始</h2><p>比较同一主题下的不同书籍，找到适合自己的阅读方向。</p></div><div className="home-guide-grid">{guides.slice(0, 2).map((guide) => <GuideLink key={guide.slug} guide={guide} />)}</div><Link className="text-link guide-directory-link" href="/guides">查看全部选书指南 <ArrowRightIcon aria-hidden="true" /></Link></section>
    <CatalogBrowser key={`${query.query}|${query.sort}`} books={catalog.books} categories={catalog.categories} categoryCounts={getCategoryCounts()} initialQuery={query.query} initialSort={query.sort} />
    <section className="home-topics" aria-labelledby="home-topics-title"><div className="section-title"><h2 id="home-topics-title">沿着一个主题继续读</h2><p>找到你关心的领域，比较同类书籍的侧重点。</p></div><div className="topic-link-grid">{catalog.categories.map((category) => <Link href={`/categories/${category.slug}`} key={category.slug}><h3>{category.title}</h3><p>{category.description}</p><span>{catalog.books.filter((book) => book.categorySlug === category.slug).length} 本书 <ArrowRightIcon aria-hidden="true" /></span></Link>)}</div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
      "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/"), inLanguage: "zh-CN",
    }) }} />
  </div>;
}
