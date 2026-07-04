import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Details1 from "./components/Details1";
import Details2 from "./components/Details2";
import Hero from "./components/Hero";
import Footer from "@/components/Footer";
import Testimonials from "./components/Testimonials";
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
    title: t("about.title"),
    description: t("about.description"),
    openGraph: {
      title: `${t("about.title")} | Ticketwaze`,
      description: t("about.description"),
      url: `${siteUrl}${localePath}/about`,
    },
    twitter: {
      title: `${t("about.title")} | Ticketwaze`,
      description: t("about.description"),
    },
    alternates: {
      canonical: `${siteUrl}${localePath}/about`,
      languages: {
        en: `${siteUrl}/en/about`,
        fr: `${siteUrl}/about`,
        "x-default": `${siteUrl}/about`,
      },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const localePath = locale === "fr" ? "" : `/${locale}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${siteUrl}/about#webpage`,
    url: `${siteUrl}/about`,
    name: "About Ticketwaze",
    description:
      "Ticketwaze was created to remove unnecessary friction from how access is bought and sold — bringing payments, tickets, and management into one simple, reliable platform.",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
  };
  const breadcrumbs = buildBreadcrumbs(
    [{ name: t("home"), path: "" }, { name: t("about.title") }],
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
      <Details1 />
      <Details2 />
      <Testimonials />
      <Footer />
    </>
  );
}
