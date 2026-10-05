import ClientErrorReporter from "@/components/ClientErrorReporter";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Mono, DM_Sans } from "next/font/google";
import SectionIntlProvider from "@/components/i18n/SectionIntlProvider";
import { Toaster } from "sonner";
import { getTranslations } from "next-intl/server";
import TopLoader from "@/components/shared/TopLoader";
import AuthProvider from "@/lib/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import "@ticketwaze/ui/styles/globals.css";
import { ConsentProvider } from "@/components/analytics/ConsentProvider";
import ConsentModeScript from "@/components/analytics/ConsentModeScript";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { WebVitals } from "@/components/analytics/WebVitals";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-primary",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500"],
  // Used in a handful of places: fetched when a page actually shows it, not
  // preloaded (three files) on every first visit.
  preload: false,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("title"),
    description: t("description"),
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
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${bricolageGrotesque.variable} ${dmMono.variable} ${dmSans.className} antialiased`}
      >
        <ClientErrorReporter />
        {/* Consent Mode defaults — Next hoists beforeInteractive to <head> */}
        <ConsentModeScript />
        {/* Only what this shell's client parts use: each section's layout
            provides its own messages (see SectionIntlProvider). */}
        <SectionIntlProvider namespaces={["Consent"]}>
          <ConsentProvider>
            <Toaster richColors position="top-right" />
            <AuthProvider>{children}</AuthProvider>
            <TopLoader />
            {/* Analytics loads after hydration and only once consent is granted */}
            <GoogleAnalytics />
            <WebVitals />
            <CookieConsentBanner />
          </ConsentProvider>
        </SectionIntlProvider>
        <Analytics />
      </body>
    </html>
  );
}
