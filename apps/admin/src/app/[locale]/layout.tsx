import ClientErrorReporter from "@/components/ClientErrorReporter";
import { bricolageGrotesque, dmMono, dmSans } from "@ticketwaze/ui/fonts";
import type { Metadata, Viewport } from "next";
import "@ticketwaze/ui/styles/globals.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "sonner";
import TopLoader from "@/components/shared/TopLoader";
import AuthProvider from "@/lib/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_ADMIN_URL ?? ""),
  title: "Ticketwaze Admin Dashboard | Manage Events & Tickets",
  description:
    "Secure admin portal for managing Ticketwaze activities, tickets, and platform operations.",
};
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
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${bricolageGrotesque.variable} ${dmMono.variable} ${dmSans.className} `}
      >
        <ClientErrorReporter />
        <NextIntlClientProvider>
          <AuthProvider>
            {/* <OrganisationProvider/> */}
            {children}
          </AuthProvider>
          <Toaster richColors position="top-right" />
          <TopLoader />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
