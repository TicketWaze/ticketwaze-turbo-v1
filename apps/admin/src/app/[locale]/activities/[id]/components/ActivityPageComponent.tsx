"use client";
import BackButton from "@/components/shared/BackButton";
import { ButtonBlack } from "@/components/shared/buttons";
import EventImageLightbox from "@/components/shared/EventImageLightbox";
import { EventStatusDialog } from "./EventStatusDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar2, Location, Clock } from "iconsax-reactjs";
import Separator from "@/components/shared/Separator";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ActivityAttendances } from "./ActivityAttendances";
import { Event } from "@ticketwaze/typescript-config";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import { DateTime } from "luxon";

export default function ActivityPageComponent({ event }: { event: Event }) {
  const t = useTranslations("Activities");

  const orgInitial = event.organisation.organisationName
    .charAt(0)
    .toUpperCase();
  const followersCount =
    event.organisation.followersCount ??
    event.organisation.followers?.length ??
    0;
  const locale = useLocale();

  // A teaser has no eventDays and no ticket types, so nothing here may assume
  // a first day exists. Its date, when it has one, is the plain "YYYY-MM-DD"
  // comingSoonDate — parsed with an explicit T00:00:00 so it is not read as UTC
  // and rendered as the previous day west of Greenwich.
  const firstDay = event.eventDays?.find((day) => day.dayNumber === 1);
  const teaserDate = event.comingSoonDate
    ? new Date(`${event.comingSoonDate}T00:00:00`)
    : null;

  const formattedDate = firstDay
    ? formatDate(firstDay.eventDate, locale, firstDay.timezone)
    : teaserDate
      ? teaserDate
          .toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
          .toUpperCase()
      : (event.comingSoonHint ?? "-");
  const formattedTime = firstDay
    ? `${formatTime(
        firstDay.startTime,
        firstDay.timezone,
        locale,
      )} - ${formatTime(firstDay.endTime, firstDay.timezone, locale)}`
    : "-";

  // Online events are flagged by eventCategory ("meet"), not eventType
  // (which holds public/private); they have no address fields.
  const isMeetEvent = event.eventCategory === "meet";
  // A teaser may have no venue at all, and joining nulls prints a bare comma.
  const address = isMeetEvent
    ? "Google Meet"
    : [event.address, event.city, event.state, event.country]
        .filter(Boolean)
        .join(", ") || "-";

  const soldTickets = (event.tickets ?? []).filter(
    (o) => o.status !== "RETURNED",
  );
  const totalRevenue =
    event.currency === "HTG"
      ? soldTickets.reduce((sum, o) => sum + o.ticketPrice, 0)
      : soldTickets.reduce((sum, o) => sum + o.ticketUsdPrice, 0);

  const ticketTypes = event.eventTicketTypes ?? [];
  const totalSold = ticketTypes.reduce(
    (sum, t) => sum + t.ticketTypeQuantitySold,
    0,
  );
  const totalCapacity = ticketTypes.reduce(
    (sum, t) => sum + t.ticketTypeQuantity,
    0,
  );
  const ticketsLeft = totalCapacity - totalSold;

  const today = DateTime.now();
  const eventStart = firstDay
    ? DateTime.fromISO(firstDay.eventDate)
    : teaserDate
      ? DateTime.fromJSDate(teaserDate)
      : null;
  const daysLeft = eventStart
    ? Math.ceil(Math.max(eventStart.diff(today, "days").days, 0))
    : null;
  const countdownText =
    daysLeft === null
      ? "-"
      : daysLeft <= 0
        ? "Event passed"
        : `${daysLeft} days to go`;

  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">
      <BackButton text={t("activity.back")}></BackButton>
      <div className="flex justify-between items-center">
        <h2 className="items-center font-primary leading-12 font-medium text-[2.6rem]">
          {event.eventName}
        </h2>
        <EventStatusDialog event={event} className="hidden lg:flex" />
      </div>
      <main className="w-full gap-16 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-[15fr_21fr]">
        <div className="flex flex-col gap-8 lg:overflow-y-auto lg:min-h-0">
          <EventStatusDialog event={event} className="lg:hidden" />
          <EventImageLightbox
            src={event.eventImageUrl}
            width={400}
            height={298}
            alt={event.eventName}
          />
          <Separator />
          <div className="flex flex-col gap-4">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("activity.about.title")}
            </span>
            <div
              className="rich-text text-[1.5rem] leading-8 text-neutral-700"
              dangerouslySetInnerHTML={{ __html: event.eventDescription }}
            />
          </div>
          <Separator />
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
                {t("activity.details.title")}
              </span>
              {/* organizer */}
              <div className="flex items-center justify-between w-full">
                <Link
                  href={`/organisations/${event.organisationId}`}
                  className="flex items-center gap-4"
                >
                  <div className="flex rounded-full w-14 h-14 bg-black justify-center items-center">
                    <p className="font-medium text-white leading-12 text-[2.2rem] font-primary">
                      {orgInitial}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
                      {event.organisation.organisationName}
                    </span>
                    <span className="font-normal text-[1.3rem] leading-8 text-neutral-600">
                      {followersCount} followers
                    </span>
                  </div>
                </Link>
                <Link href={`/organisations/${event.organisationId}`}>
                  <ButtonBlack className="w-fit">
                    {t("activity.details.button.view")}
                  </ButtonBlack>
                </Link>
              </div>
              <div className="flex justify-between">
                {/* date */}
                <div className="flex items-center gap-2">
                  <div className="w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full">
                    <Calendar2 size="20" color="#737c8a" variant="Bulk" />
                  </div>
                  <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
                    {formattedDate}
                  </span>
                </div>
                {/* time */}
                <div className="flex items-center gap-2">
                  <div className="w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full">
                    <Clock size="20" color="#737c8a" variant="Bulk" />
                  </div>
                  <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
                    {formattedTime}
                  </span>
                </div>
              </div>
              {/* address / Google Meet */}
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full">
                  {isMeetEvent ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  ) : (
                    <Location size="20" color="#737c8a" variant="Bulk" />
                  )}
                </div>
                <span className="font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[29.3rem]">
                  {address}
                </span>
              </div>
            </div>
          </div>
          <div></div>
        </div>

        <div className="lg:overflow-y-auto lg:min-h-0">
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="w-full lg:w-fit mx-auto lg:mx-0 mb-8">
              <TabsTrigger value="performance">
                {t("activity.resume.performance.title")}
              </TabsTrigger>
              <TabsTrigger value="attendance">
                {t("activity.resume.attendance.title")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="performance">
              <ul className="flex flex-col pt-4 gap-8 overflow-y-scroll">
                <li className="flex justify-between">
                  <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                    {t("activity.resume.performance.total")}
                  </span>
                  <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
                    {totalRevenue.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {event.currency}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                    {t("activity.resume.performance.tickets.sold")}
                  </span>
                  <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
                    {totalSold.toLocaleString()}/
                    {totalCapacity.toLocaleString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                    {t("activity.resume.performance.tickets.left")}
                  </span>
                  <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
                    {ticketsLeft.toLocaleString()}/
                    {totalCapacity.toLocaleString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                    {t("activity.resume.performance.counter")}
                  </span>
                  <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
                    {countdownText}
                  </span>
                </li>
              </ul>
            </TabsContent>
            <ActivityAttendances event={event} />
          </Tabs>
        </div>
        <div className="lg:hidden"></div>
      </main>
    </div>
  );
}
