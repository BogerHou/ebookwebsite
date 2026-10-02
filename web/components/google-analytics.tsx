"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics, sendGAEvent } from "@next/third-parties/google";

let analyticsOrigin: string | undefined;

/** Mount only on the production origin, even when a production build is run locally. */
export function SiteGoogleAnalytics({ measurementId, productionOrigin }: {
  measurementId: string; productionOrigin: string;
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
  return enabled ? <GoogleAnalytics gaId={measurementId} /> : null;
}

/** Analytics must never receive the resource response, cloud URL or extraction code. */
export function trackResourceClaim(bookId: string) {
  if (typeof window === "undefined" || window.location.origin !== analyticsOrigin || !window.dataLayer) return;
  try {
    sendGAEvent("event", "resource_claim", { book_id: bookId });
  } catch {
    // A blocked or unavailable analytics script must not interfere with claiming a book.
  }
}
