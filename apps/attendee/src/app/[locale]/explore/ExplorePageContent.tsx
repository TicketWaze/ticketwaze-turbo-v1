"use client";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import NotificationBell from "@/components/NotificationBell";
import PendingCartButton from "@/components/PendingCartButton";
import EventCard from "@/components/shared/EventCard";
import RaffleCard from "@/components/shared/RaffleCard";
import RestaurantCard from "@/components/shared/RestaurantCard";
import SaleCard from "@/components/shared/SaleCard";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import {
  Event,
  PublicSale,
  Raffle,
  Restaurant,
} from "@ticketwaze/typescript-config";
import {
  ArchiveMinus,
  CloseCircle,
  Money3,
  SearchNormal,
} from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CategoryTabs,
  DateFilter,
  ExploreFilterState,
  FilterSelect,
  applyExploreFilters,
  hasActiveFilters,
} from "./ExploreFilters";

type ListedEvent = Event & { viewCount?: number };

/** How many category tabs sit next to "All" (the rest live in the dropdown). */
const TOP_CATEGORY_TABS = 3;

function cardMotion(index: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97 },
    transition: {
      duration: 0.35,
      ease: "easeOut" as const,
      delay: Math.min(index * 0.06, 0.3),
    },
  };
}

export default function ExplorePageContent({
  events,
  pastEvents = [],
  raffles = [],
  restaurants = [],
  sales = [],
}: {
  events: ListedEvent[];
  pastEvents?: ListedEvent[];
  raffles?: Raffle[];
  restaurants?: Restaurant[];
  sales?: PublicSale[];
  wallet: null;
}) {
  const t = useTranslations("Explore");
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);
  const [filters, setFilters] = useState<ExploreFilterState>({
    sort: "soonest",
  });
  const filtersActive = hasActiveFilters(filters);

  const q = query.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(q);

  // Options come from what is actually listed, so no filter can lead nowhere.
  const { topCategories, categoryOptions, cityOptions } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events)
      counts.set(event.eventType, (counts.get(event.eventType) ?? 0) + 1);
    const all = new Set([...events, ...pastEvents].map((e) => e.eventType));
    const cities = new Set(
      [...events, ...pastEvents].map((e) => e.city).filter(Boolean),
    );
    return {
      topCategories: [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_CATEGORY_TABS)
        .map(([category]) => category),
      categoryOptions: [...all].filter(Boolean).sort(),
      cityOptions: [...cities].sort() as string[],
    };
  }, [events, pastEvents]);

  const categoryLabel = (category: string) =>
    t.has(`categories.${category}`)
      ? t(`categories.${category}`)
      : category.charAt(0).toUpperCase() + category.slice(1);

  const filteredEvents = applyExploreFilters(
    events.filter((e) => matches(e.eventName)),
    filters,
  );
  const filteredPastEvents = applyExploreFilters(
    pastEvents.filter((e) => matches(e.eventName)),
    filters,
  );
  // Raffles, sales and restaurants have no topic, date or view count, so they
  // step aside while any filter is on and only answer to the search box.
  const filteredRaffles = filtersActive
    ? []
    : raffles.filter((raffle) => matches(raffle.title));
  const filteredSales = filtersActive
    ? []
    : sales.filter((sale) => matches(sale.title));
  const filteredRestaurants = filtersActive
    ? []
    : restaurants.filter((restaurant) => matches(restaurant.name));

  const hasAnyEvents =
    events.length > 0 ||
    pastEvents.length > 0 ||
    raffles.length > 0 ||
    restaurants.length > 0 ||
    sales.length > 0;
  const noResults =
    filteredEvents.length === 0 &&
    filteredPastEvents.length === 0 &&
    filteredRaffles.length === 0 &&
    filteredRestaurants.length === 0 &&
    filteredSales.length === 0;
  // "Similar activities" for an empty search: the most viewed upcoming ones.
  const suggestions = noResults
    ? [...events]
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, 8)
    : [];

  const iconButton =
    "w-12 h-12 lg:w-14 lg:h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full cursor-pointer transition-transform active:scale-90";

  const savedButton = session?.user ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={"/explore/liked"}
          aria-label={t("saved")}
          className={iconButton}
        >
          <ArchiveMinus size={20} color="#737C8A" variant="Bulk" />
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-[1.2rem]">{t("saved")}</p>
      </TooltipContent>
    </Tooltip>
  ) : (
    <Dialog>
      <DialogTrigger aria-label={t("saved")} className={iconButton}>
        <ArchiveMinus size={20} color="#737C8A" variant="Bulk" />
      </DialogTrigger>
      <NoAuthDialog callbackUrl="/explore/liked" intent="save" />
    </Dialog>
  );

  const searchInput = (autoFocus = false) => (
    <input
      placeholder={t("search")}
      value={query}
      autoFocus={autoFocus}
      className="text-black font-normal text-[1.4rem] leading-8 w-full outline-none bg-transparent"
      onChange={(e) => setQuery(e.target.value)}
    />
  );

  return (
    <>
      <motion.header
        className="w-full flex items-center justify-between gap-4 lg:gap-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {!mobileSearch && (
          // Figma: one line, no greeting (as on Upcoming and History).
          <h1 className="min-w-0 truncate font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-10 lg:leading-12 text-black">
            {t("title")}
          </h1>
        )}
        <div
          className={`flex shrink-0 items-center gap-3 lg:gap-4 ${mobileSearch ? "w-full" : ""}`}
        >
          <AnimatePresence initial={false}>
            {mobileSearch && (
              <motion.div
                key="mobile-search"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-neutral-100 rounded-[30px] flex items-center justify-between lg:hidden px-[15px] py-[7.5px] overflow-hidden"
              >
                {searchInput(true)}
                <button
                  aria-label="Close search"
                  onClick={() => {
                    setMobileSearch(false);
                    setQuery("");
                  }}
                >
                  <CloseCircle size="20" color="#737c8a" variant="Bulk" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="hidden bg-neutral-100 rounded-[30px] lg:flex items-center justify-between gap-4 w-[24.3rem] px-[15px] py-[7.5px] border border-transparent focus-within:border-primary-500 transition-colors">
            {searchInput()}
            {query ? (
              <button
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="cursor-pointer"
              >
                <CloseCircle size="20" color="#737c8a" variant="Bulk" />
              </button>
            ) : (
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            )}
          </div>
          {!mobileSearch && (
            <>
              <button
                aria-label={t("search")}
                onClick={() => setMobileSearch(true)}
                className={`${iconButton} lg:hidden`}
              >
                <SearchNormal size="20" color="#737c8a" variant="Bulk" />
              </button>
              <div className="w-[0.1rem] h-[1.8rem] bg-neutral-100 hidden lg:block" />
              <NotificationBell />
              {savedButton}
              <PendingCartButton />
            </>
          )}
        </div>
      </motion.header>

      {hasAnyEvents && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4 pt-2 lg:pt-4"
        >
          {/* Figma hides the tabs while searching; the dropdowns stay. */}
          <AnimatePresence initial={false} mode="popLayout">
            {!q && topCategories.length > 0 && (
              <motion.div
                key="tabs"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <CategoryTabs
                  categories={topCategories}
                  value={filters.category}
                  onChange={(category) =>
                    setFilters((f) => ({ ...f, category }))
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-[10px] overflow-x-auto no-scrollbar lg:ml-auto -mx-1 px-1 py-1">
            <FilterSelect
              label={t("filters.category")}
              resetLabel={t("filters.allCategories")}
              value={filters.category}
              options={categoryOptions.map((value) => ({
                value,
                label: categoryLabel(value),
              }))}
              onChange={(category) => setFilters((f) => ({ ...f, category }))}
            />
            <FilterSelect
              label={t("filters.location")}
              resetLabel={t("filters.allLocations")}
              value={filters.city}
              options={cityOptions.map((value) => ({ value, label: value }))}
              onChange={(city) => setFilters((f) => ({ ...f, city }))}
            />
            <DateFilter
              value={filters.date}
              onChange={(date) => setFilters((f) => ({ ...f, date }))}
            />
            <FilterSelect
              label={t("filters.popularity")}
              value={filters.sort === "popular" ? "popular" : undefined}
              options={[
                { value: "soonest", label: t("filters.soonest") },
                { value: "popular", label: t("filters.mostPopular") },
              ]}
              onChange={(sort) =>
                setFilters((f) => ({
                  ...f,
                  sort: sort === "popular" ? "popular" : "soonest",
                }))
              }
            />
            <AnimatePresence>
              {filtersActive && (
                <motion.button
                  key="clear"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setFilters({ sort: "soonest" })}
                  className="whitespace-nowrap text-[1.3rem] text-primary-500 hover:underline cursor-pointer px-2"
                >
                  {t("filters.clear")}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {hasAnyEvents ? (
        <div className="lg:pt-4 overflow-y-scroll flex flex-col gap-8 -mx-4">
          {filteredEvents.length > 0 && (
            <motion.ul layout className="list pt-2 lg:pt-4 px-4 pb-8 lg:pb-0">
              {/* No `initial={false}` here: it skips the entrance of every
                  card present on first render, so the feed appeared without
                  the fade-in the other sections have. */}
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event, index) => (
                  <motion.li
                    layout
                    key={event.eventId}
                    {...cardMotion(index)}
                    className="h-full flex"
                  >
                    <EventCard event={event} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
          {filteredRaffles.length > 0 && (
            <section className="flex flex-col gap-6">
              <span className="font-primary font-medium text-[1.8rem] lg:text-[2.2rem] leading-8 text-black lg:px-4">
                {t("raffles")}
              </span>
              <div className="-mx-4">
                <ul className="list pt-4 px-4 pb-8 lg:pb-0">
                  {filteredRaffles.map((raffle, index) => (
                    <motion.li key={raffle.raffleId} {...cardMotion(index)}>
                      <RaffleCard raffle={raffle} />
                    </motion.li>
                  ))}
                </ul>
              </div>
            </section>
          )}
          {filteredSales.length > 0 && (
            <section className="flex flex-col gap-6">
              <span className="font-primary font-medium text-[1.8rem] lg:text-[2.2rem] leading-8 text-black lg:px-4">
                {t("sales")}
              </span>
              <div className="-mx-4">
                <ul className="list pt-4 px-4 pb-8 lg:pb-0">
                  {filteredSales.map((sale, index) => (
                    <motion.li key={sale.saleId} {...cardMotion(index)}>
                      <SaleCard sale={sale} />
                    </motion.li>
                  ))}
                </ul>
              </div>
            </section>
          )}
          {filteredRestaurants.length > 0 && (
            <section className="flex flex-col gap-6">
              <span className="font-primary font-medium text-[1.8rem] lg:text-[2.2rem] leading-8 text-black px-4">
                {t("restaurants")}
              </span>
              <ul className="list pt-4 px-4 pb-8 lg:pb-0">
                {filteredRestaurants.map((restaurant, index) => (
                  <motion.li
                    key={restaurant.restaurantId}
                    {...cardMotion(index)}
                  >
                    <RestaurantCard restaurant={restaurant} />
                  </motion.li>
                ))}
              </ul>
            </section>
          )}
          {filteredPastEvents.length > 0 && (
            <section className="flex flex-col gap-6">
              <span className="font-primary font-medium text-[1.8rem] lg:text-[2.2rem] leading-8 text-black px-4">
                {t("pastActivities")}
              </span>
              <ul className="list opacity-70 pt-4 px-4 pb-8 lg:pb-0">
                {filteredPastEvents.map((event, index) => (
                  <motion.li key={event.eventId} {...cardMotion(index)}>
                    <EventCard event={event} />
                  </motion.li>
                ))}
              </ul>
            </section>
          )}
          <AnimatePresence>
            {noResults && (
              <motion.section
                key="no-results"
                className="flex flex-col gap-6 px-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-[1.6rem] lg:text-[1.8rem] leading-10 text-neutral-600">
                  {q
                    ? t("noResultQuery", { query: query.trim() })
                    : t("noResultFilters")}
                </p>
                {suggestions.length > 0 && (
                  <ul className="list pt-4 pb-8 lg:pb-0">
                    {suggestions.map((event, index) => (
                      <motion.li
                        key={event.eventId}
                        {...cardMotion(index)}
                        className="h-full flex"
                      >
                        <EventCard event={event} />
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          className="w-132 lg:w-184 mx-auto h-full justify-center flex flex-col items-center gap-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100">
            <div className="w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200">
              <Money3 size="50" color="#0d0d0d" variant="Bulk" />
            </div>
          </div>
          <div className="flex flex-col gap-12 items-center text-center">
            <p className="text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]">
              {t("noEvent")}
            </p>
          </div>
        </motion.div>
      )}
    </>
  );
}
