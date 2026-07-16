"use client";

import { useReportWebVitals } from "next/web-vitals";
import { reportWebVitals, isAnalyticsEnabled } from "@/lib/analytics";
import { useConsent } from "./ConsentProvider";

/**
 * Reports Core Web Vitals to GA4. Gated on consent (it sends data to Google),
 * so it stays inert until the visitor accepts. Hooks must run unconditionally,
 * so the consent check lives inside the callback rather than around the hook.
 */
export function WebVitals() {
  const { consent } = useConsent();
  useReportWebVitals((metric) => {
    if (!isAnalyticsEnabled() || consent !== "granted") return;
    reportWebVitals(metric);
  });
  return null;
}
