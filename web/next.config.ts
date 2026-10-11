import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  images: { unoptimized: true },
  outputFileTracingIncludes: {
    "/api/resources/*": ["./data/resource-links.json"],
  },
  async redirects() {
    return [{ source: "/library/1", destination: "/", permanent: true }];
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
