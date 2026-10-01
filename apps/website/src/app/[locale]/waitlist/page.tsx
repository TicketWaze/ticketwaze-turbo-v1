import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import Footer from "@/components/Footer";
import Hero from "./components/Hero";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return pageMetadata({
    locale,
    path: "/waitlist",
    title: t("waitlist.title"),
    description: t("waitlist.description"),
  });
}

export default function WaitlistPage() {
  return (
    <>
      <Hero />
      <Footer />
    </>
  );
}
