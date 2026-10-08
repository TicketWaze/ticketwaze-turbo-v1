"use client";
import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown2, Calendar2, Location } from "iconsax-reactjs";
import { TabsContent } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";

export type ActivityCardData = {
  activityId: string;
  type: "event" | "raffle" | "sale" | "restaurant";
  name: string;
  imageUrl: string | null;
  date: string | null;
  location: string | null;
  currency: string;
  priceMin: number | null;
  priceMax: number | null;
  isFree: boolean;
  cancelled: boolean;
  createdAt: string;
};

const HREF: Record<ActivityCardData["type"], (id: string) => string> = {
  event: (id) => `/activities/${id}`,
  raffle: (id) => `/activities/raffle/${id}`,
  sale: (id) => `/activities/sale/${id}`,
  restaurant: (id) => `/activities/restaurant/${id}`,
};

/**
 * Figma "Event Summary" (4262:75668), worded "Activity" (user, 2026-10-07):
 * "Activities created" as a 2-column card grid, a collapsible "Cancelled
 * activities", a divider, then "Joined On". Covers every activity type; a
 * non-event card names its kind on the picture.
 */
export default function ActivitySummary({
  activities,
  createdAt,
}: {
  activities: ActivityCardData[];
  createdAt: string;
}) {
  const t = useTranslations("Organisations.profile.summary");
  const locale = useLocale();
  const live = activities.filter((a) => !a.cancelled);
  const cancelled = activities.filter((a) => a.cancelled);

  return (
    <TabsContent value="summary" className="flex flex-col">
      <div className="flex flex-col gap-[2rem]">
        <Collapsible title={t("created")} defaultOpen>
          {live.length > 0 ? (
            <CardGrid items={live} />
          ) : (
            <p className="text-[1.4rem] text-neutral-600">{t("no_activities")}</p>
          )}
        </Collapsible>
        <Collapsible title={t("cancelled")} defaultOpen={false}>
          {cancelled.length > 0 ? (
            <CardGrid items={cancelled} />
          ) : (
            <p className="text-[1.4rem] text-neutral-600">{t("no_cancelled")}</p>
          )}
        </Collapsible>
      </div>

      <div className="h-[2px] w-full bg-neutral-100 my-[3rem]" />

      <div className="flex justify-between gap-4 text-[1.6rem]">
        <span className="text-neutral-600 leading-[2.25rem]">{t("joined_on")}</span>
        <span className="text-deep-100 font-medium leading-[2rem] text-right">
          {formatDate(createdAt, locale, "local")}
        </span>
      </div>
    </TabsContent>
  );
}

/** Figma "Frame 98": 16px neutral-600 label, bulk arrow on the right. */
function Collapsible({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-[2rem]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex justify-between items-center text-neutral-600 text-[1.6rem] leading-[2.25rem] cursor-pointer"
      >
        <span>{title}</span>
        <ArrowDown2
          size="20"
          variant="Bulk"
          color="#737C8A"
          className={cn("transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      {open && children}
    </div>
  );
}

function CardGrid({ items }: { items: ActivityCardData[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-[2rem]">
      {items.map((item) => (
        <li key={item.activityId} className="min-w-0">
          <ActivityCard item={item} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Figma card (4264:77054): 191px picture (10px radius, neutral-100 border),
 * 12px semibold title, a 10px date / location row (country in grey), then the
 * price in bold orange with the currency in grey.
 */
function ActivityCard({ item }: { item: ActivityCardData }) {
  const t = useTranslations("Organisations.profile.summary");
  const locale = useLocale();
  const number = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 });
  const free = item.isFree || (item.priceMax !== null && item.priceMax === 0);
  const amount =
    free || item.priceMin === null || item.priceMax === null
      ? null
      : item.priceMin === item.priceMax
        ? number(item.priceMin)
        : `${number(item.priceMin)}-${number(item.priceMax)}`;
  // Event days are calendar dates; a draw is an instant read in Haiti time.
  const date = item.date
    ? new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: item.date.length === 10 ? "UTC" : "America/Port-au-Prince",
      }).format(new Date(item.date.length === 10 ? `${item.date}T12:00:00Z` : item.date))
    : null;
  // "City, Country": the country is set in grey, as in Figma.
  const split = item.location?.lastIndexOf(", ") ?? -1;
  const place = item.location
    ? split > 0
      ? { main: item.location.slice(0, split + 1), rest: item.location.slice(split + 1) }
      : { main: item.location, rest: "" }
    : null;

  return (
    <Link
      href={HREF[item.type](item.activityId)}
      className="flex flex-col gap-[1rem] pb-[1rem] h-full bg-white rounded-[1rem] overflow-hidden shadow-[0px_15px_25px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_15px_25px_0px_rgba(0,0,0,0.1)] transition-shadow"
    >
      <div className="relative h-[19.1rem] shrink-0 rounded-[1rem] overflow-hidden border border-neutral-100 bg-neutral-100">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 31rem, 90vw"
            className="object-cover"
          />
        )}
        {item.type !== "event" && (
          <span className="absolute top-[1rem] right-[1rem] bg-primary-50 text-primary-500 text-[1rem] leading-[1.5rem] font-bold uppercase rounded-[30px] px-[1rem] py-[.2rem]">
            {t(`types.${item.type}`)}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-[1rem] px-[1rem]">
        <span
          className="text-[1.2rem] leading-[1.65rem] font-semibold text-deep-100 truncate"
          title={item.name}
        >
          {item.name}
        </span>
        {(date || place) && (
          <div className="flex items-center justify-between gap-[1rem] text-[1rem] leading-[1.5rem]">
            {date ? (
              <span className="inline-flex items-center gap-[.5rem] shrink-0 font-medium text-deep-100">
                <Calendar2 size="15" variant="Bulk" color="#2E3237" />
                {date}
              </span>
            ) : (
              <span />
            )}
            {place && (
              <span className="inline-flex items-center gap-[.5rem] min-w-0">
                <Location size="15" variant="Bulk" color="#2E3237" className="shrink-0" />
                <span className="truncate text-right">
                  <span className="font-medium text-deep-100">{place.main}</span>
                  <span className="text-neutral-700">{place.rest}</span>
                </span>
              </span>
            )}
          </div>
        )}
        {(free || amount) && (
          <span className="text-[1.2rem] leading-[1.5rem] text-primary-500">
            {free ? (
              <span className="font-bold">{t("free")}</span>
            ) : (
              <>
                <span className="font-bold">{amount}</span>{" "}
                <span className="text-neutral-700 leading-[1.65rem]">{item.currency}</span>
              </>
            )}
          </span>
        )}
      </div>
    </Link>
  );
}
