/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import SignedOutState from "@/components/SignedOutState";
import { redirect } from "@/i18n/navigation";
import HistoryEventContent from "./HistoryEventContent";

export default async function HistoryEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const locale = await getLocale();
  const session = await auth();
  if (!session) {
    // Same signed-out screen as the History list; signing in comes back here.
    const t = await getTranslations("History");
    return (
      <AttendeeLayout title={t("title")}>
        <SignedOutState
          page="history"
          title={t("title")}
          returnPath={`/history/${eventId}`}
        />
      </AttendeeLayout>
    );
  }

  // Per-user, never cached. On any failure fall back to the history list rather
  // than rendering a broken detail page.
  let event: any = null;
  let review: { rating: number; reviewText: string } | null = null;
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/history/${eventId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        cache: "no-store",
      },
    );
    const response = await request.json();
    if (request.ok && response?.status === "success" && response.event) {
      event = response.event;
      review = response.review ?? null;
    }
  } catch (error) {
    console.error("Error fetching history event:", error);
  }

  if (!event) {
    redirect({ href: "/history", locale });
  }

  return <HistoryEventContent event={event} review={review} />;
}
