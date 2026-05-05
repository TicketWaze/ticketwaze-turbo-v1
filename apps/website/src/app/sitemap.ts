import type { MetadataRoute } from "next";

const siteUrl = "https://ticketwaze.com";

const pages = [
  { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/attendee", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/business", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/legals", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/waitlist", changeFrequency: "monthly" as const, priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return pages.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        fr: `${siteUrl}${path}`,
        en: `${siteUrl}/en${path}`,
      },
    },
  }));
}
