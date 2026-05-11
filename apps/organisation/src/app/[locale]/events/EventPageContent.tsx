"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateTime } from "luxon";
import { Money3 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Event } from "@ticketwaze/typescript-config";
import EventCard from "@/components/shared/EventCard";

type Category = "upcoming" | "ongoing" | "history";

function categorizeEvent(event: Event): Category {
  const now = DateTime.now();
  const sorted = [...event.eventDays].sort((a, b) => a.dayNumber - b.dayNumber);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return "history";

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

  if (!eventStart.isValid || !eventEnd.isValid) return "history";
  if (now < eventStart) return "upcoming";
  if (now > eventEnd) return "history";
  return "ongoing";
}

export default function EventPageContent({ events }: { events: Event[] }) {
  return (
    <div className="min-h-[75vh]">
      <Tabs defaultValue="upcoming" className="w-full h-full">
        <TabsList className={"w-full lg:w-fit mx-auto lg:mx-0"}>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">
            <span className="flex items-center gap-2">
              <span className="w-[6px] h-[6px] rounded-full bg-green-500 animate-pulse" />
              Ongoing
            </span>
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <UpcomingContent events={events} />
        <OngoingContent events={events} />
        <HistoryContent events={events} />
      </Tabs>
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

function EventList({ events }: { events: Event[] }) {
  return (
    <ul className="list pt-4">
      {events
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .map((event, i) => (
          <li key={`${event.eventId}-${i}`}>
            <EventCard event={event} />
          </li>
        ))}
    </ul>
  );
}

function UpcomingContent({ events }: { events: Event[] }) {
  const t = useTranslations("Events");
  const upcoming = events.filter((e) => categorizeEvent(e) === "upcoming");
  return (
    <TabsContent value="upcoming">
      {upcoming.length > 0 ? (
        <EventList events={upcoming} />
      ) : (
        <EmptyState message={t("description")} />
      )}
    </TabsContent>
  );
}

function OngoingContent({ events }: { events: Event[] }) {
  const ongoing = events.filter((e) => categorizeEvent(e) === "ongoing");
  return (
    <TabsContent value="ongoing">
      {ongoing.length > 0 ? (
        <EventList events={ongoing} />
      ) : (
        <EmptyState message="No events are happening right now." />
      )}
    </TabsContent>
  );
}

function HistoryContent({ events }: { events: Event[] }) {
  const t = useTranslations("Events");
  const history = events.filter((e) => categorizeEvent(e) === "history");
  return (
    <TabsContent value="history">
      {history.length > 0 ? (
        <EventList events={history} />
      ) : (
        <EmptyState message={t("description")} />
      )}
    </TabsContent>
  );
}
