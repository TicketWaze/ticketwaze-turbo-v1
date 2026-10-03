import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_ATTENDEE_URL ?? "";

/**
 * Public discovery pages (explore, events, raffles, sales, restaurants) are
 * crawlable. Account, organisation, checkout and personal pages are not:
 * they need a login or a purchase, so a crawler only ever sees a redirect or
 * an empty shell there, and they would waste crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
    "/auth/",
    "/profile",
    "/settings",
    "/preferences",
    "/wallet",
    "/purchases",
    "/history",
    "/upcoming",
    "/organisations",
    "/explore/checkout",
    "/explore/liked",
    "/explore/reservations",
  ];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          ...privatePaths.map((path) => `/*${path}`),
          // Per-activity checkout steps, e.g. /fr/explore/<slug>/checkout.
          "/*/checkout",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
