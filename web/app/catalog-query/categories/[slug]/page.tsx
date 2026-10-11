import { CategoryContent, getCategoryMetadata } from "@/components/catalog-pages/category";
import type { CatalogSearchParams } from "@/lib/catalog-search";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };
export async function generateMetadata({ params, searchParams }: Props) {
  return getCategoryMetadata((await params).slug, await searchParams);
}
export default async function CategoryQuery({ params, searchParams }: Props) {
  return <CategoryContent slug={(await params).slug} queryParams={await searchParams} />;
}
