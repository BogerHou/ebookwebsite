"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { BookCard } from "@/components/book-card";
import { CatalogPagination } from "@/components/catalog-pagination";
import { CATALOG_PAGE_SIZE, catalogHref, filterCatalog, type CatalogSort } from "@/lib/catalog-search";
import type { Book, Category } from "@/lib/types";

export function CatalogBrowser({ books, categories, categoryCounts, initialCategory = "all", initialPage = 1, initialQuery = "", initialSort = "recommended" }: {
  books: Book[]; categories: Category[]; categoryCounts: Record<string, number>;
  initialCategory?: string; initialPage?: number; initialQuery?: string; initialSort?: CatalogSort;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<CatalogSort>(initialSort);
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => filterCatalog(books, { query: deferredQuery, sort }), [books, deferredQuery, sort]);
  const totalPages = Math.ceil(filtered.length / CATALOG_PAGE_SIZE);
  const currentPage = query !== initialQuery || sort !== initialSort ? 1 : Math.min(initialPage, Math.max(1, totalPages));
  const offset = (currentPage - 1) * CATALOG_PAGE_SIZE;
  const categorySlug = initialCategory === "all" ? undefined : initialCategory;
  const selected = categories.find((category) => category.slug === categorySlug);
  const totalBooks = Object.values(categoryCounts).reduce((total, count) => total + count, 0);
  const searchLabel = selected ? `在${selected.title}中搜索` : "搜索书名、作者或主题";
  function reset() { setQuery(""); setSort("recommended"); router.push(catalogHref(1, { query: "", sort: "recommended" }, categorySlug)); }
  return <section className="catalog" aria-label="书籍目录" id="catalog">
    <form className="catalog-toolbar" action={categorySlug ? `/categories/${categorySlug}#catalog` : "/#catalog"} method="get">
      <div className="search-field">
        <label className="sr-only" htmlFor="book-search">{searchLabel}</label>
        <MagnifyingGlassIcon aria-hidden="true" />
        <input id="book-search" name="q" type="search" value={query} placeholder={searchLabel}
          autoComplete="off" onChange={(event) => setQuery(event.target.value)} />
        {query && <button type="button" className="clear-search" onClick={() => { setQuery(""); router.push(catalogHref(1, { query: "", sort }, categorySlug)); }} aria-label="清空搜索"><Cross2Icon aria-hidden="true" /></button>}
        <button type="submit" className="search-submit">搜索</button>
      </div>
      <div className="sort-field"><label htmlFor="book-sort">排序</label><select id="book-sort" name="sort" aria-label="排序" value={sort} onChange={(event) => { const nextSort = event.target.value as CatalogSort; setSort(nextSort); router.push(catalogHref(1, { query, sort: nextSort }, categorySlug)); }}>
        <option value="recommended">推荐排序</option><option value="title">书名顺序</option><option value="pages">页数最多</option>
      </select></div>
    </form>
    <nav className="category-filters" aria-label="书籍分类">
      <Link href="/#catalog" className={initialCategory === "all" ? "is-active" : ""} aria-current={initialCategory === "all" ? "page" : undefined}>全部书籍 <span>{totalBooks}</span></Link>
      {categories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}#catalog`} className={category.slug === categorySlug ? "is-active" : ""} aria-current={category.slug === categorySlug ? "page" : undefined}>{category.title} <span>{categoryCounts[category.slug] || 0}</span></Link>)}
    </nav>
    <div className="catalog-results-header"><h2>{query.trim() ? `“${query.trim()}”的搜索结果` : selected?.title || "全部书籍"}</h2><p role="status" aria-live="polite">{filtered.length} 本{totalPages > 1 ? ` · 第 ${currentPage} / ${totalPages} 页` : ""}</p></div>
    {filtered.length ? <>
      <div className="book-grid">{filtered.slice(offset, offset + CATALOG_PAGE_SIZE).map((book, index) => <BookCard key={book.id} book={book} priority={index < 4} />)}</div>
      <CatalogPagination currentPage={currentPage} totalBooks={filtered.length} pageSize={CATALOG_PAGE_SIZE} pageHref={(page) => catalogHref(page, { query: deferredQuery, sort }, categorySlug)} />
    </> : <div className="empty-state"><MagnifyingGlassIcon aria-hidden="true" /><h3>没有找到匹配的书籍</h3><p>试试原文书名、作者，或缩短搜索词。</p><button type="button" className="button button-secondary" onClick={reset}>清除搜索</button></div>}
  </section>;
}
