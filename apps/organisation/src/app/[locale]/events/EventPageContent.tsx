"use client";
import { useState } from "react";
import { DateTime } from "luxon";
import { Category, Clock, Money3 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Event, Raffle, Restaurant, Sale } from "@ticketwaze/typescript-config";
import EventCard from "@/components/shared/EventCard";
import RaffleCard from "@/components/shared/RaffleCard";
import RestaurantCard from "@/components/shared/RestaurantCard";
import SaleCard from "@/components/shared/SaleCard";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = "upcoming" | "ongoing" | "past";
type ActivityFilter = "all" | "events" | "raffles" | "restaurants" | "sales";
/** Where an activity sits in its own lifecycle, whatever kind it is. */
type StatusFilter = "all" | "ongoing" | "upcoming" | "past";

/**
 * WHERE A NON-EVENT ACTIVITY SITS IN TIME.
 *
 * Events have real dates and `categorizeEvent` reads them. The other three do
 * not, so this is where the mapping is decided rather than invented at each
 * call site:
 *
 * - A RAFFLE is upcoming until it is drawn. `drawnAt` is the authority because
 *   a manual draw can sit past its own date waiting on the organiser, and
 *   filing that under history would hide a raffle that still needs action.
 * - A DIGITAL PRODUCT has no schedule, so its review lifecycle stands in for
 *   one: not on sale yet (draft, scanning, in review) reads as upcoming, `live`
 *   as ongoing, and withdrawn or refused as history.
 * - A RESTAURANT is always operating. There is no future or past version of a
 *   venue listing, so it is ongoing for as long as it exists.
 */
function categorizeRaffle(raffle: Raffle): Category {
  if (raffle.drawnAt) return "past";
  return DateTime.fromISO(raffle.drawAt) < DateTime.now() ? "past" : "upcoming";
}

function categorizeSale(sale: Sale): Category {
  if (sale.status === "live") return "ongoing";
  if (sale.status === "unlisted" || sale.status === "rejected") return "past";
  return "upcoming";
}

/**
 * WHAT SORTS TO THE TOP OF THE GRID.
 *
 * The sort now carries weight it did not before: finished activities used to be
 * faded out, and with that gone the ORDER is what separates something that is
 * still earning from something that is over.
 *
 * Rank 0 is for listings with no end date at all. A venue and a product on sale
 * are available every day, so ranking them purely by when they were created
 * would bury a shop that is open right now under a dated event that happens to
 * be newer. Everything else follows its lifecycle — running, then coming, then
 * done — and inside every rank the newest comes first.
 */
