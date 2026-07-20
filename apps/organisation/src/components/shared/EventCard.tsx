"use client";
import { Link } from "@/i18n/navigation";
import { Calendar2, Google, Location } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { slugify } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import FormatDate from "@/lib/FormatDate";

function EventCard({
  event,
  aside,
  ongoing,
}: {
  event: Event;
  aside?: boolean;
  ongoing?: boolean;
}) {
  // A coming-soon teaser has no days, no ticket types and often no city, so
  // every one of those reads below has to be guarded rather than assumed.
  const isTeaser = event.isComingSoon === true;
  const date = event.eventDays?.filter(
    (eventDay) => eventDay.dayNumber === 1,
  )[0];
  const slug = slugify(event.eventName, event.eventId);
  const locale = useLocale();
  const t = useTranslations("Events");
  const price =
    event.currency === "USD"
      ? (event.eventTicketTypes?.[0]?.usdPrice ?? 0)
      : (event.eventTicketTypes?.[0]?.ticketTypePrice ?? 0);
  return (
    <Link
      // The management page is built entirely around tickets, attendees and
      // check-ins, none of which a teaser has — it reads eventDays[0] in
      // several places and would crash. Teasers go to their own edit view.
      href={isTeaser ? `/events/coming-soon/${slug}` : `/events/show/${slug}`}
      className={`flex flex-row items-center lg:items-stretch lg:mb-8 lg:ml-4 lg:flex-col gap-4 w-full ${!aside && "lg:max-w-140"} bg-white shadow-lg rounded-2xl overflow-hidden pb-4 pl-4 lg:pl-0`}
    >
      <div className="relative">
        <Image
          src={event.eventImageUrl}
          className={
            "h-62 lg:h-[19.1rem] flex-1 lg:flex-auto w-62 lg:w-full object-cover object-top-left rounded-2xl "
          }
          alt={event.eventName}
          height={191}
          width={255}
        />
        {event.adminStatus === "requested" && (
          <div className="bg-neutral-900 block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {event.adminStatus.toUpperCase()}
          </div>
        )}
        {event.adminStatus === "review" && (
          <div className="bg-warning block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {event.adminStatus.toUpperCase()}
          </div>
        )}
        {event.adminStatus === "approved" && event.deletionStatus !== "deleted" && (
          <div className="bg-success block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {event.adminStatus.toUpperCase()}
          </div>
        )}
        {event.deletionStatus === "deleted" && (
          <div className="bg-neutral-500 block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {t("deleted").toUpperCase()}
          </div>
        )}
        {ongoing && (
          <div className="bg-success absolute top-4 left-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit flex items-center gap-2">
            <span className="w-[6px] h-[6px] rounded-full bg-white animate-pulse shrink-0" />
            {t("ongoing").toUpperCase()}
          </div>
        )}
        {event.adminStatus === "rejected" && (
          <div className="bg-failure block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {event.adminStatus.toUpperCase()}
          </div>
        )}
        <div className="bg-primary-50 block absolute bottom-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary font-bold leading-6 w-fit">
          {event.eventType.toUpperCase()}
        </div>
      </div>

      <div
        className={
          "px-4 flex flex-1 lg:flex-auto min-w-0 flex-col gap-6 lg:gap-4"
        }
      >
        <ul className="hidden lg:flex gap-2 text-primary-500 font-medium">
          {event.activityTags.map((tag, key) => {
            return <li key={key}>#{tag}</li>;
          })}
        </ul>
        <div className="flex flex-col w-full gap-1">
          <h1
            className={
              "font-bold w-full truncate font-primary text-[1.2rem] text-deep-100 leading-6"
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
                ? FormatDate(date.eventDate, locale, date.timezone)
                : event.comingSoonDate
                  ? new Date(`${event.comingSoonDate}T00:00:00`).toLocaleDateString(
                      locale,
                      { day: "numeric", month: "short", year: "numeric" },
                    )
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
          {/* A teaser has no ticket types, so its price computes to 0. Showing
              "Free" would advertise something that is not on sale at all. */}
          {isTeaser ? (
            t("coming_soon_label")
          ) : price > 0 ? (
            <>
              {t("from")} {price}{" "}
              <span className="font-normal text-neutral-700">
                {event.currency}
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
