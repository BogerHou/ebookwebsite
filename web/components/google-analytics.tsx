"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

let analyticsOrigin: string | undefined;

/** Mount only on the production origin, even when a production build is run locally. */
export function SiteGoogleAnalytics({ measurementId, productionOrigin, googleTagPath }: {
  measurementId: string; productionOrigin: string; googleTagPath?: string;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const onProductionSite = window.location.origin === productionOrigin;
    analyticsOrigin = onProductionSite ? productionOrigin : undefined;
    setEnabled(onProductionSite);
    return () => { analyticsOrigin = undefined; };
  }, [productionOrigin]);

  // GA's initial page_view and enhanced browser-history measurement cover both
  // full page loads and App Router navigation. Do not send manual page_view events.
  if (!enabled) return null;
  // Google tag gateway serves gtag.js directly at the reserved path's root.
  // Cloudflare's automatic tag setup must be disabled when this code owns setup.
  const scriptUrl = googleTagPath
    ? `${googleTagPath.replace(/\/$/, "")}/`
    : `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  return <>
    <Script id="ebooknest-ga-init" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `}</Script>
    <Script id="ebooknest-ga" strategy="afterInteractive" src={scriptUrl} />
  </>;
}

/** Analytics must never receive the resource response, cloud URL or extraction code. */
export function trackResourceClaim(bookId: string) {
  if (typeof window === "undefined" || window.location.origin !== analyticsOrigin || !window.gtag) return;
  try {
    window.gtag("event", "resource_claim", { book_id: bookId });
  } catch {
    // A blocked or unavailable analytics script must not interfere with claiming a book.
  }
}
