import { getLibraryMetadata, LibraryContent } from "@/components/catalog-pages/library";
import type { CatalogSearchParams } from "@/lib/catalog-search";

type Props = { params: Promise<{ page: string }>; searchParams: Promise<CatalogSearchParams> };
export async function generateMetadata({ params, searchParams }: Props) {
  return getLibraryMetadata((await params).page, await searchParams);
}
export default async function LibraryQuery({ params, searchParams }: Props) {
  return <LibraryContent page={(await params).page} queryParams={await searchParams} />;
}
