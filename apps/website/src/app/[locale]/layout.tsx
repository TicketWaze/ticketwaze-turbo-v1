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
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  return (
    <html lang={locale}>
      <body
        className={`${bricolageGrotesque.variable} ${dmMono.variable} ${dmSans.className} bg-neutral-100 px-4 lg:px-[2.5rem] p-[2.5rem] flex flex-col gap-[2.5rem] font-sans`}
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
