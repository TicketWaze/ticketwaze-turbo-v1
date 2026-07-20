"use client";
import { Link } from "@/i18n/navigation";
import { Calendar2, Google, Location } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { slugify } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import formatDate from "@/lib/FormatDate";
import { getActivityCardPrice } from "@/lib/activityCardPrice";

function EventCard({
  event,
  aside,
  htgExchangeRate,
}: {
  event: Event;
  aside?: boolean;
  htgExchangeRate?: number;
}) {
  const now = new Date();
  // A teaser has no eventDays and no ticket types, so `date` is undefined here
  // and every read below has to tolerate that.
  const isTeaser = event.isComingSoon === true;
  const sortedDays = [...(event.eventDays ?? [])].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
  );
  const date =
    sortedDays.find((eventDay) => new Date(eventDay.eventDate) >= now) ??
    sortedDays[sortedDays.length - 1];
  const slug = slugify(event.eventName, event.eventId);
  const locale = useLocale();
  const t = useTranslations("Event");
  const ticketTypes = event.eventTicketTypes ?? [];
  // The all-in price the buyer actually pays, fees included — MonCash for HTG
  // activities, Stripe for USD ones.
  const cardPrice = getActivityCardPrice(event, htgExchangeRate);
  const isSoldOut =
    ticketTypes.length > 0 &&
    ticketTypes.every(
      (tt) => tt.ticketTypeQuantity - tt.ticketTypeQuantitySold <= 0,
    );
  return (
    <Link
      href={`/explore/${slug}`}
      className={`flex flex-row items-center lg:items-stretch lg:mb-8 lg:ml-4 lg:flex-col gap-4 w-full ${!aside && "lg:max-w-140"} bg-white shadow-lg rounded-[10px] overflow-hidden pb-4 pl-4 lg:pl-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="relative">
        <Image
          src={event.eventImageUrl}
          className={
            "h-62 w-62 min-w-62 lg:max-h-[19.1rem] flex-1 lg:flex-auto lg:w-full object-cover object-top-left rounded-[10px] "
          }
          alt={event.eventName}
          height={191}
          width={255}
        />
        <div
          key={event.eventType}
          className="bg-primary-50 block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary font-bold leading-6 w-fit"
        >
          {event.eventType.toUpperCase()}
        </div>
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
          {isSoldOut && (
            <div className="bg-red-600 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
              {t("soldOut")}
            </div>
          )}
          {event.isPrivate && (
            <div className="bg-deep-100 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
              {t("private")}
            </div>
          )}
        </div>
      </div>

      <div className={"px-4 flex flex-1 lg:flex-auto flex-col gap-6 lg:gap-4"}>
        <ul className="hidden lg:flex gap-2 text-primary-500 font-medium">
          {event.activityTags.map((tag, key) => {
            return <li key={key}>#{tag}</li>;
          })}
        </ul>
        <div className="flex flex-col w-full gap-1">
          <h1
            className={
              "font-bold font-primary text-[1.2rem] text-deep-100 leading-[1.7rem]"
            }
          >
            {event.eventName}
          </h1>
          <ul className="flex gap-2 lg:hidden text-primary-500 font-medium">
            {event.activityTags.slice(0, 2).map((tag, key) => {
              return <li key={key}>#{tag}</li>;
            })}
          </ul>
        </div>
        <div
          className={
            "flex flex-col lg:flex-row gap-6  lg:items-center justify-between"
          }
        >
          <div className={"flex items-center gap-2"}>
            <Calendar2 size="15" color="#2e3237" variant="Bulk" />
            <span className={"font-medium text-[1rem] text-deep-100 leading-6"}>
              {/* Date, then hint, then the bare label. The teaser date is a
                  plain "YYYY-MM-DD"; appending T00:00:00 forces local parsing,
                  since a bare date string is read as UTC and can render as the
                  previous day west of Greenwich. */}
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
                  : (event.comingSoonHint ?? t("coming_soon_label"))}
            </span>
          </div>
          {/* A teaser may have no venue at all; rendering "city, country" from
              two nulls prints a bare comma. */}
          {isTeaser && !event.city ? null : event.eventCategory === "meet" ? (
            <div className={"flex items-center gap-2"}>
              <Google size="15" color="#2e3237" variant="Bulk" />
              <p className={"font-medium text-[1rem] text-deep-100 leading-6"}>
                Meet, <span className={"text-neutral-700"}>Google</span>
              </p>
            </div>
          ) : (
            <div className={"flex items-center gap-2"}>
              <Location size="15" color="#2e3237" variant="Bulk" />
              <p className={"font-medium text-[1rem] text-deep-100 leading-6"}>
                {event.city},{" "}
                <span className={"text-neutral-700"}>{event.country}</span>
              </p>
            </div>
          )}
        </div>
        <p className="font-bold text-[1.2rem] leading-6 text-primary-500">
          {/* A teaser has no ticket types at all, so there is no price to
              quote. Showing "Free" would advertise something that is not on
              sale. */}
          {cardPrice.kind === "teaser" ? (
            t("coming_soon_label")
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
    </Link>
  );
}

export default EventCard;
