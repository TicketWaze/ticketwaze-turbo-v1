"use client";
import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { isOvernight } from "@/lib/eventTime";
import { Money3, SearchNormal1, Setting4 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Event, Raffle, Restaurant, Sale } from "@ticketwaze/typescript-config";
import EventCard from "@/components/shared/EventCard";
import RaffleCard from "@/components/shared/RaffleCard";
import RestaurantCard from "@/components/shared/RestaurantCard";
import SaleCard from "@/components/shared/SaleCard";
import FilterPill, { FilterOption } from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import { LinkPrimary } from "@/components/shared/Links";
import { Link } from "@/i18n/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { cardMotion, tabSpring } from "@/components/shared/motion";

type Category = "upcoming" | "ongoing" | "past";
type ActivityFilter = "all" | "events" | "raffles" | "restaurants" | "sales";
/** Where an activity sits in its own lifecycle, whatever kind it is. */
type StatusFilter = "all" | "ongoing" | "upcoming" | "past";
type DateFilter = "any" | "today" | "week" | "month" | "next30" | "past";
type SortOrder = "default" | "views" | "sold";
export type ActivityStats = Record<string, { views: number; sold: number }>;

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
 * Finished activities are not faded out, so the ORDER is what separates
 * something that is still earning from something that is over.
 *
 * Rank 0 is for listings with no end date at all. A venue and a product on sale
 * are available every day, so ranking them purely by when they were created
 * would bury a shop that is open right now under a dated event that happens to
 * be newer. Everything else follows its lifecycle — running, then coming, then
 * done — and inside every rank the newest comes first.
 */
function sortRank(item: { kind: string; category: Category }): number {
  if (item.kind === "restaurant") return 0;
  if (item.kind === "sale" && item.category === "ongoing") return 0;
  if (item.category === "ongoing") return 1;
  if (item.category === "upcoming") return 2;
  return 3;
}

/** Each day of an event as a [start, end] instant pair, in its own zone. */
function eventDaySpans(event: Event): [DateTime, DateTime][] {
  return (event.eventDays ?? [])
    .map((day) => {
      // eventDate may be a full ISO datetime; take the calendar date in the
      // day's own timezone before combining it with the times.
      const date = DateTime.fromISO(day.eventDate, { zone: "utc" })
        .setZone(day.timezone, { keepLocalTime: true })
        .toISODate();
      const start = DateTime.fromISO(`${date}T${day.startTime}`, {
        zone: day.timezone,
      });
      // An overnight day (20:00 → 02:00) ends the next morning.
      const end = DateTime.fromISO(`${date}T${day.endTime}`, {
        zone: day.timezone,
      }).plus({ days: isOvernight(day.startTime, day.endTime) ? 1 : 0 });
      return [start, end] as [DateTime, DateTime];
    })
    .filter(([s, e]) => s.isValid && e.isValid);
}

function categorizeEvent(event: Event): Category {
  // A teaser has no days at all; it is an announcement, so it is ahead.
  if (event.isComingSoon) return "upcoming";
  const spans = eventDaySpans(event);
  if (spans.length === 0) return "past";
  const now = DateTime.now();
  const start = DateTime.min(...spans.map(([s]) => s));
  const end = DateTime.max(...spans.map(([, e]) => e));
  if (!start || !end) return "past";
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
}

/** The window a date filter asks for; null for "any" and "past". */
function dateWindow(filter: DateFilter): [DateTime, DateTime] | null {
  const now = DateTime.now();
  switch (filter) {
    case "today":
      return [now.startOf("day"), now.endOf("day")];
    case "week":
      return [now.startOf("week"), now.endOf("week")];
    case "month":
      return [now.startOf("month"), now.endOf("month")];
    case "next30":
      return [now, now.plus({ days: 30 })];
    default:
      return null;
  }
}

type Item =
  | {
      kind: "event";
      id: string;
      name: string;
      createdAt: string;
      category: Category;
      city: string | null;
      event: Event;
    }
  | {
      kind: "raffle";
      id: string;
      name: string;
      createdAt: string;
      category: Category;
      city: null;
      raffle: Raffle;
    }
  | {
      kind: "restaurant";
      id: string;
      name: string;
      createdAt: string;
      category: Category;
      city: string | null;
      restaurant: Restaurant;
    }
  | {
      kind: "sale";
      id: string;
      name: string;
      createdAt: string;
      category: Category;
      city: null;
      sale: Sale;
    };

