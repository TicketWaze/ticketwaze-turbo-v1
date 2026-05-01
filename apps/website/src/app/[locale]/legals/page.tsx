import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Footer from "@/components/Footer";
import Hero from "./components/Hero";
import TermsSections from "./components/TermsSections";

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
    title: t("legals.title"),
    description: t("legals.description"),
    openGraph: {
      title: `${t("legals.title")} | TicketWaze`,
      description: t("legals.description"),
      url: `${siteUrl}${localePath}/legals`,
    },
    twitter: {
      title: `${t("legals.title")} | TicketWaze`,
      description: t("legals.description"),
    },
    alternates: {
      canonical: `${siteUrl}${localePath}/legals`,
      languages: {
        en: `${siteUrl}/en/legals`,
        fr: `${siteUrl}/legals`,
        "x-default": `${siteUrl}/legals`,
      },
    },
  };
}

export default function LegalPage() {
  return (
    <>
      <Hero />
      <TermsSections />
      <Footer />
    </>
  );
}
