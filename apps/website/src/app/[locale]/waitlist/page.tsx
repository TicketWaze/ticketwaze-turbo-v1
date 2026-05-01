import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Footer from "@/components/Footer";
import Hero from "./components/Hero";

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
    title: t("waitlist.title"),
    description: t("waitlist.description"),
    openGraph: {
      title: `${t("waitlist.title")} | TicketWaze`,
      description: t("waitlist.description"),
      url: `${siteUrl}${localePath}/waitlist`,
    },
    twitter: {
      title: `${t("waitlist.title")} | TicketWaze`,
      description: t("waitlist.description"),
    },
    alternates: {
      canonical: `${siteUrl}${localePath}/waitlist`,
      languages: {
        en: `${siteUrl}/en/waitlist`,
        fr: `${siteUrl}/waitlist`,
        "x-default": `${siteUrl}/waitlist`,
      },
    },
  };
}

export default function WaitlistPage() {
  return (
    <>
      <Hero />
      <Footer />
    </>
  );
}
