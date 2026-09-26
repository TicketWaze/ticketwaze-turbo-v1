"use client";
import { Calendar2, Google, Location, Video } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Event } from "@ticketwaze/typescript-config";
import { slugify } from "@/lib/activityCard/Slugify";
import formatDate from "@/lib/activityCard/FormatDate";
import { getActivityCardPrice } from "@/lib/activityCard/activityCardPrice";
import { getActivityCardDay } from "@/lib/activityCard/activityCardDate";

/**
 * The attendee app's event card (apps/attendee/src/components/shared/
 * EventCard.tsx), for the landing page. Keep the two looking alike.
 *
 * Differences: it opens the event in the attendee app, in a new tab so the
 * landing page stays put, and it carries a "Sponsored" tag.
 */
export default function EventCard({ event }: { event: Event }) {
  const isTeaser = event.isComingSoon === true;
  const date = getActivityCardDay(event);
  const slug = slugify(event.eventName, event.eventId);
  const locale = useLocale();
  const t = useTranslations("HomePage.sponsored");
  const ticketTypes = event.eventTicketTypes ?? [];
  const cardPrice = getActivityCardPrice(event);
  const isSoldOut =
    ticketTypes.length > 0 &&
    ticketTypes.every(
      (tt) => tt.ticketTypeQuantity - tt.ticketTypeQuantitySold <= 0,
    );

  return (
    <a
      href={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-row items-center lg:items-stretch lg:flex-col gap-4 w-full bg-white shadow-lg rounded-[10px] overflow-hidden pb-4 pt-4 lg:pt-0 pl-4 lg:pl-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative">
        <Image
          src={event.eventImageUrl}
          className="h-62 w-62 min-w-62 lg:h-[19.1rem] flex-1 lg:flex-auto lg:w-full object-cover object-top-left rounded-[10px]"
          alt={event.eventName}
          height={191}
          width={255}
        />
        <div className="bg-primary-50 hidden lg:block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary font-bold leading-6 w-fit">
          {event.eventType.toUpperCase()}
        </div>
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
          <div className="bg-primary-500 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {t("tag")}
          </div>
          {isSoldOut && (
            <div className="bg-red-600 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
              {t("soldOut")}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 flex flex-1 lg:flex-auto flex-col gap-6 lg:gap-4">
        <ul className="hidden lg:flex gap-2 text-primary-500 font-medium text-[1.2rem]">
          {event.activityTags.map((tag, key) => (
            <li key={key}>#{tag}</li>
          ))}
        </ul>
        <div className="flex flex-col w-full gap-1">
          <h3 className="font-bold font-primary text-[1.4rem] text-deep-100 leading-[1.9rem] line-clamp-2">
            {event.eventName}
          </h3>
          <ul className="flex gap-2 lg:hidden text-primary-500 font-medium text-[1.2rem]">
            {event.activityTags.slice(0, 2).map((tag, key) => (
              <li key={key}>#{tag}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar2 size="15" color="#2e3237" variant="Bulk" />
            <span className="font-medium text-[1.2rem] text-deep-100 leading-6">
              {/* A bare "YYYY-MM-DD" teaser date gets T00:00:00 so it parses as
                  local time rather than UTC (which can show the day before). */}
              {date
                ? formatDate(date.eventDate, locale, date.timezone)
                : event.comingSoonDate
                  ? new Date(
                      `${event.comingSoonDate}T00:00:00`,
                    ).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : (event.comingSoonHint ?? t("comingSoon"))}
            </span>
          </div>
          {isTeaser && !event.city ? null : event.eventCategory === "meet" ? (
            <div className="flex items-center gap-2">
              {event.onlineProvider === "zoom" ? (
                <Video size="15" color="#2e3237" variant="Bulk" />
              ) : (
                <Google size="15" color="#2e3237" variant="Bulk" />
              )}
              <p className="font-medium text-[1.2rem] text-deep-100 leading-6">
                {event.onlineProvider === "zoom" ? (
                  <span className="text-neutral-700">Zoom</span>
                ) : (
                  <>
                    Meet, <span className="text-neutral-700">Google</span>
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Location size="15" color="#2e3237" variant="Bulk" />
              <p className="font-medium text-[1.2rem] text-deep-100 leading-6">
                {event.city},{" "}
                <span className="text-neutral-700">{event.country}</span>
              </p>
            </div>
          )}
        </div>
        <p className="font-bold text-[1.4rem] leading-6 text-primary-500">
          {cardPrice.kind === "teaser" ? (
            t("comingSoon")
          ) : cardPrice.kind === "priced" ? (
            <>
              {t("from")} {cardPrice.amount.toLocaleString()}{" "}
              <span className="font-normal text-neutral-700">
                {cardPrice.currency}
              </span>
            </>
          ) : (
            t("free")
          )}
        </p>
      </div>
    </a>
  );
}
