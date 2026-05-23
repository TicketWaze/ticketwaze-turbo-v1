"use client";
import { slugify } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import {
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Calendar2, Clock, Edit2, Location, Warning2 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { LinkPrimary } from "@/components/shared/Links";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import { DateTime } from "luxon";

export default function EventDrawerContent({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event");
  const date = event.eventDays;
  const locale = useLocale();
  const today = DateTime.now();
  const eventStart = event.eventDays?.[0]?.eventDate
    ? DateTime.fromISO(event.eventDays[0].eventDate)
    : null;
  const daysLeft = eventStart ? eventStart.diff(today, "days").days : null;
  return (
    <DrawerContent className={"my-6 p-6 lg:p-12 rounded-[30px]  lg:w-[580px]"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-[40px]"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black"
            }
          >
            {t("event_details")}
          </span>
        </DrawerTitle>
        <DrawerDescription className="sr-only">Event details</DrawerDescription>
        <div className={"w-full"}>
          <div className={"w-full gap-[30px] flex flex-col"}>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <Image
                alt={event.eventName}
                src={event.eventImageUrl}
                height={298}
                width={520}
                className={"rounded-[10px] h-[298px] object-cover object-top"}
              />
            </div>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <div className="flex items-center justify-between">
                <span
                  className={
                    "font-primary text-deep-100 font-medium text-[1.8rem]"
                  }
                >
                  {t("about")}
                </span>
              </div>
              <p className={"text-[1.5rem] text-neutral-700"}>
                {event.eventDescription}
              </p>
            </div>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <span
                className={
                  "font-primary text-deep-100 font-medium text-[1.8rem]"
                }
              >
                {t("event_details")}
              </span>
              {date
                .sort((a, b) => a.dayNumber - b.dayNumber)
                .map((eventDate) => {
                  return (
                    <li key={eventDate.eventDayId}>
                      <div className={"flex items-center gap-[5px]"}>
                        <div
                          className={
                            "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                          }
                        >
                          <Calendar2 size="20" color="#737c8a" variant="Bulk" />
                        </div>
                        <span
                          className={
                            "font-normal text-[1.4rem] leading-8 text-deep-200"
                          }
                        >
                          {formatDate(
                            eventDate.eventDate,
                            locale,
                            eventDate.timezone,
                          )}
                        </span>
                      </div>
                      <div className={"flex items-center gap-[5px]"}>
                        <div
                          className={
                            "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                          }
                        >
                          <Clock size="20" color="#737c8a" variant="Bulk" />
                        </div>
                        <span
                          className={
                            "font-normal text-[1.4rem] leading-8 text-deep-200"
                          }
                        >
                          {formatTime(
                            eventDate.startTime,
                            eventDate.timezone,
                            locale,
                          )}{" "}
                          -{" "}
                          {formatTime(
                            eventDate.endTime,
                            eventDate.timezone,
                            locale,
                          )}{" "}
                          - {eventDate.timezone}
                        </span>
                      </div>
                    </li>
                  );
                })}
              <div className={"flex items-center gap-[5px] "}>
                <div
                  className={
                    "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                  }
                >
                  <Location size="20" color="#737c8a" variant="Bulk" />
                </div>
                <span
                  className={
                    "font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[293px]"
                  }
                >
                  {event.address}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DrawerFooter className="lg:flex-row pb-0">
        {event.deletionStatus != null ? (
          <div className="flex-1 flex items-center gap-3 rounded-[100px] border border-amber-300 bg-amber-50 px-5 py-[14px] text-amber-700 text-[1.4rem] font-medium leading-8 cursor-not-allowed">
            <Warning2 variant="Bulk" color="#b45309" size={20} />
            <span>This event is pending deletion and cannot be edited.</span>
          </div>
        ) : (
          daysLeft !== null && daysLeft > 0 && (
            <LinkPrimary
              href={`/events/show/${slugify(event.eventName, event.eventId)}/edit/${event.eventCategory}`}
              className="flex-1 gap-4"
            >
              <Edit2 variant={"Bulk"} color={"#ffffff"} size={20} /> {t("edit")}
            </LinkPrimary>
          )
        )}
      </DrawerFooter>
    </DrawerContent>
  );
}
