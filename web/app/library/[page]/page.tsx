import { getLibraryMetadata, LibraryContent } from "@/components/catalog-pages/library";
import { getCatalog } from "@/lib/catalog";
import { CATALOG_PAGE_SIZE } from "@/lib/catalog-search";

export const dynamicParams = false;
export function generateStaticParams() {
  return Array.from({ length: Math.ceil(getCatalog().books.length / CATALOG_PAGE_SIZE) }, (_, index) => ({ page: String(index + 1) }));
}
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  return getLibraryMetadata((await params).page);
}
export default async function LibraryPage({ params }: { params: Promise<{ page: string }> }) {
  return <LibraryContent page={(await params).page} />;
}
