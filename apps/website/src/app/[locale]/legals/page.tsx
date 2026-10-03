import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import Footer from "@/components/Footer";
import Hero from "./components/Hero";
import TermsSections from "./components/TermsSections";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return pageMetadata({
    locale,
    path: "/legals",
    title: t("legals.title"),
    description: t("legals.description"),
  });
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
