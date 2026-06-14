import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import SupportChatContent, { type SupportThread } from "./SupportChatContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SupportChat" });
  return {
    title: t("title"),
    robots: { index: false, follow: false },
  };
}

export default async function SupportChatPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { token, locale } = await params;

  let thread: SupportThread | null = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/support/chat/${token}`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          origin: process.env.NEXT_PUBLIC_WEBSITE_URL ?? "",
          "Accept-Language": locale,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      thread = data.thread;
    }
  } catch {
    // network error — thread stays null, error state renders
  }

  return <SupportChatContent token={token} initialThread={thread} />;
}
