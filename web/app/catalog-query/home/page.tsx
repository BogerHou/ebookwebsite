import { getHomeMetadata, HomeContent } from "@/components/catalog-pages/home";
import type { CatalogSearchParams } from "@/lib/catalog-search";

export async function generateMetadata({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return getHomeMetadata(await searchParams);
}
export default async function HomeQuery({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return <HomeContent queryParams={await searchParams} />;
}
