"use client";
import { Link } from "@/i18n/navigation";
import { Calendar2, Google, Location } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { slugify } from "@/lib/slugify";
import { Event } from "@ticketwaze/typescript-config";

function EventCard({ event, aside }: { event: Event; aside?: boolean }) {
  const date = new Date(event.eventDays[0].dateTime);
  const slug = slugify(event.eventName, event.eventId);
  const locale = useLocale();
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
      <div className="relative">
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
          key={event.eventType}
          className="bg-primary-50 block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary font-bold leading-[15px] w-fit"
        >
          {event.eventType.toUpperCase()}
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
              "font-bold font-primary text-[1.2rem] text-deep-100 leading-[17px]"
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
            "flex flex-col lg:flex-row gap-[1.5rem]  lg:items-center justify-between"
          }
        >
          <div className={"flex items-center gap-[5px]"}>
            <Calendar2 size="15" color="#2e3237" variant="Bulk" />
            <span
              className={"font-medium text-[1rem] text-deep-100 leading-[15px]"}
            >
              {date.toLocaleDateString(locale)}
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
