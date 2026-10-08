import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { CatalogBrowser } from "@/components/catalog-browser";
import { getCatalog, getCatalogBooks, getCategory, getCategoryCounts } from "@/lib/catalog";
import { getCategoryEditorial, getGuidesForCategory } from "@/lib/editorial";
import { GuideLink } from "@/components/guide-link";
import { absoluteUrl, jsonLd } from "@/lib/site";
import { CATALOG_PAGE_SIZE, filterCatalog, getCatalogPage, getCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-search";

export const dynamicParams = false;
export function generateStaticParams() { return getCatalog().categories.map((category) => ({ slug: category.slug })); }
export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> }): Promise<Metadata> {
  const category = getCategory((await params).slug);
  if (!category) return {};
  const description = getCategoryEditorial(category.slug)?.intro[0] || category.description;
  const query = getCatalogQuery(await searchParams);
  return { title: `${category.title}外文原版书籍与选书导读`, description, alternates: { canonical: `/categories/${category.slug}` }, ...(query.query || query.sort !== "recommended" ? { robots: { index: false, follow: true } } : {}), openGraph: { title: `${category.title}外文原版书籍与选书导读`, description, url: `/categories/${category.slug}`, images: [{ url: "/opengraph-image", width: 1200, height: 630 }] } };
}
export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> }) {
  const category = getCategory((await params).slug);
  if (!category) notFound();
  const catalog = getCatalog();
  const content = getCategoryEditorial(category.slug);
  const guides = getGuidesForCategory(category.slug);
  const books = getCatalogBooks().filter((book) => book.categorySlug === category.slug);
  const queryParams = await searchParams;
  const query = getCatalogQuery(queryParams);
  const results = filterCatalog(books, query);
  const currentPage = Math.min(getCatalogPage(`/categories/${category.slug}`, queryParams), Math.max(1, Math.ceil(results.length / CATALOG_PAGE_SIZE)));
  const offset = (currentPage - 1) * CATALOG_PAGE_SIZE;
  const visibleBooks = results.slice(offset, offset + CATALOG_PAGE_SIZE);
  return <div className="container category-page"><Link href="/categories" className="back-to-catalog"><ArrowLeftIcon aria-hidden="true" />全部主题</Link>
    <div className="page-introduction"><h1>{category.title}</h1><p>{category.description}</p></div>
    {content && <div className="category-editorial"><div>{content.intro.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><div className="category-reading-path"><h2>可以这样开始读</h2><ol>{content.readingApproach.map((step) => <li key={step}>{step}</li>)}</ol></div></div>}
    {guides.length > 0 && <section className="category-guides"><h2>这个主题的选书指南</h2><div className="home-guide-grid">{guides.map((guide) => <GuideLink key={guide.slug} guide={guide} />)}</div></section>}
    <CatalogBrowser key={`${category.slug}|${currentPage}|${query.query}|${query.sort}`} books={books} categories={catalog.categories} categoryCounts={getCategoryCounts()} initialCategory={category.slug} initialPage={currentPage} initialQuery={query.query} initialSort={query.sort} preloadCount={0} />
    {content && <section className="category-questions"><h2>选择这类原版书之前</h2><div className="editorial-questions">{content.questions.map((question) => <details key={question.question}><summary>{question.question}</summary><p>{question.answer}</p></details>)}</div></section>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "CollectionPage", name: category.title, description: category.description, inLanguage: "zh-CN", url: absoluteUrl(`/categories/${category.slug}`), mainEntity: { "@type": "ItemList", numberOfItems: visibleBooks.length, itemListElement: visibleBooks.map((book, index) => ({ "@type": "ListItem", position: offset + index + 1, name: book.title, url: absoluteUrl(`/books/${book.slug}`) })) } }) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ name: "全部书籍", path: "/" }, { name: "主题分类", path: "/categories" }, { name: category.title, path: `/categories/${category.slug}` }].map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) }) }} />
  </div>;
}
