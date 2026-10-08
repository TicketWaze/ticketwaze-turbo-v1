/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import UpcomingCard from "@/components/UpcomingCard";
import { slugify } from "@/lib/Slugify";
import { MyRaffle } from "@ticketwaze/typescript-config";
import { Money3, Star } from "iconsax-reactjs";
import ListPageHeader from "@/components/ListPageHeader";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function UpcomingPageContent({
  events,
  raffles,
}: {
  events: any;
  raffles?: MyRaffle[];
}) {
  const t = useTranslations("Upcoming");
  const [query, setQuery] = useState("");
  const list: any[] = Array.isArray(events) ? events : [];
  const raffleList: MyRaffle[] = Array.isArray(raffles) ? raffles : [];
  const search = query.toLowerCase();
  const filteredEvents = list.filter((event: any) =>
    event?.eventName?.toLowerCase().includes(search),
  );
  // Raffles trail the events rather than being date-sorted into them: an event
  // day is a naive wall-clock date and a draw date is a UTC instant, so mixing
  // them in one sort would compare two different things. The API already
  // returns raffles soonest-draw-first.
  const filteredRaffles = raffleList.filter((raffle) =>
    raffle.title?.toLowerCase().includes(search),
  );
  const totalCount = list.length + raffleList.length;
  const filteredCount = filteredEvents.length + filteredRaffles.length;

  return (
    <>
      <ListPageHeader
        title={t("title")}
        searchPlaceholder={t("search")}
        onSearch={setQuery}
      />
      <>
        <div className="pt-4 overflow-y-scroll flex flex-col gap-8 -mx-4">
          <ul className="list px-4 pb-8">
            {filteredEvents.map((event: any, index) => {
              const slug = slugify(event.eventName, event.eventId);
              return (
                <motion.li
                  key={event.eventId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    delay: Math.min(index * 0.06, 0.3),
                  }}
                >
                  <UpcomingCard
                    href={`upcoming/${slug}`}
                    image={event.eventImageUrl}
                    name={event.eventName}
                    eventDays={event.eventDays ?? []}
                    tickets={event.tickets?.length ?? 0}
                  />
                </motion.li>
              );
            })}
            {filteredRaffles.map((raffle, index) => {
              const slug = slugify(raffle.title, raffle.raffleId);
              return (
                <motion.li
                  key={raffle.raffleId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                    delay: Math.min(
                      (filteredEvents.length + index) * 0.06,
                      0.3,
                    ),
                  }}
                >
                  <UpcomingCard
                    href={`upcoming/raffle/${slug}`}
                    image={raffle.coverImageUrl ?? ""}
                    name={raffle.title}
                    eventDays={[]}
                    countdownTo={raffle.drawAt}
                    draw={{
                      drawnAt: raffle.drawnAt,
                      drawMode: raffle.drawMode,
                    }}
                    tickets={raffle.entries?.length ?? 0}
                    unitLabel={t("entries")}
                  />
                </motion.li>
              );
            })}
          </ul>
        </div>
        <AnimatePresence>
          {totalCount > 0 && filteredCount === 0 && (
            <motion.div
              className="flex flex-col h-full justify-center items-center gap-12"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-48 w-48 bg-neutral-100 rounded-full flex items-center justify-center">
                <div className="w-36 h-36 bg-neutral-200 flex items-center justify-center rounded-full">
                  <Star size="50" color="#0D0D0D" variant="Bulk" />
                </div>
              </div>
              <span className="font-primary text-[1.8rem] text-center leading-8 text-neutral-600">
                {t("noResult")} <span className="text-deep-100">{query}</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </>
      {totalCount === 0 && (
        <motion.div
          className={
            "w-132 lg:w-184 mx-auto h-full flex flex-col items-center justify-center gap-20"
          }
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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
        </motion.div>
      )}
    </>
  );
}
