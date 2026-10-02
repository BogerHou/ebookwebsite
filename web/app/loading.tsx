export default function Loading() {
  return <div className="container loading-page" aria-label="书目正在加载" aria-busy="true"><div className="skeleton skeleton-heading" /><div className="skeleton skeleton-search" /><div className="book-grid">{[1, 2, 3, 4].map((n) => <div className="skeleton-book" key={n}><div className="skeleton skeleton-cover" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></div>)}</div></div>;
}
