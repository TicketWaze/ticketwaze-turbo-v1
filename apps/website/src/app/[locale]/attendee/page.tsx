import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Hero from "./components/Hero";
import Footer from "@/components/Footer";
import Details1 from "./components/Details1";
import Discount from "./components/Discount";

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
    title: t("attendee.title"),
    description: t("attendee.description"),
    openGraph: {
      title: `${t("attendee.title")} | TicketWaze`,
      description: t("attendee.description"),
      url: `${siteUrl}${localePath}/attendee`,
    },
    twitter: {
      title: `${t("attendee.title")} | TicketWaze`,
      description: t("attendee.description"),
    },
    alternates: {
      canonical: `${siteUrl}${localePath}/attendee`,
      languages: {
        en: `${siteUrl}/en/attendee`,
        fr: `${siteUrl}/attendee`,
        "x-default": `${siteUrl}/attendee`,
      },
    },
  };
}

export default function PersonalPage() {
  return (
    <>
      <Hero />
      <Details1 />
      <Discount />
      <Footer />
    </>
  );
}
