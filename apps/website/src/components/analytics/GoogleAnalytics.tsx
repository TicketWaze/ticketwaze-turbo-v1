"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { GA_MEASUREMENT_ID, isAnalyticsEnabled } from "@/lib/analytics";
import { useConsent } from "./ConsentProvider";

/**
 * Mounts GA4 only when it is both configured (prod + real ID) and the visitor
 * has granted consent. Until then this returns null, so the gtag.js script is
 * never injected and no request is made to Google — "reject" means no data.
 */
export default function GoogleAnalytics() {
  const { consent } = useConsent();
  if (!isAnalyticsEnabled() || consent !== "granted") return null;
  return <NextGoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
