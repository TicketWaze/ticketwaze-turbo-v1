"use client";
import { DateTime } from "luxon";
import { Money3 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Event } from "@ticketwaze/typescript-config";
import EventCard from "@/components/shared/EventCard";

type Category = "upcoming" | "ongoing" | "past";

function categorizeEvent(event: Event): Category {
  const now = DateTime.now();
  const sorted = [...event.eventDays].sort((a, b) => a.dayNumber - b.dayNumber);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return "past";

  // eventDate may be a full ISO datetime ("2025-05-10T00:00:00.000Z").
  // Extract the local date string (YYYY-MM-DD) in the event's timezone before
  // combining with startTime / endTime.
  const firstDate = DateTime.fromISO(first.eventDate, { zone: "utc" })
    .setZone(first.timezone, { keepLocalTime: true })
    .toISODate();
  const lastDate = DateTime.fromISO(last.eventDate, { zone: "utc" })
    .setZone(last.timezone, { keepLocalTime: true })
    .toISODate();

  const eventStart = DateTime.fromISO(`${firstDate}T${first.startTime}`, {
    zone: first.timezone,
  });
  const eventEnd = DateTime.fromISO(`${lastDate}T${last.endTime}`, {
    zone: last.timezone,
  });

  if (!eventStart.isValid || !eventEnd.isValid) return "past";
  if (now < eventStart) return "upcoming";
  if (now > eventEnd) return "past";
  return "ongoing";
}

export default function EventPageContent({ events }: { events: Event[] }) {
  const t = useTranslations("Events");
  return (
    <div className="flex-1 min-h-0 overflow-y-scroll overflow-x-hidden">
      {events.length > 0 ? (
        <ul className="list pt-4">
          {[...events]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((event) => {
              const category = categorizeEvent(event);
              return (
                <li
                  key={event.eventId}
                  className={category === "past" ? "opacity-70" : undefined}
                >
                  <EventCard event={event} ongoing={category === "ongoing"} />
                </li>
              );
            })}
        </ul>
      ) : (
        <EmptyState message={t("description")} />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-[330px] lg:w-[460px] mx-auto flex flex-col items-center justify-center h-full gap-[5rem] pt-20">
      <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100">
        <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200">
          <Money3 size="50" color="#0d0d0d" variant="Bulk" />
        </div>
      </div>
      <div className="flex flex-col gap-12 items-center text-center">
        <p className="text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]">
          {message}
        </p>
      </div>
    </div>
  );
}
