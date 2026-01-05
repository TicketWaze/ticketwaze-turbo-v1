import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Mono, DM_Sans } from "next/font/google";
import "@ticketwaze/ui/styles/globals.css";
import { NextIntlClientProvider } from "next-intl";

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
  title: "Every ticket, Every activity, One platform",
  description:
    "Buy, sell, and manage tickets for activities, experiences, and events, online or in-person, all in one secure platform.",
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
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
