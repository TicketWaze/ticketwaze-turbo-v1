import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import HeroSection from "./components/Hero";
import Details1 from "./components/Details1";
import Details2 from "./components/Details2";
import Details3 from "./components/Details3";
import FrequentlyAskedQuestions from "./components/FrequentlyAskedQuestions";
import Footer from "@/components/Footer";

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
    title: { absolute: t("title") },
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${siteUrl}${localePath}`,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
    alternates: {
      canonical: `${siteUrl}${localePath}`,
      languages: {
        en: `${siteUrl}/en`,
        fr: siteUrl,
        "x-default": siteUrl,
      },
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const localePath = locale === "fr" ? "" : `/${locale}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "TicketWaze",
        description:
          "Buy, sell, and manage tickets for activities, experiences, and events, online or in-person, all in one secure platform.",
        inLanguage: ["en", "fr"],
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "TicketWaze",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/opengraph-image.png`,
          width: 1200,
          height: 630,
        },
        description:
          "Buy, sell, and manage tickets for activities, experiences, and events, online or in-person, all in one secure platform.",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          url: `${siteUrl}${localePath}/contact`,
        },
        sameAs: ["https://twitter.com/ticketwaze"],
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        name: "TicketWaze",
        url: siteUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free plan available",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <Details1 />
      <Details2 />
      <Details3 />
      <FrequentlyAskedQuestions />
      <Footer />
    </>
  );
}
