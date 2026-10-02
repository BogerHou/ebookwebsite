import { NextResponse, type NextRequest } from "next/server";
import catalog from "./data/catalog.json";
import { CATALOG_PAGE_SIZE } from "./lib/catalog-search";

// Reject unknown dynamic catalog routes before a loading boundary streams HTTP 200.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const segment = path.split("/")[2];
  const missing = path.startsWith("/library/")
    ? !/^[1-9]\d*$/.test(segment || "") || Number(segment) > Math.ceil(catalog.books.length / CATALOG_PAGE_SIZE)
    : !catalog.categories.some((category) => category.slug === segment);
  if (missing) return NextResponse.rewrite(new URL("/404", request.url), { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  return NextResponse.next();
}

export const config = { matcher: ["/library/:page", "/categories/:slug"] };