/**
 * Whether an activity falls in a date window. Events by any of their days,
 * teasers by their announced date, raffles by their draw. Products and venues
 * have no dates, so a date filter leaves them out.
 */
function inDateWindow(item: Item, filter: DateFilter): boolean {
  if (filter === "any") return true;
  if (filter === "past") return item.category === "past";
  const window = dateWindow(filter)!;
  const overlaps = (s: DateTime, e: DateTime) =>
    s <= window[1] && e >= window[0];
  if (item.kind === "event") {
    if (item.event.isComingSoon && item.event.comingSoonDate) {
      const d = DateTime.fromISO(item.event.comingSoonDate);
      return overlaps(d.startOf("day"), d.endOf("day"));
    }
    return eventDaySpans(item.event).some(([s, e]) => overlaps(s, e));
  }
  if (item.kind === "raffle") {
    const d = DateTime.fromISO(item.raffle.drawAt);
    return d.isValid && overlaps(d, d);
  }
  return false;
}

export default function EventPageContent({
  events,
  raffles = [],
  restaurants = [],
  sales = [],
  stats = {},
  canCreate = false,
}: {
  events: Event[];
  raffles?: Raffle[];
  restaurants?: Restaurant[];
  sales?: Sale[];
  /** Views and tickets sold per activity id, for the Popularity sort. */
  stats?: ActivityStats;
  canCreate?: boolean;
}) {
  const t = useTranslations("Events");
  /**
   * INDEPENDENT FILTERS. `status` is where an activity sits in time, `kind` is
   * what sort of thing it is, `location` and `date` narrow further, and `sort`
   * only reorders. An organiser routinely combines them ("my raffles that have
   * not been drawn"), so none of them excludes another.
   */
  const [status, setStatus] = useState<StatusFilter>("all");
  const [kind, setKind] = useState<ActivityFilter>("all");
  const [location, setLocation] = useState("all");
  const [date, setDate] = useState<DateFilter>("any");
  const [sort, setSort] = useState<SortOrder>("default");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const items: Item[] = useMemo(
    () => [
      ...events.map((event) => ({
        kind: "event" as const,
        id: event.eventId,
        name: event.eventName,
        createdAt: event.createdAt,
        category: categorizeEvent(event),
        city: event.eventCategory === "meet" ? null : (event.city ?? null),
        event,
      })),
      ...raffles.map((raffle) => ({
        kind: "raffle" as const,
        id: raffle.raffleId,
        name: raffle.title,
        createdAt: raffle.createdAt,
        category: categorizeRaffle(raffle),
        city: null,
        raffle,
      })),
      ...restaurants.map((restaurant) => ({
        kind: "restaurant" as const,
        id: restaurant.restaurantId,
        name: restaurant.name,
        createdAt: restaurant.createdAt,
        // A venue listing has no future or past version of itself.
        category: "ongoing" as Category,
        city: restaurant.city ?? null,
        restaurant,
      })),
      ...sales.map((sale) => ({
        kind: "sale" as const,
        id: sale.saleId,
        name: sale.title,
        createdAt: sale.createdAt,
        category: categorizeSale(sale),
        city: null,
        sale,
      })),
    ],
    [events, raffles, restaurants, sales],
  );

  /** Cities the organisation actually runs things in, A→Z. */
  const cities = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) {
      if (item.city) seen.set(item.city.trim().toLowerCase(), item.city.trim());
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byDefault = (a: Item, b: Item) => {
      const rank = sortRank(a) - sortRank(b);
      if (rank !== 0) return rank;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };
    return items
      .filter((item) => {
        if (kind === "events" && item.kind !== "event") return false;
        if (kind === "raffles" && item.kind !== "raffle") return false;
        if (kind === "restaurants" && item.kind !== "restaurant") return false;
        if (kind === "sales" && item.kind !== "sale") return false;
        if (status !== "all" && item.category !== status) return false;
        if (location !== "all" && item.city?.trim().toLowerCase() !== location)
          return false;
        if (!inDateWindow(item, date)) return false;
        if (q && !item.name.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort !== "default") {
          const diff = (stats[b.id]?.[sort] ?? 0) - (stats[a.id]?.[sort] ?? 0);
          if (diff !== 0) return diff;
        }
        return byDefault(a, b);
      });
  }, [items, kind, status, location, date, sort, query, stats]);

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t("filter.all") },
    { value: "ongoing", label: t("filter.ongoing") },
    { value: "upcoming", label: t("filter.upcoming") },
    { value: "past", label: t("filter.history") },
  ];
  const kindOptions: FilterOption[] = [
    { value: "all", label: t("filter.all_categories") },
    { value: "events", label: t("filter.events") },
    { value: "raffles", label: t("filter.raffles") },
    { value: "restaurants", label: t("filter.restaurants") },
    { value: "sales", label: t("filter.sales") },
  ];
  const locationOptions: FilterOption[] = [
    { value: "all", label: t("filter.any_location") },
    ...cities.map(([value, label]) => ({ value, label })),
  ];
  const dateOptions: FilterOption[] = (
    ["any", "today", "week", "month", "next30", "past"] as DateFilter[]
  ).map((value) => ({ value, label: t(`filter.dates.${value}`) }));
  const sortOptions: FilterOption[] = (
    ["default", "views", "sold"] as SortOrder[]
  ).map((value) => ({ value, label: t(`filter.sort.${value}`) }));

  const extraFilters =
    Number(kind !== "all") +
    Number(location !== "all") +
    Number(date !== "any") +
    Number(sort !== "default");

  function resetFilters() {
    setKind("all");
    setLocation("all");
    setDate("any");
    setSort("default");
  }

  const empty =
    items.length === 0
      ? t("description")
      : query.trim()
        ? t("search_empty", { query: query.trim() })
        : status !== "all" || extraFilters > 0
          ? t("filter.empty_status")
          : t("description");

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-10 overflow-hidden">
      {/* Header: title, search, create */}
      <motion.header
        className="flex flex-col gap-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between gap-6">
          <h1 className="font-primary font-medium text-[2.6rem] leading-12 text-black truncate">
            {t("title")}
          </h1>
          <div className="flex items-center gap-4">
            <SearchField
              className="hidden lg:flex w-[24.3rem]"
              value={query}
              onChange={setQuery}
              placeholder={t("search")}
            />
            <button
              type="button"
              aria-label={t("search")}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((o) => !o)}
              className="lg:hidden size-[3.5rem] rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer"
            >
              <SearchNormal1 size="20" variant="Bulk" color="#737C8A" />
            </button>
            <button
              type="button"
              aria-label={t("filter.title")}
              onClick={() => setSheetOpen(true)}
              className="lg:hidden relative size-[3.5rem] rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer"
            >
              <Setting4 size="20" variant="Bulk" color="#737C8A" />
              <AnimatePresence>
                {extraFilters > 0 && (
                  <motion.span
                    key="count"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute -top-1 -right-1 size-[1.6rem] rounded-full bg-primary-500 text-white text-[1rem] leading-none font-medium flex items-center justify-center"
                  >
                    {extraFilters}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {canCreate && (
              <LinkPrimary className="hidden lg:block" href="/events/create">
                {t("create")}
              </LinkPrimary>
            )}
          </div>
        </div>
        <AnimatePresence initial={false}>
          {searchOpen && (
            <motion.div
              key="search"
              className="lg:hidden overflow-hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <SearchField
                className="flex w-full"
                value={query}
                onChange={setQuery}
                placeholder={t("search")}
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Status pills; the other filters beside them on desktop */}
      <motion.div
        className="flex items-center justify-between gap-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        <div className="flex items-center bg-neutral-100 rounded-[3rem] p-[.75rem] w-fit max-w-full overflow-x-auto">
          {statusFilters.map((f) => {
            const active = status === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatus(f.value)}
                aria-pressed={active}
                className={cn(
                  "relative px-6 py-2 rounded-[3rem] font-sans text-[1.4rem] leading-8 whitespace-nowrap cursor-pointer transition-colors duration-200",
                  active
                    ? "text-white"
                    : "text-neutral-700 hover:text-deep-100",
                )}
              >
                {/* The black highlight slides between pills, as on Explore. */}
                {active && (
                  <motion.span
                    layoutId="activities-status-tab"
                    className="absolute inset-0 rounded-[3rem] bg-black"
                    transition={tabSpring}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            );
          })}
        </div>
        <div className="hidden lg:flex items-center gap-4 flex-wrap justify-end">
          <FilterPill
            label={t("filter.category_label")}
            value={kind}
            defaultValue="all"
            placeholder={t("filter.category_label")}
            options={kindOptions}
            onChange={(v) => setKind(v as ActivityFilter)}
          />
          <FilterPill
            label={t("filter.location")}
            value={location}
            defaultValue="all"
            placeholder={t("filter.location")}
            options={locationOptions}
            onChange={setLocation}
          />
          <FilterPill
            label={t("filter.date")}
            value={date}
            defaultValue="any"
            placeholder={t("filter.date")}
            options={dateOptions}
            onChange={(v) => setDate(v as DateFilter)}
          />
          <FilterPill
            label={t("filter.popularity")}
            value={sort}
            defaultValue="default"
            placeholder={t("filter.popularity")}
            options={sortOptions}
            onChange={(v) => setSort(v as SortOrder)}
          />
        </div>
      </motion.div>

      {/* Grid: cards rise in staggered, and re-flow when filters change */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden -mx-4 px-4">
        {visible.length > 0 ? (
          <motion.ul
            layout
            className="list [--grid-item--min-width:25.5rem] gap-y-8 pt-1 pb-24 lg:pb-8"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((item, index) => (
                <motion.li
                  layout
                  key={`${item.kind}-${item.id}`}
                  {...cardMotion(index)}
                  className="h-full flex"
                >
                  {item.kind === "raffle" ? (
                    <RaffleCard raffle={item.raffle} />
                  ) : item.kind === "restaurant" ? (
                    <RestaurantCard restaurant={item.restaurant} />
                  ) : item.kind === "sale" ? (
                    <SaleCard sale={item.sale} />
                  ) : (
                    <EventCard
                      event={item.event}
                      ongoing={item.category === "ongoing"}
                    />
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        ) : (
          <motion.div
            key={empty}
            className="h-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyState message={empty} />
          </motion.div>
        )}
      </div>

      {canCreate && (
        <Link
          className="lg:hidden fixed bottom-43 right-10 z-40 bg-primary-500 rounded-full px-10 py-5 flex items-center justify-center text-white text-[1.5rem] font-medium leading-8 shadow-lg"
          href="/events/create"
        >
          {t("create")}
        </Link>
      )}

      {/* Phone: the four non-status filters in a bottom sheet */}
      <Drawer open={sheetOpen} onOpenChange={setSheetOpen} direction="bottom">
        <DrawerContent className="bg-white rounded-t-[3rem] px-6 pb-10 max-h-[85dvh]">
          <div className="flex items-center justify-between pt-6 pb-4 border-b border-neutral-100">
            <DrawerTitle className="font-primary font-medium text-[2.2rem] leading-12 text-black">
              {t("filter.title")}
            </DrawerTitle>
            {extraFilters > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="font-sans text-[1.4rem] text-primary-500 cursor-pointer"
              >
                {t("filter.reset")}
              </button>
            )}
          </div>
          <DrawerDescription className="sr-only">
            {t("filter.title")}
          </DrawerDescription>
          <div className="flex flex-col gap-8 py-6 overflow-y-auto">
            <SheetGroup
              title={t("filter.category_label")}
              options={kindOptions}
              value={kind}
              onChange={(v) => setKind(v as ActivityFilter)}
            />
            {cities.length > 0 && (
              <SheetGroup
                title={t("filter.location")}
                options={locationOptions}
                value={location}
                onChange={setLocation}
              />
            )}
            <SheetGroup
              title={t("filter.date")}
              options={dateOptions}
              value={date}
              onChange={(v) => setDate(v as DateFilter)}
            />
            <SheetGroup
              title={t("filter.popularity")}
              options={sortOptions}
              value={sort}
              onChange={(v) => setSort(v as SortOrder)}
            />
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="w-full bg-primary-500 text-white rounded-[3rem] py-5 font-sans font-medium text-[1.5rem] leading-8 cursor-pointer"
          >
            {t("filter.apply", { count: visible.length })}
          </button>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function SheetGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="font-sans font-medium text-[1.5rem] leading-8 text-deep-100 mb-4">
        {title}
      </legend>
      <div className="flex flex-wrap gap-3">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "px-6 py-3 rounded-[3rem] font-sans text-[1.4rem] leading-8 cursor-pointer",
              value === o.value
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-700",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
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
      <p className="text-[1.8rem] leading-10 text-neutral-600 text-center max-w-132 lg:max-w-[42.2rem]">
        {message}
      </p>
    </div>
  );
}
