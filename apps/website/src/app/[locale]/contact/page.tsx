import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Footer from "@/components/Footer";
import Hero from "./components/Hero";
import ContactSection from "./components/ContactSection";

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
    title: t("contact.title"),
    description: t("contact.description"),
    openGraph: {
      title: `${t("contact.title")} | Ticketwaze`,
      description: t("contact.description"),
      url: `${siteUrl}${localePath}/contact`,
    },
    twitter: {
      title: `${t("contact.title")} | Ticketwaze`,
      description: t("contact.description"),
    },
    alternates: {
      canonical: `${siteUrl}${localePath}/contact`,
      languages: {
        en: `${siteUrl}/en/contact`,
        fr: `${siteUrl}/contact`,
        "x-default": `${siteUrl}/contact`,
      },
    },
  };
}

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${siteUrl}/contact#webpage`,
    url: `${siteUrl}/contact`,
    name: "Contact Ticketwaze",
    description:
      "Get in touch with the Ticketwaze support team for help, partnerships, media inquiries, or general questions.",
    isPartOf: { "@id": `${siteUrl}/#website` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <ContactSection />
      <Footer />
    </>
  );
}
