"use client";
import BackButton from "@/components/shared/BackButton";
import { ButtonBlack } from "@/components/shared/buttons";
import { EventStatusDialog } from "./EventStatusDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar2, Location, Clock } from "iconsax-reactjs";
import Separator from "@/components/shared/Separator";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
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
  const followersCount = event.organisation.followers?.length ?? 0;
  const locale = useLocale();
  const firstDay = event.eventDays.find((day) => day.dayNumber === 1)!;
  const formattedDate = formatDate(
    firstDay.eventDate,
    locale,
    firstDay.timezone,
  );
  const formattedTime = `${formatTime(
    firstDay.startTime,
    firstDay.timezone,
    locale,
  )} - ${formatTime(firstDay.endTime, firstDay.timezone, locale)}`;

  const address =
    event.eventType === "meet"
      ? "Google Meet"
      : `${event.address}, ${event.city}, ${event.state}, ${event.country}`;

  const totalRevenue = event.orders
    .filter((o) => o.status === "SUCCESSFUL")
    .reduce((sum, o) => sum + o.amount, 0);

  const totalSold = event.eventTicketTypes.reduce(
    (sum, t) => sum + t.ticketTypeQuantitySold,
    0,
  );
  const totalCapacity = event.eventTicketTypes.reduce(
    (sum, t) => sum + t.ticketTypeQuantity,
    0,
  );
  const ticketsLeft = totalCapacity - totalSold;

  const today = DateTime.now();
  const eventStart = DateTime.fromISO(
    event.eventDays.filter((event) => event.dayNumber === 1)[0].eventDate,
  );
  const daysLefts = eventStart ? eventStart.diff(today, "days").days : null;
  const daysLeft = Math.ceil(daysLefts && daysLefts > 0 ? daysLefts : 0);
  const countdownText =
    daysLeft === null
      ? "-"
      : daysLeft <= 0
        ? "Event passed"
        : `${daysLeft} days to go`;

  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">
      <BackButton text={t("activity.back")}></BackButton>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="items-center font-primary leading-12 font-medium text-[2.6rem]">
          {event.eventName}
        </h2>
        <EventStatusDialog event={event} />
      </div>
      <main className="w-full gap-16 flex flex-col lg:grid lg:grid-cols-[15fr_21fr] lg:min-h-0">
        <div className="flex flex-col gap-8 overflow-y-auto min-h-0 max-h-[calc(100vh-200px)]">
          <div className="w-fit max-h-[29.8rem] overflow-hidden rounded-[10px] shrink-0">
            <Image
              src={event.eventImageUrl}
              width={400}
              height={298}
              alt="img"
              className="w-full"
            />
          </div>
          <Separator />
          <div className="flex flex-col gap-4">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("activity.about.title")}
            </span>
            <p className="text-[1.5rem] leading-12 text-neutral-700">
              {event.eventDescription}
            </p>
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
              {/* address */}
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full">
                  <Location size="20" color="#737c8a" variant="Bulk" />
                </div>
                <span className="font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[29.3rem]">
                  {address}
                </span>
              </div>
            </div>
          </div>
          <div></div>
        </div>

        <div className="min-h-[75vh]">
          <Tabs defaultValue="performance" className="w-full h-full">
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
      </main>
    </div>
  );
}
