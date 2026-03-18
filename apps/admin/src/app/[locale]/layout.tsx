import { Bricolage_Grotesque, DM_Mono, DM_Sans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "@ticketwaze/ui/styles/globals.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "sonner";
import TopLoader from "@/components/shared/TopLoader";
import AuthProvider from "@/lib/AuthProvider";

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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_ADMIN_URL ?? ""),
  title: "TicketWaze Admin Dashboard | Manage Events & Tickets",
  description:
    "Secure admin portal for managing TicketWaze activities, tickets, and platform operations.",
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
