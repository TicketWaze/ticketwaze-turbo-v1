import type { MetadataRoute } from "next";

const siteUrl = "https://ticketwaze.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Not /_next/: Google needs the CSS, JS and optimised images served
        // from there to render the pages it ranks.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
