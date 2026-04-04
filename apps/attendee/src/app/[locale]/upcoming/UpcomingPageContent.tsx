/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import UpcomingCard from "@/components/UpcomingCard";
import { slugify } from "@/lib/Slugify";
import { CloseCircle, Money3, SearchNormal, Star } from "iconsax-reactjs";
import { DateTime } from "luxon";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function UpcomingPageContent({ events }: { events: any }) {
  const t = useTranslations("Upcoming");
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const filteredEvents = events.filter((event: any) => {
    const search = query.toLowerCase();
    return event.eventName.toLowerCase().includes(search);
  });

  const [mobileSearch, setMobileSearch] = useState(false);
  return (
    <>
      <header className="w-full flex items-center justify-between">
        {!mobileSearch && (
          <div className="flex flex-col gap-2">
            {session?.user && (
              <span className="text-[1.6rem] leading-8 text-neutral-600">
                {t("subtitle")}{" "}
                <span className="text-deep-100">{session?.user.firstName}</span>
              </span>
            )}
            <span className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-10 lg:leading-12 text-black">
              {t("title")}
            </span>
          </div>
        )}
        <div className={`flex items-center gap-4 ${mobileSearch && "w-full"}`}>
          {mobileSearch && (
            <div
              className={
                "bg-neutral-100 w-full rounded-[30px] flex items-center justify-between lg:hidden px-6 py-4"
              }
            >
              <input
                placeholder={t("search")}
                className={
                  "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
                }
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                onClick={() => {
                  setMobileSearch(!mobileSearch);
                  setQuery("");
                }}
              >
                <CloseCircle size="20" color="#737c8a" variant="Bulk" />
              </button>
            </div>
          )}
          <div
            className={
              "hidden bg-neutral-100 rounded-[30px] lg:flex items-center justify-between w-[24.3rem] px-6 py-4"
            }
          >
            <input
              placeholder={t("search")}
              className={
                "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
              }
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchNormal size="20" color="#737c8a" variant="Bulk" />
          </div>
          {!mobileSearch && (
            <button
              onClick={() => setMobileSearch(!mobileSearch)}
              className={
                "w-14 h-14 bg-neutral-100 rounded-full flex lg:hidden items-center justify-center"
              }
            >
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </button>
          )}
        </div>
      </header>
      <ul className="list pt-4">
        {filteredEvents.map((event: any) => {
          const today = DateTime.now();
          const eventStart = event.eventDays?.[0]?.eventDate
            ? DateTime.fromISO(event.eventDays[0].eventDate)
            : null;
          const daysLeft = eventStart
            ? eventStart.diff(today, "days").days
            : null;
          const roundedDays = Math.ceil(
            daysLeft && daysLeft > 0 ? daysLeft : 0,
          );
          const slug = slugify(event.eventName, event.eventId);
          return (
            <li key={event.eventId}>
              <UpcomingCard
                href={`upcoming/${slug}`}
                image={event.eventImageUrl}
                name={event.eventName}
                day={roundedDays}
                tickets={event.tickets.length}
              />
            </li>
          );
        })}
      </ul>
      {events.length > 0 && filteredEvents.length === 0 && (
        <div className="flex flex-col h-full justify-center items-center gap-12">
          <div className="h-48 w-48 bg-neutral-100 rounded-full flex items-center justify-center">
            <div className="w-36 h-36 bg-neutral-200 flex items-center justify-center rounded-full">
              <Star size="50" color="#0D0D0D" variant="Bulk" />
            </div>
          </div>
          <span className="font-primary text-[1.8rem] text-center leading-8 text-neutral-600">
            {t("noResult")} <span className="text-deep-100">{query}</span>
          </span>
        </div>
      )}
      {events.length === 0 && (
        <div
          className={
            "w-132 lg:w-184 mx-auto h-full flex flex-col items-center justify-center gap-20"
          }
        >
          <div
            className={
              "w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100"
            }
          >
            <div
              className={
                "w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200"
              }
            >
              <Money3 size="50" color="#0d0d0d" variant="Bulk" />
            </div>
          </div>
          <div className={"flex flex-col gap-12 items-center text-center"}>
            <p
              className={
                "text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]"
              }
            >
              {t("description")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
