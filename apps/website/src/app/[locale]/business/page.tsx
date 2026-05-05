import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Hero from "./components/Hero";
import Footer from "@/components/Footer";
import Details1 from "./components/Details1";
import Pricing from "./components/Pricing";

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
    title: t("business.title"),
    description: t("business.description"),
    openGraph: {
      title: `${t("business.title")} | TicketWaze`,
      description: t("business.description"),
      url: `${siteUrl}${localePath}/business`,
    },
    twitter: {
      title: `${t("business.title")} | TicketWaze`,
      description: t("business.description"),
    },
    alternates: {
      canonical: `${siteUrl}${localePath}/business`,
      languages: {
        en: `${siteUrl}/en/business`,
        fr: `${siteUrl}/business`,
        "x-default": `${siteUrl}/business`,
      },
    },
  };
}

export default function BusinessPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TicketWaze for Business",
    applicationCategory: "BusinessApplication",
    url: `${siteUrl}/business`,
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "Basic analytics, up to 3 team members, up to 100 free tickets",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "9.99",
        priceCurrency: "USD",
        description: "Advanced analytics, up to 7 team members, up to 300 free tickets",
      },
      {
        "@type": "Offer",
        name: "Premium",
        price: "19.99",
        priceCurrency: "USD",
        description: "AI-powered analytics, up to 15 team members, unlimited free tickets",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Details1 />
      <Pricing />
      <Footer />
    </>
  );
}
