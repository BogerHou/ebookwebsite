"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { BookCard } from "@/components/book-card";
import { CatalogPagination } from "@/components/catalog-pagination";
import { CATALOG_PAGE_SIZE, catalogHref, filterCatalog, getCatalogPage, getCatalogQuery, type CatalogQuery, type CatalogSort } from "@/lib/catalog-search";
import type { CatalogBook, Category } from "@/lib/types";

export function CatalogBrowser({ books, categories, categoryCounts, initialCategory = "all", initialPage = 1, initialQuery = "", initialSort = "recommended", preloadCount = 4 }: {
  books: CatalogBook[]; categories: Category[]; categoryCounts: Record<string, number>;
  initialCategory?: string; initialPage?: number; initialQuery?: string; initialSort?: CatalogSort; preloadCount?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState({ query: initialQuery, sort: initialSort, page: initialPage });
  const { query, sort, page } = state;
  const lastWrittenUrl = useRef<string | null>(null);
  const pendingQuery = useRef<CatalogQuery | null>(null);
  const syncTimer = useRef<number | null>(null);
  const urlKey = `${pathname}?${searchParams.toString()}`;
  useEffect(() => {
    if (urlKey === lastWrittenUrl.current) return;
    if (syncTimer.current !== null) window.clearTimeout(syncTimer.current);
    syncTimer.current = null;
    pendingQuery.current = null;
    const params = { q: searchParams.get("q") || undefined, sort: searchParams.get("sort") || undefined, page: searchParams.get("page") || undefined };
    setState({ ...getCatalogQuery(params), page: getCatalogPage(pathname, params) });
  }, [pathname, searchParams, urlKey]);
  useEffect(() => () => { if (syncTimer.current !== null) window.clearTimeout(syncTimer.current); }, []);
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => filterCatalog(books, { query: deferredQuery, sort }), [books, deferredQuery, sort]);
  const totalPages = Math.ceil(filtered.length / CATALOG_PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const offset = (currentPage - 1) * CATALOG_PAGE_SIZE;
  const categorySlug = initialCategory === "all" ? undefined : initialCategory;
  const selected = categories.find((category) => category.slug === categorySlug);
  const totalBooks = Object.values(categoryCounts).reduce((total, count) => total + count, 0);
  const searchLabel = selected ? `在${selected.title}中搜索` : "搜索书名、作者或主题";
  function flushQuery() {
    if (syncTimer.current !== null) window.clearTimeout(syncTimer.current);
    syncTimer.current = null;
    const next = pendingQuery.current;
    if (!next) return;
    pendingQuery.current = null;
    const url = new URL(catalogHref(1, next, categorySlug), window.location.href);
    lastWrittenUrl.current = `${url.pathname}?${url.searchParams.toString()}`;
    if (url.pathname + url.search + url.hash !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }
  function update(nextQuery: string, nextSort: CatalogSort, immediate = false) {
    setState({ query: nextQuery, sort: nextSort, page: 1 });
    pendingQuery.current = { query: nextQuery, sort: nextSort };
    if (syncTimer.current !== null) window.clearTimeout(syncTimer.current);
    if (immediate) flushQuery();
    else syncTimer.current = window.setTimeout(flushQuery, 250);
  }
  function reset() { update("", "recommended", true); }
  return <section className="catalog" aria-label="书籍目录" id="catalog" onClickCapture={(event) => { if (event.target instanceof Element && event.target.closest("a")) flushQuery(); }}>
    <form className="catalog-toolbar" action={categorySlug ? `/categories/${categorySlug}#catalog` : "/#catalog"} method="get" onSubmitCapture={flushQuery}>
      <div className="search-field">
        <label className="sr-only" htmlFor="book-search">{searchLabel}</label>
        <MagnifyingGlassIcon aria-hidden="true" />
        <input id="book-search" name="q" type="search" value={query} placeholder={searchLabel}
          autoComplete="off" onChange={(event) => update(event.target.value, sort)} onBlur={flushQuery} />
        {query && <button type="button" className="clear-search" onClick={() => update("", sort, true)} aria-label="清空搜索"><Cross2Icon aria-hidden="true" /></button>}
        <button type="submit" className="search-submit">搜索</button>
      </div>
      <div className="sort-field"><label htmlFor="book-sort">排序</label><select id="book-sort" name="sort" aria-label="排序" value={sort} onChange={(event) => update(query, event.target.value as CatalogSort, true)}>
        <option value="recommended">推荐排序</option><option value="title">书名顺序</option><option value="pages">页数最多</option>
      </select></div>
    </form>
    <nav className="category-filters" aria-label="书籍分类">
      <Link href="/#catalog" className={initialCategory === "all" ? "is-active" : ""} aria-current={initialCategory === "all" ? "page" : undefined}>全部书籍 <span>{totalBooks}</span></Link>
      {categories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}#catalog`} className={category.slug === categorySlug ? "is-active" : ""} aria-current={category.slug === categorySlug ? "page" : undefined}>{category.title} <span>{categoryCounts[category.slug] || 0}</span></Link>)}
    </nav>
    <div className="catalog-results-header"><h2>{query.trim() ? `“${query.trim()}”的搜索结果` : selected?.title || "全部书籍"}</h2><p role="status" aria-live="polite">{filtered.length} 本{totalPages > 1 ? ` · 第 ${currentPage} / ${totalPages} 页` : ""}</p></div>
    {filtered.length ? <>
      <div className="book-grid">{filtered.slice(offset, offset + CATALOG_PAGE_SIZE).map((book, index) => <BookCard key={book.id} book={book} priority={index < preloadCount} />)}</div>
      <CatalogPagination currentPage={currentPage} totalBooks={filtered.length} pageSize={CATALOG_PAGE_SIZE} pageHref={(page) => catalogHref(page, { query, sort }, categorySlug)} />
    </> : <div className="empty-state"><MagnifyingGlassIcon aria-hidden="true" /><h3>没有找到匹配的书籍</h3><p>试试原文书名、作者，或缩短搜索词。</p><button type="button" className="button button-secondary" onClick={reset}>清除搜索</button></div>}
  </section>;
}
