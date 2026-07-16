/**
 * Google Analytics 4 utilities (attendee app).
 *
 * NOTE ON sendGAEvent: @next/third-parties' `sendGAEvent` is a thin passthrough
 * to `dataLayer.push(arguments)`. It must be called with POSITIONAL gtag args:
 *   sendGAEvent('event', '<action>', { ...params })
 * Calling it with a single `{ event_name }` object (as some guides show) pushes
 * an object gtag never interprets as an event, so nothing reaches GA4.
 */

import { sendGAEvent } from "@next/third-parties/google";

// Placeholder until a real ID is set in the environment. `isAnalyticsEnabled`
// treats this exact value as "not configured", so GA stays inert.
export const GA_PLACEHOLDER_ID = "G-XXXXXXXXXX";
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || GA_PLACEHOLDER_ID;

/** GA loads only outside development and only once a real ID is configured. */
export const isAnalyticsEnabled = (): boolean =>
  process.env.NODE_ENV !== "development" &&
  Boolean(GA_MEASUREMENT_ID) &&
  GA_MEASUREMENT_ID !== GA_PLACEHOLDER_ID;

export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  label?: string;
  attribution?: Record<string, unknown>;
}

export interface GAEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, unknown>;
}

/** Reports a Core Web Vital to GA4. Consent + enablement are enforced upstream. */
export function reportWebVitals(metric: WebVitalsMetric): void {
  if (!isAnalyticsEnabled()) {
    if (process.env.NODE_ENV === "development") {
      console.info("Web Vitals (dev):", metric);
    }
    return;
  }

  if (metric.label !== "web-vital") return;

  // CLS is a unitless ratio; GA convention multiplies by 1000 to keep integers.
  const value = Math.round(
    metric.name === "CLS" ? metric.value * 1000 : metric.value,
  );

  sendGAEvent("event", "web_vitals", {
    event_category: "Web Vitals",
    event_label: metric.name,
    value,
    metric_id: metric.id,
    metric_rating: metric.rating,
    metric_delta: metric.delta,
    non_interaction: true,
  });
}

/** Sends a custom event to GA4. No-op unless analytics is enabled. */
export function trackEvent(event: GAEvent): void {
  if (!isAnalyticsEnabled()) return;

  sendGAEvent("event", event.action, {
    event_category: event.category || "engagement",
    event_label: event.label,
    value: event.value,
    ...(event.custom_parameters ?? {}),
  });
}

/** Manual page_view (pageviews are also sent automatically by GoogleAnalytics). */
export function trackPageView(url: string, title?: string): void {
  if (!isAnalyticsEnabled()) return;

  sendGAEvent("event", "page_view", {
    page_location: url,
    page_title: title || (typeof document !== "undefined" ? document.title : ""),
  });
}

/** Common interaction trackers. Extend with domain events as needed. */
export const analytics = {
  trackExternalLink: (url: string, text?: string) =>
    trackEvent({
      action: "click_external_link",
      category: "engagement",
      label: url,
      custom_parameters: { link_text: text, link_url: url },
    }),

  trackFormSubmission: (formName: string, success = true) =>
    trackEvent({
      action: "form_submission",
      category: "engagement",
      label: formName,
      value: success ? 1 : 0,
      custom_parameters: { form_name: formName, submission_success: success },
    }),

  trackSearch: (query: string, results?: number) =>
    trackEvent({
      action: "search",
      category: "engagement",
      label: query,
      value: results,
      custom_parameters: { search_term: query, search_results: results },
    }),
};
