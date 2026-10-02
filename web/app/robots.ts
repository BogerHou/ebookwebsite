import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  // Preview pages carry noindex metadata. Keep assets crawlable so a crawler can
  // read that directive; robots.txt does not itself control indexing.
  return { rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: absoluteUrl("/sitemap.xml") };
}
