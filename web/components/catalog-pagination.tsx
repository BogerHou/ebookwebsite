import Link from "next/link";
import type { ComponentProps } from "react";

function PaginationLink({ href, ...props }: { href: string } & Omit<ComponentProps<"a">, "href">) {
  // Query rewrites must reach the server instead of reusing a cached static route.
  return href.split("#", 1)[0].includes("?")
    ? <a href={href} {...props} />
    : <Link href={href} prefetch={false} {...props} />;
}

export function CatalogPagination({ currentPage = 1, totalBooks, pageSize = 24, pageHref }: {
  currentPage?: number; totalBooks: number; pageSize?: number; pageHref?: (page: number) => string;
}) {
  const totalPages = Math.ceil(totalBooks / pageSize);
  if (totalPages < 2) return null;
  const href = pageHref || ((page: number) => page === 1 ? "/#catalog" : `/library/${page}#catalog`);
  return <nav className="catalog-pagination" aria-label="书籍目录分页">
    <p>第 {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalBooks)} 本，共 {totalBooks} 本</p>
    <div className="page-links">
      {currentPage > 1 && <PaginationLink href={href(currentPage - 1)} className="pagination-previous">上一页</PaginationLink>}
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => page === currentPage
        ? <span key={page} className="page-number current" aria-current="page" aria-label={`第 ${page} 页，当前页`}>{page}</span>
        : <PaginationLink key={page} href={href(page)} className="page-number" aria-label={`第 ${page} 页`}>{page}</PaginationLink>)}
      {currentPage < totalPages && <PaginationLink href={href(currentPage + 1)} className="pagination-next">下一页</PaginationLink>}
    </div>
  </nav>;
}
