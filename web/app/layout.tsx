import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SiteGoogleAnalytics } from "@/components/google-analytics";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, isPreviewDeployment, siteUrl } from "@/lib/site";
import "./globals.css";

const geist = localFont({
  src: "../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2",
  variable: "--font-geist", display: "swap", weight: "400",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_TITLE, template: `%s｜${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { type: "website", locale: "zh_CN", siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "书径馆藏原书封面与中文阅读导读" }] },
  // Next.js fills omitted Twitter title, description and images from each
  // page's resolved Open Graph metadata.
  twitter: { card: "summary_large_image" },
  robots: { index: !isPreviewDeployment(), follow: true, googleBot: { index: !isPreviewDeployment(), follow: true, "max-image-preview": "large" } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const measurementId = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production"
    ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() : undefined;
  if (measurementId && !/^G-[A-Z0-9]+$/.test(measurementId)) {
    throw new Error("NEXT_PUBLIC_GA_MEASUREMENT_ID must be a valid GA4 measurement ID (G-...).");
  }
  const googleTagPath = process.env.NEXT_PUBLIC_GOOGLE_TAG_PATH?.trim() || undefined;
  if (measurementId && googleTagPath && (googleTagPath.length > 100 || !/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\/?$/.test(googleTagPath))) {
    throw new Error("NEXT_PUBLIC_GOOGLE_TAG_PATH must be a reserved same-origin path such as /metrics (maximum 100 characters).");
  }
  return <html lang="zh-CN" className={geist.variable}><body>
    <a href="#main-content" className="skip-link">跳到主要内容</a>
    <Header /><main id="main-content">{children}</main><Footer />
    {measurementId && <SiteGoogleAnalytics measurementId={measurementId} productionOrigin={siteUrl()} googleTagPath={googleTagPath} />}
  </body></html>;
}
