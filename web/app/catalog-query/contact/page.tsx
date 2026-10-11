import { contactMetadata, ContactContent } from "@/components/catalog-pages/contact";
import type { CatalogSearchParams } from "@/lib/catalog-search";

export const metadata = contactMetadata;
export default async function ContactQuery({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  return <ContactContent queryParams={await searchParams} />;
}
