import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { CatalogBrowser } from "@/components/catalog-browser";
import { getCatalog, getCatalogBooks, getCategoryCounts } from "@/lib/catalog";
import { absoluteUrl, jsonLd } from "@/lib/site";
import { filterCatalog, getCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-search";

const PAGE_SIZE = 24;
export const dynamicParams = false;
export function generateStaticParams() {
  return Array.from({ length: Math.ceil(getCatalog().books.length / PAGE_SIZE) }, (_, index) => ({ page: String(index + 1) }));
}

function getPage(page: string) {
  const totalPages = Math.ceil(getCatalog().books.length / PAGE_SIZE);
  if (!/^[1-9]\d*$/.test(page) || Number(page) > totalPages) notFound();
  return Number(page);
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ page: string }>; searchParams: Promise<CatalogSearchParams> }): Promise<Metadata> {
  const currentPage = getPage((await params).page);
  const totalPages = Math.ceil(getCatalog().books.length / PAGE_SIZE);
  const path = currentPage === 1 ? "/" : `/library/${currentPage}`;
  const title = `外文原版书籍目录：第 ${currentPage} 页`;
  const description = `浏览书径原版书籍目录第 ${currentPage} / ${totalPages} 页。查看中文导读、原文题名、作者、适读人群和原书内页，按兴趣选择下一本书。`;
  const query = getCatalogQuery(await searchParams);
  return { title, description, alternates: { canonical: path }, ...(query.query || query.sort !== "recommended" ? { robots: { index: false, follow: true } } : {}), openGraph: { title, description, url: path, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "书径馆藏原书封面与中文阅读导读" }] } };
}

export default async function LibraryPage({ params, searchParams }: { params: Promise<{ page: string }>; searchParams: Promise<CatalogSearchParams> }) {
  const currentPage = getPage((await params).page);
  if (currentPage === 1) permanentRedirect("/");
  const catalog = getCatalog();
  const query = getCatalogQuery(await searchParams);
  const catalogBooks = getCatalogBooks();
  const results = filterCatalog(catalogBooks, query);
  const resultPage = Math.min(currentPage, Math.max(1, Math.ceil(results.length / PAGE_SIZE)));
  const offset = (resultPage - 1) * PAGE_SIZE;
  const books = results.slice(offset, offset + PAGE_SIZE);
  const path = `/library/${currentPage}`;
  const breadcrumbs = [{ name: "全部书籍", path: "/" }, { name: `第 ${currentPage} 页`, path }];
  return <div className="container category-page library-page">
    <nav aria-label="面包屑" className="breadcrumbs"><Link href="/">全部书籍</Link><ChevronRightIcon aria-hidden="true" /><span>书籍目录</span></nav>
    <div className="page-introduction"><h1>外文原版书籍目录</h1><p>按书名、作者或主题找书，阅读中文介绍与选书指南。</p></div>
    <CatalogBrowser key={`${currentPage}|${query.query}|${query.sort}`} books={catalogBooks} categories={catalog.categories} categoryCounts={getCategoryCounts()} initialPage={currentPage} initialQuery={query.query} initialSort={query.sort} preloadCount={2} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
      "@context": "https://schema.org", "@type": "CollectionPage", name: `原版书籍目录 · 第 ${currentPage} 页`, url: absoluteUrl(path), inLanguage: "zh-CN",
      isPartOf: { "@type": "WebSite", name: "书径", url: absoluteUrl("/") },
      mainEntity: { "@type": "ItemList", numberOfItems: books.length, itemListOrder: "https://schema.org/ItemListOrderAscending", itemListElement: books.map((book, index) => ({ "@type": "ListItem", position: offset + index + 1, name: book.title, url: absoluteUrl(`/books/${book.slug}`) })) },
    }) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) }) }} />
  </div>;
}