function sortRank(item: { kind: string; category: Category }): number {
  // Always-on listings: a restaurant, and a product actually on sale. A product
  // still in review is NOT always-on — it cannot be bought yet — so it falls
  // through to the lifecycle ranks below with everything else.
  if (item.kind === "restaurant") return 0;
  if (item.kind === "sale" && item.category === "ongoing") return 0;

  if (item.category === "ongoing") return 1;
  if (item.category === "upcoming") return 2;
  return 3;
}

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
  sales = [],
}: {
  events: Event[];
  raffles?: Raffle[];
  restaurants?: Restaurant[];
  sales?: Sale[];
}) {
  const t = useTranslations("Events");
  /**
   * TWO INDEPENDENT FILTERS, NOT ONE.
   *
   * `status` is where an activity sits in time and `kind` is what sort of thing
   * it is; they answer different questions and an organiser routinely wants
   * both at once ("my raffles that have not been drawn"). Folding them into a
   * single pill row would have made those mutually exclusive.
   */
  const [status, setStatus] = useState<StatusFilter>("all");
  const [kind, setKind] = useState<ActivityFilter>("all");

  // Every activity type shares one grid, each carrying the lifecycle position
  // its own type defines. Ordered by `sortRank` below, newest first within a
  // rank.
  const items = [
    ...events.map((event) => ({
      kind: "event" as const,
      createdAt: event.createdAt,
      category: categorizeEvent(event),
      event,
    })),
    ...raffles.map((raffle) => ({
      kind: "raffle" as const,
      createdAt: raffle.createdAt,
      category: categorizeRaffle(raffle),
      raffle,
    })),
    ...restaurants.map((restaurant) => ({
      kind: "restaurant" as const,
      createdAt: restaurant.createdAt,
      // A venue listing has no future or past version of itself.
      category: "ongoing" as Category,
      restaurant,
    })),
    ...sales.map((sale) => ({
      kind: "sale" as const,
      createdAt: sale.createdAt,
      category: categorizeSale(sale),
      sale,
    })),
  ].sort((a, b) => {
    const rank = sortRank(a) - sortRank(b);
    if (rank !== 0) return rank;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredItems = items.filter((item) => {
    if (kind === "events" && item.kind !== "event") return false;
    if (kind === "raffles" && item.kind !== "raffle") return false;
    if (kind === "restaurants" && item.kind !== "restaurant") return false;
    if (kind === "sales" && item.kind !== "sale") return false;
    if (status !== "all" && item.category !== status) return false;
    return true;
  });

  /** Left of the bar: where things are in their lifecycle. */
  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t("filter.all") },
    { value: "ongoing", label: t("filter.ongoing") },
    { value: "upcoming", label: t("filter.upcoming") },
    { value: "past", label: t("filter.history") },
  ];

  /** Right of the bar: which kind of activity. */
  const kindFilters: { value: ActivityFilter; label: string }[] = [
    { value: "all", label: t("filter.all_categories") },
    { value: "events", label: t("filter.events") },
    { value: "raffles", label: t("filter.raffles") },
    { value: "restaurants", label: t("filter.restaurants") },
    { value: "sales", label: t("filter.sales") },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/*
        MOBILE: BOTH FILTERS AS CHIPS, RIGHT-ALIGNED.

        The pill group does not fit a phone. Four pills plus the category
        dropdown overran the width and collided, so on mobile the lifecycle
        becomes a dropdown too and the two sit together at the right.

        Each chip shows only its ICON while it is on "all", and its label once
        it is actually filtering. That is what keeps two dropdowns inside a
        phone width, and it doubles as the state indicator: a chip showing words
        is a chip that is hiding something.
      */}
      <div className="flex lg:hidden items-center justify-end gap-4 mt-4 mb-2 mx-2">
        <FilterChip
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={statusFilters}
          label={t("filter.status_label")}
          icon={<Clock className="size-8" color="#737c8a" variant="Bulk" />}
          compact
        />
        <FilterChip
          value={kind}
          onChange={(v) => setKind(v as ActivityFilter)}
          options={kindFilters}
          label={t("filter.category_label")}
          icon={<Category className="size-8" color="#737c8a" variant="Bulk" />}
          compact
        />
      </div>

      {/*
        DESKTOP: the design's segmented row on the left, category on the right.
        There is room for the pills here, and they read faster than a dropdown
        because every option is visible at once.
      */}
      <div className="hidden lg:flex flex-row items-center justify-between gap-4 mt-4 mb-2 mx-2">
        <div className="flex items-center gap-2 bg-neutral-100 rounded-[30px] p-[.4rem] w-fit">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-8 py-3 rounded-[30px] text-[1.4rem] leading-8 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                status === f.value
                  ? "bg-deep-100 text-white"
                  : "text-neutral-600 hover:text-deep-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <FilterChip
          value={kind}
          onChange={(v) => setKind(v as ActivityFilter)}
          options={kindFilters}
          label={t("filter.category_label")}
          icon={<Category className="size-8" color="#737c8a" variant="Bulk" />}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-scroll overflow-x-hidden">
        {filteredItems.length > 0 ? (
          <ul className="list pt-4 px-4 pb-8">
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
              if (item.kind === "sale") {
                return (
                  <li key={item.sale.saleId}>
                    <SaleCard sale={item.sale} />
                  </li>
                );
              }
              return (
                // Past events are no longer dimmed. Fading a card read as
                // disabled rather than finished, and it was the only card type
                // that got the treatment — a drawn raffle and an unlisted
                // product sat at full strength beside it. Position in the grid
                // says it now, and the History tab isolates them outright.
                <li key={item.event.eventId}>
                  <EventCard
                    event={item.event}
                    ongoing={item.category === "ongoing"}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            message={
              /*
                A lifecycle filter that matches nothing is not an empty account.
                "No raffles yet, create your first" would be wrong — and would
                point at the wrong fix — when the organiser has twenty raffles
                and simply asked for the ones not yet drawn.
              */
              status !== "all"
                ? t("filter.empty_status")
                : kind === "raffles"
                  ? t("filter.empty_raffles")
                  : kind === "restaurants"
                    ? t("filter.empty_restaurants")
                    : kind === "sales"
                      ? t("filter.empty_sales")
                      : kind === "events"
                        ? t("filter.empty_events")
                        : t("description")
            }
          />
        )}
      </div>
    </div>
  );
}

/**
 * A filter as a rounded chip, shared by both breakpoints.
 *
 * `compact` collapses the trigger to its icon while the filter is on "all".
 * Two labelled dropdowns do not fit a phone, and a chip that shows words is
 * then also the signal that something is being filtered out — the icon-only
 * state means "everything".
 *
 * The label is still announced through `aria-label`, because collapsing to an
 * icon must not leave the control unnamed to a screen reader.
 *
 * NOTE ON THE ICON: pass it with its own `size-*` class, never with iconsax's
 * `size` prop. `SelectTrigger` carries
 * `[&_svg:not([class*='size-'])]:size-4`, which overrides the prop and — at
 * this app's 10px rem base — renders the icon at 10px, far smaller than the
 * caret beside it. Having a `size-` class in the className is exactly what
 * makes that rule not match.
 */
function FilterChip({
  value,
  onChange,
  options,
  label,
  icon,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  icon: React.ReactNode;
  compact?: boolean;
}) {
  const showIconOnly = compact && value === "all";

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className={`shrink-0 bg-neutral-100 rounded-[30px] border-none text-[1.4rem] text-neutral-700 leading-8 ${
          showIconOnly ? "w-fit px-5 py-6 gap-2" : "w-fit px-6 py-6"
        }`}
      >
        {showIconOnly ? icon : <SelectValue />}
      </SelectTrigger>
      <SelectContent className="bg-neutral-100 text-[1.4rem]">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              className="text-[1.4rem] text-deep-100"
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-132 lg:w-184 mx-auto flex flex-col items-center justify-center h-full gap-20 pt-20">
      <div className="w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100">
        <div className="w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200">
          <Money3 size="50" color="#0d0d0d" variant="Bulk" />
        </div>
      </div>
      <div className="flex flex-col gap-12 items-center text-center">
        <p className="text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]">
          {message}
        </p>
      </div>
    </div>
  );
}
