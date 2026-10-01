import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import Hero from "./components/Hero";
import Footer from "@/components/Footer";
import Details1 from "./components/Details1";
import Discount from "./components/Discount";
import { JsonLd, buildBreadcrumbs } from "@/lib/structuredData";

const siteUrl = "https://ticketwaze.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return pageMetadata({
    locale,
    path: "/attendee",
    title: t("attendee.title"),
    description: t("attendee.description"),
  });
}

export default async function PersonalPage({
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
    "@id": `${siteUrl}/attendee#webpage`,
    url: `${siteUrl}${localePath}/attendee`,
    name: t("attendee.title"),
    description: t("attendee.description"),
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#webapp` },
  };
  const breadcrumbs = buildBreadcrumbs(
    [{ name: t("home"), path: "" }, { name: t("attendee.title") }],
    localePath,
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbs} />
      <Hero />
      <Details1 />
      <Discount />
      <Footer />
    </>
  );
}
