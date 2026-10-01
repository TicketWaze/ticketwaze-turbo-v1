import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import Footer from "@/components/Footer";
import Hero from "./components/Hero";
import ContactSection from "./components/ContactSection";
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
    path: "/contact",
    title: t("contact.title"),
    description: t("contact.description"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const localePath = locale === "fr" ? "" : `/${locale}`;

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
  const breadcrumbs = buildBreadcrumbs(
    [{ name: t("home"), path: "" }, { name: t("contact.title") }],
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
      <ContactSection />
      <Footer />
    </>
  );
}
