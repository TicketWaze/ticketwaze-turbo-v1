"use client";
import { useState } from "react";
import { DateTime } from "luxon";
import { Money3 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Event, Raffle, Restaurant } from "@ticketwaze/typescript-config";
import EventCard from "@/components/shared/EventCard";
import RaffleCard from "@/components/shared/RaffleCard";
import RestaurantCard from "@/components/shared/RestaurantCard";

type Category = "upcoming" | "ongoing" | "past";
type ActivityFilter = "all" | "events" | "raffles" | "restaurants";

function categorizeEvent(event: Event): Category {
  const now = DateTime.now();
  // A teaser has no days at all. Without this it falls through to the
  // "no first/last day" branch below and is filed as *past*, which buries a
  // brand new announcement under finished events.
  if (event.isComingSoon) return "upcoming";

  const sorted = [...(event.eventDays ?? [])].sort(
    (a, b) => a.dayNumber - b.dayNumber,
  );
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

export default function EventPageContent({
  events,
  raffles = [],
  restaurants = [],
}: {
  events: Event[];
  raffles?: Raffle[];
  restaurants?: Restaurant[];
}) {
  const t = useTranslations("Events");
  const [filter, setFilter] = useState<ActivityFilter>("all");

  // Events, raffles and restaurants share one grid, newest first.
  const items = [
    ...events.map((event) => ({
      kind: "event" as const,
      createdAt: event.createdAt,
      event,
    })),
    ...raffles.map((raffle) => ({
      kind: "raffle" as const,
      createdAt: raffle.createdAt,
      raffle,
    })),
    ...restaurants.map((restaurant) => ({
      kind: "restaurant" as const,
      createdAt: restaurant.createdAt,
      restaurant,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const filteredItems = items.filter((item) => {
    if (filter === "events") return item.kind === "event";
    if (filter === "raffles") return item.kind === "raffle";
    if (filter === "restaurants") return item.kind === "restaurant";
    return true;
  });

  const filters: { value: ActivityFilter; label: string }[] = [
    { value: "all", label: t("filter.all") },
    { value: "events", label: t("filter.events") },
    { value: "raffles", label: t("filter.raffles") },
    { value: "restaurants", label: t("filter.restaurants") },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 bg-neutral-100 rounded-[30px] p-[.4rem] w-fit mt-4 mb-2 ml-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-8 py-3 rounded-[30px] text-[1.4rem] leading-8 font-medium transition-colors cursor-pointer ${
              filter === f.value
                ? "bg-primary-500 text-white"
                : "text-neutral-600 hover:text-deep-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-scroll overflow-x-hidden">
        {filteredItems.length > 0 ? (
          <ul className="list pt-4">
            {filteredItems.map((item) => {
              if (item.kind === "raffle") {
                return (
                  <li key={item.raffle.raffleId}>
                    <RaffleCard raffle={item.raffle} />
                  </li>
                );
              }
              if (item.kind === "restaurant") {
                return (
                  <li key={item.restaurant.restaurantId}>
                    <RestaurantCard restaurant={item.restaurant} />
                  </li>
                );
              }
              const category = categorizeEvent(item.event);
              return (
                <li
                  key={item.event.eventId}
                  className={category === "past" ? "opacity-70" : undefined}
                >
                  <EventCard
                    event={item.event}
                    ongoing={category === "ongoing"}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            message={
              filter === "raffles"
                ? t("filter.empty_raffles")
                : filter === "restaurants"
                  ? t("filter.empty_restaurants")
                  : filter === "events"
                    ? t("filter.empty_events")
                    : t("description")
            }
          />
        )}
      </div>
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
