import { CategoryContent, getCategoryMetadata } from "@/components/catalog-pages/category";
import { getCatalog } from "@/lib/catalog";

export const dynamicParams = false;
export function generateStaticParams() { return getCatalog().categories.map((category) => ({ slug: category.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return getCategoryMetadata((await params).slug);
}
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CategoryContent slug={(await params).slug} />;
}
