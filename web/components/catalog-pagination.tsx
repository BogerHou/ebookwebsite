import Link from "next/link";

export function CatalogPagination({ currentPage = 1, totalBooks, pageSize = 24, pageHref }: {
  currentPage?: number; totalBooks: number; pageSize?: number; pageHref?: (page: number) => string;
}) {
  const totalPages = Math.ceil(totalBooks / pageSize);
  if (totalPages < 2) return null;
  const href = pageHref || ((page: number) => page === 1 ? "/#catalog" : `/library/${page}#catalog`);
  return <nav className="catalog-pagination" aria-label="书籍目录分页">
    <p>第 {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalBooks)} 本，共 {totalBooks} 本</p>
    <div className="page-links">
      {currentPage > 1 && <Link href={href(currentPage - 1)} className="pagination-previous">上一页</Link>}
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => page === currentPage
        ? <span key={page} className="page-number current" aria-current="page" aria-label={`第 ${page} 页，当前页`}>{page}</span>
        : <Link key={page} href={href(page)} className="page-number" aria-label={`第 ${page} 页`}>{page}</Link>)}
      {currentPage < totalPages && <Link href={href(currentPage + 1)} className="pagination-next">下一页</Link>}
    </div>
  </nav>;
}
