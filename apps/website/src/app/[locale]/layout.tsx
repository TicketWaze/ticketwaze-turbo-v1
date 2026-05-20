import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Mono, DM_Sans } from "next/font/google";
import "@ticketwaze/ui/styles/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "sonner";
import { getTranslations } from "next-intl/server";
import TopLoader from "@/components/TopLoader";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-primary",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500"],
});

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
    metadataBase: new URL(siteUrl),
    title: {
      template: "%s | Ticketwaze",
      default: "Ticketwaze | Every Ticket, Every Activity, One Platform",
    },
    description: t("description"),
    keywords: [
      "Ticketwaze",
      "buy tickets online",
      "sell tickets online",
      "event tickets",
      "activity tickets",
      "ticket platform",
      "event management",
      "ticket sales",
      "online event ticketing",
      "ticket management",
      "MonCash tickets",
      "billetterie en ligne",
    ],
    applicationName: "Ticketwaze",
    authors: [{ name: "Ticketwaze", url: siteUrl }],
    creator: "Ticketwaze",
    publisher: "Ticketwaze",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? "en_US" : "fr_FR",
      url: `${siteUrl}${localePath}`,
      siteName: "Ticketwaze",
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "Ticketwaze – Every Ticket, Every Activity, One Platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@ticketwaze",
      creator: "@ticketwaze",
      title: t("title"),
      description: t("description"),
      images: ["/opengraph-image.png"],
    },
    alternates: {
      canonical: `${siteUrl}${localePath}`,
      languages: {
        en: `${siteUrl}/en`,
        fr: siteUrl,
        "x-default": siteUrl,
      },
    },
    category: "technology",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  return (
    <html lang={locale}>
      <body
        className={`${bricolageGrotesque.variable} ${dmMono.variable} ${dmSans.className} bg-neutral-100 px-4 lg:px-10 p-10 flex flex-col gap-10 font-sans`}
      >
        <NextIntlClientProvider>
          <Toaster richColors position="top-right" />
          {children}
          <TopLoader />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
