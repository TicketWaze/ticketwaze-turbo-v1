import type { Metadata } from "next";
import { siteUrl } from "./structuredData";

/**
 * The link-preview image for every page (WhatsApp, Facebook, X, LinkedIn,
 * iMessage…). Served by the app/opengraph-image.png file convention.
 */
export const OG_IMAGE = {
  url: `${siteUrl}/opengraph-image.png`,
  width: 1200,
  height: 600,
  alt: "Ticketwaze – event tickets, concerts and activities in Haiti",
};

/**
 * Metadata for a marketing page: title, description, canonical, hreflang and
 * Open Graph / Twitter cards with the preview image.
 *
 * Next merges metadata shallowly, so a page that sets `openGraph` replaces the
 * layout's whole `openGraph` object — images included. Building every page's
 * cards here is what guarantees each shared link keeps its preview image.
 *
 * French is the default locale and has no prefix ("/about"); English lives
 * under "/en". `path` is the locale-less path, "" for the home page.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  /** Use the title as-is instead of appending " | Ticketwaze". */
  absoluteTitle?: boolean;
}): Metadata {
  const localePath = locale === "fr" ? "" : `/${locale}`;
  const url = `${siteUrl}${localePath}${path}`;
  const fullTitle = absoluteTitle ? title : `${title} | Ticketwaze`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: {
        fr: `${siteUrl}${path}`,
        en: `${siteUrl}/en${path}`,
        "x-default": `${siteUrl}${path}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Ticketwaze",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? "en_US" : "fr_FR",
      url,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      site: "@ticketwaze",
      creator: "@ticketwaze",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
