import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { getGuides } from "@/lib/editorial";
import { absoluteUrl } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const catalog = getCatalog();
  const updatedAt = new Date(catalog.updatedAt);
  const lastModified = Number.isNaN(updatedAt.getTime()) ? undefined : updatedAt;
  const libraryPages = Array.from({ length: Math.max(0, Math.ceil(catalog.books.length / 24) - 1) }, (_, index) => `/library/${index + 2}`);
  return ["/", "/categories", "/about", "/guides", ...libraryPages, ...getGuides().map((guide) => `/guides/${guide.slug}`), ...catalog.categories.map((c) => `/categories/${c.slug}`), ...catalog.books.map((b) => `/books/${b.slug}`)].map((path) => ({ url: absoluteUrl(path), lastModified }));
}
