import ClientErrorReporter from "@/components/ClientErrorReporter";
import type { Metadata, Viewport } from "next";
import { bricolageGrotesque, dmMono, dmSans } from "@ticketwaze/ui/fonts";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import "@ticketwaze/ui/styles/globals.css";

const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_URL;

export const metadata: Metadata = {
  // `new URL("")` throws while the build collects page data, so a missing
  // env var used to fail the whole deploy over a metadata base.
  metadataBase: paymentUrl ? new URL(paymentUrl) : undefined,
  title: "Ticketwaze - Secure Payment",
  description: "Secure payment processing for Ticketwaze events.",
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
        className={`${bricolageGrotesque.variable} ${dmMono.variable} ${dmSans.className} antialiased`}
      >
        <ClientErrorReporter />
        <NextIntlClientProvider>
          {children}
          <Toaster richColors position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
