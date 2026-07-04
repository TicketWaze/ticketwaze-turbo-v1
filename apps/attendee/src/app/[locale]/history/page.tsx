import HistoryCard from "@/components/HistoryCard";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { Event } from "@ticketwaze/typescript-config";
import { DateTime } from "luxon";
import { Calendar2 } from "iconsax-reactjs";
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
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }
  const t = await getTranslations("History");

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

  return (
    <AttendeeLayout title="HistoryPage" className="overflow-x-hidden">
      <>
        <header className="w-full flex items-center justify-between">
          <div className="flex flex-col gap-2">
            {session?.user && (
              <span className="text-[1.6rem] leading-8 text-neutral-600">
                {t("subtitle")}{" "}
                <span className="text-deep-100">{session?.user.firstName}</span>
              </span>
            )}
            <span className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-10 lg:leading-12 text-black">
              {t("title")}
            </span>
          </div>
        </header>

        {/* main */}
        {events.length > 0 ? (
          <div className="pt-4 overflow-y-scroll flex flex-col gap-8">
            <ul className="list">
              {events.map((event) => (
                <li key={event.eventId}>
                  <HistoryCard
                    href={`history/${event.eventId}`}
                    image={event.eventImageUrl}
                    name={event.eventName}
                    day={daysAgo(event)}
                    rated={event.userRating ?? 0}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="w-132 lg:w-184 mx-auto h-full justify-center flex flex-col items-center gap-20">
            <div className="w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100">
              <div className="w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200">
                <Calendar2 size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <div className={"flex flex-col gap-12 items-center text-center"}>
              <p className="text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]">
                {t("description")}
              </p>
            </div>
          </div>
        )}
      </>
    </AttendeeLayout>
  );
}
