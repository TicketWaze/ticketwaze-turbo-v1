import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import StripHtml from "./StripHtml";

/**
 * Metadata for a public, indexable page: canonical URL, an hreflang alternate
 * per locale, and Open Graph / Twitter cards.
 *
 * `path` is the locale-less path ("/explore/<slug>"). The canonical always
 * uses the slug the app itself links to, so a renamed activity or a
 * hand-typed slug doesn't compete with itself in search results.
 *
 * Without `image`, the cards use the app's default opengraph-image.png. It
 * has to be named explicitly: Next merges metadata shallowly, so a page that
 * sets `openGraph` at all loses the inherited image.
 */
const DEFAULT_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 600,
  alt: "Ticketwaze – events and tickets in Haiti",
};

export function publicPageMetadata({
  locale,
  path,
  title,
  description,
  image,
  type = "website",
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const url = `/${locale}${path}`;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}${path}`]),
  );
  const images = image ? [{ url: image, alt: title }] : [DEFAULT_IMAGE];
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...languages,
        "x-default": `/${routing.defaultLocale}${path}`,
      },
    },
    openGraph: {
      type,
      url,
      siteName: "Ticketwaze",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      site: "@ticketwaze",
      title,
      description,
      images: [images[0].url],
    },
  };
}

/**
 * A search-result sized description: HTML stripped, whitespace collapsed and
 * cut at a word boundary near 155 characters (Google truncates around there).
 * Falls back when the source text is empty or too short to be useful.
 */
export function snippet(html: string | null | undefined, fallback: string) {
  const text = StripHtml(html ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < 40) return fallback;
  if (text.length <= 155) return text;
  const cut = text.slice(0, 155);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
