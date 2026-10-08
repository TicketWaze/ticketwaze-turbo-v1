import ClientErrorReporter from "@/components/ClientErrorReporter";
import { bricolageGrotesque, dmMono, dmSans } from "@ticketwaze/ui/fonts";
import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";
import "@ticketwaze/ui/styles/globals.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import AuthProvider from "@/lib/AuthProvider";
import { Toaster } from "sonner";
import TopLoader from "@/components/shared/TopLoader";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd, buildSiteJsonLd } from "@/lib/structuredData";
import { ConsentProvider } from "@/components/analytics/ConsentProvider";
import ConsentModeScript from "@/components/analytics/ConsentModeScript";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { WebVitals } from "@/components/analytics/WebVitals";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";

/**
 * Site-wide defaults. Pages override title and description; the template
 * brands every page title ("Event name | Ticketwaze"), and the Open Graph and
 * Twitter defaults keep a large preview card on any shared link. The image
 * itself comes from the sibling opengraph-image.png file convention.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_ATTENDEE_URL ?? ""),
    title: { default: t("siteTitle"), template: "%s | Ticketwaze" },
    description: t("siteDescription"),
    applicationName: "Ticketwaze",
    keywords: [
      "Ticketwaze",
      "events Haiti",
      "tickets Haiti",
      "concerts Haiti",
      "événements Haïti",
      "billets Haïti",
      "billetterie en ligne",
      "Port-au-Prince",
      "Cap-Haïtien",
      "MonCash",
    ],
    openGraph: {
      type: "website",
      siteName: "Ticketwaze",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      title: t("siteTitle"),
      description: t("siteDescription"),
    },
    twitter: {
      card: "summary_large_image",
      site: "@ticketwaze",
      title: t("siteTitle"),
      description: t("siteDescription"),
    },
  };
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${bricolageGrotesque.variable} ${dmMono.variable} ${dmSans.className} `}
      >
        <ClientErrorReporter />
        {/* Consent Mode defaults — Next hoists beforeInteractive to <head> */}
        <ConsentModeScript />
        <JsonLd data={buildSiteJsonLd(locale)} />
        <NextIntlClientProvider>
          <ConsentProvider>
            <AuthProvider>
              {/* <OrganisationProvider/> */}
              {children}
            </AuthProvider>
            <Toaster richColors position="top-right" />
            <TopLoader />
            {/* Analytics loads after hydration and only once consent is granted */}
            <GoogleAnalytics />
            <WebVitals />
            <CookieConsentBanner />
          </ConsentProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
