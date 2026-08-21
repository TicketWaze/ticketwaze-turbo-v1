import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Details from "./components/Details";
import Hero from "./components/Hero";
import Kit from "./components/Kit";
import Footer from "@/components/Footer";
import { JsonLd, buildBreadcrumbs } from "@/lib/structuredData";

const siteUrl = "https://ticketwaze.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const localePath = locale === "fr" ? "" : `/${locale}`;

  return {
    title: t("mediaKit.title"),
    description: t("mediaKit.description"),
    openGraph: {
      title: `${t("mediaKit.title")} | Ticketwaze`,
      description: t("mediaKit.description"),
      url: `${siteUrl}${localePath}/media-kit`,
    },
    twitter: {
      title: `${t("mediaKit.title")} | Ticketwaze`,
      description: t("mediaKit.description"),
    },
    alternates: {
      canonical: `${siteUrl}${localePath}/media-kit`,
      languages: {
        en: `${siteUrl}/en/media-kit`,
        fr: `${siteUrl}/media-kit`,
        "x-default": `${siteUrl}/media-kit`,
      },
    },
  };
}

export default async function MediaKitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const localePath = locale === "fr" ? "" : `/${locale}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/media-kit#webpage`,
    url: `${siteUrl}/media-kit`,
    name: "Ticketwaze Media Kit",
    description:
      "Download the official Ticketwaze logos, colours, typography, and product screenshots, with the rules for using them in press coverage, partnerships, and announcements.",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
  };
  const breadcrumbs = buildBreadcrumbs(
    [{ name: t("home"), path: "" }, { name: t("mediaKit.title") }],
    localePath,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JsonLd data={breadcrumbs} />
      <Hero />
      <Details />
      <Kit />
      <Footer />
    </>
  );
}
