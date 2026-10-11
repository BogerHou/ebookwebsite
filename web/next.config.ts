import type { NextConfig } from "next";
import catalog from "./data/catalog.json";

const config: NextConfig = {
  poweredByHeader: false,
  images: { unoptimized: true },
  outputFileTracingIncludes: {
    "/api/resources/*": ["./data/resource-links.json"],
  },
  async redirects() {
    return [
      { source: "/library/1", destination: "/", permanent: true },
      { source: "/catalog-query/home", destination: "/", permanent: false },
      { source: "/catalog-query/categories/:slug", destination: "/categories/:slug", permanent: false },
      { source: "/catalog-query/library/:page", destination: "/library/:page", permanent: false },
      { source: "/catalog-query/contact", destination: "/contact", permanent: false },
    ];
  },
  async rewrites() {
    // Query-dependent responses use a separate function; canonical catalog paths remain prerendered.
    const categoryPattern = catalog.categories.map((category) => category.slug).join("|");
    const pagePattern = Array.from({ length: Math.ceil(catalog.books.length / 24) }, (_, index) => String(index + 1)).join("|");
    const routes = [
      { source: "/", destination: "/catalog-query/home", keys: ["q", "sort", "page"] },
      { source: `/categories/:slug(${categoryPattern})`, destination: "/catalog-query/categories/:slug", keys: ["q", "sort", "page"] },
      { source: `/library/:page(${pagePattern})`, destination: "/catalog-query/library/:page", keys: ["q", "sort", "page"] },
      { source: "/contact", destination: "/catalog-query/contact", keys: ["book", "topic"] },
    ];
    return {
      beforeFiles: routes.flatMap(({ source, destination, keys }) => keys.map((key) => ({ source, destination, has: [{ type: "query" as const, key }] }))),
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [{ source: "/books/responsive/:path*", headers: [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ] }, { source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ] }];
  },
};
export default config;
