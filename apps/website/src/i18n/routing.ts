import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "fr"],

  // Used when no locale matches
  defaultLocale: "fr",

  // Serve the default locale (fr) at unprefixed URLs (ticketwaze.com/about)
  // instead of redirecting to /fr/about. The sitemap, canonicals, and
  // hreflang alternates all declare the unprefixed URLs as the French
  // canonical, so redirecting them caused Search Console's
  // "Page with redirect" indexing errors.
  localePrefix: "as-needed",

  // Don't auto-redirect based on Accept-Language/cookie: crawlers must get
  // a stable 200 at the canonical URL. Users switch language explicitly.
  localeDetection: false,
});
