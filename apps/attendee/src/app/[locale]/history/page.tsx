import SignedOutState from "@/components/SignedOutState";
import HistoryPageContent, { HistoryItem } from "./HistoryPageContent";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { Event } from "@ticketwaze/typescript-config";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";

// A past event carries the signed-in user's own rating (0 when not rated).
type PastEvent = Event & { userRating: number };

// How many days ago the activity took place, based on its last day in its own
// timezone. Clamped at 0 so a same-day event reads as "0 days ago".
function daysAgo(event: Event): number {
  const days = [...(event.eventDays ?? [])].sort(
    (a, b) => b.dayNumber - a.dayNumber,
  );
  const last = days[0];
  if (!last) return 0;
  const eventDate = DateTime.fromISO(String(last.eventDate), { zone: "utc" })
    .setZone(last.timezone, { keepLocalTime: true })
    .startOf("day");
  if (!eventDate.isValid) return 0;
  const diff = Math.floor(
    DateTime.now().setZone(last.timezone).startOf("day").diff(eventDate, "days")
      .days,
  );
  return diff > 0 ? diff : 0;
}

export default async function HistoryPage() {
  const locale = await getLocale();
  const session = await auth();
  const t = await getTranslations("History");
  if (!session) {
    return (
      <AttendeeLayout title={t("title")}>
        <SignedOutState page="history" title={t("title")} />
      </AttendeeLayout>
    );
  }

  // Authenticated, per-user request — never cache. Guard every failure path so
  // the page renders an empty state instead of crashing.
  let events: PastEvent[] = [];
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/history`,
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
    if (request.ok && Array.isArray(response?.events)) {
      events = response.events;
    } else {
      console.error("Failed to load history events:", response);
    }
  } catch (error) {
    console.error("Error fetching history events:", error);
  }

  const items: HistoryItem[] = events
    .map((event) => ({
      eventId: event.eventId,
      eventName: event.eventName,
      eventImageUrl: event.eventImageUrl,
      daysAgo: daysAgo(event),
      rating: event.userRating ?? 0,
    }))
    // Most recent first, as in Figma.
    .sort((a, b) => a.daysAgo - b.daysAgo);

  return (
    <AttendeeLayout title={t("title")} className="overflow-x-hidden">
      <HistoryPageContent items={items} />
    </AttendeeLayout>
  );
}
