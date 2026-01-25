"use client";
import { Link } from "@/i18n/navigation";
import { Calendar2, Google, Location } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { englishEventTags, frenchEventTags } from "@/lib/EventTags";
import TimesTampToDateTime from "@/lib/TimesTampToDateTime";
import Slugify from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";

function EventCard({ event, aside }: { event: Event; aside?: boolean }) {
  const date = TimesTampToDateTime(event.eventDays[0]?.startDate ?? "");
  const slug = Slugify(event.eventName);
  const locale = useLocale();
  const eventTags = locale === "fr" ? frenchEventTags : englishEventTags;
  const t = useTranslations("Events");
  const price =
    event.currency === "USD"
      ? (event.eventTicketTypes[0]?.usdPrice ?? 0)
      : (event.eventTicketTypes[0]?.ticketTypePrice ?? 0);
  return (
    <Link
      href={`/events/show/${slug}`}
      className={`flex flex-row items-center lg:items-stretch lg:mb-8 lg:ml-4 lg:flex-col gap-4 w-full ${!aside && "lg:max-w-[350px]"} bg-white shadow-lg rounded-[1rem] overflow-hidden pb-4 pl-4 lg:pl-0`}
    >
      <Image
        src={event.eventImageUrl}
        className={
          "h-[155px] lg:h-[191px] flex-1 lg:flex-auto w-[155px] lg:w-full object-cover object-left-top rounded-[1rem] "
        }
        alt={event.eventName}
        height={191}
        width={255}
      />
      <div
        className={
          "px-4 flex flex-1 lg:flex-auto flex-col gap-[1.5rem] lg:gap-4"
        }
      >
        <ul className="lg:flex  items-center gap-4">
          {eventTags
            .filter((tag) => tag.id === event.eventTagId)
            .map((tag) => (
              <li
                key={tag.id}
                className="bg-primary-50 hidden lg:block py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary leading-[15px]"
              >
                {tag.tag}
              </li>
            ))}
          {eventTags
            .filter((tag) => tag.id === event.eventTagId)
            .map((tag) => (
              <li
                key={tag.id}
                className="bg-primary-50 lg:hidden justify-self-start py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary w-auto leading-[15px]"
              >
                {tag.tag}
              </li>
            ))}
        </ul>
        <h1
          className={
            "font-bold font-primary text-[1.2rem] text-deep-100 leading-[17px]"
          }
        >
          {event.eventName}
        </h1>
        <div
          className={
            "flex flex-col lg:flex-row gap-[1.5rem]  lg:items-center justify-between"
          }
        >
          <div className={"flex items-center gap-[5px]"}>
            <Calendar2 size="15" color="#2e3237" variant="Bulk" />
            <span
              className={"font-medium text-[1rem] text-deep-100 leading-[15px]"}
            >
              {date.day}
              {"/"}
              {date.month}
              {"/"}
              {date.year}
            </span>
          </div>
          {event.eventType === "meet" ? (
            <div className={"flex items-center gap-[5px]"}>
              <Google size="15" color="#2e3237" variant="Bulk" />
              <p
                className={
                  "font-medium text-[1rem] text-deep-100 leading-[15px]"
                }
              >
                Meet, <span className={"text-neutral-700"}>Google</span>
              </p>
            </div>
          ) : (
            <div className={"flex items-center gap-[5px]"}>
              <Location size="15" color="#2e3237" variant="Bulk" />
              <p
                className={
                  "font-medium text-[1rem] text-deep-100 leading-[15px]"
                }
              >
                {event.city},{" "}
                <span className={"text-neutral-700"}>{event.country}</span>
              </p>
            </div>
          )}
        </div>
        <p className="font-bold text-[1.2rem] leading-[15px] text-primary-500">
          {price > 0 ? (
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
