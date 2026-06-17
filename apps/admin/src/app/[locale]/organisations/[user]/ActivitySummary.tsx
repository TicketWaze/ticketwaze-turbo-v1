"use client";
import Separator from "@/components/shared/Separator";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import ArrowDown from "@ticketwaze/ui/assets/icons/arrow-down.svg";
import EventCard from "@/components/shared/EventCard";
import { Event } from "@ticketwaze/typescript-config";
import { TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import formatDate from "@/lib/FormatDate";

export default function ActivitySummary({
  events,
  createdAt,
}: {
  events: Event[];
  createdAt: string;
}) {
  const t = useTranslations("Organisations.profile.summary");
  const locale = useLocale();
  const [showCreated, setShowCreated] = useState(true);
  const [showCancelled, setShowCancelled] = useState(true);

  const activeEvents = events.filter(
    (e) => e.adminStatus !== "rejected" && e.deletionStatus !== "deleted",
  );
  const cancelledEvents = events.filter(
    (e) =>
      e.adminStatus === "rejected" ||
      e.deletionStatus === "deleted" ||
      e.deletionStatus === "pending_deletion",
  );

  return (
    <TabsContent
      value="summary"
      className="h-full overflow-y-scroll flex flex-col gap-12"
    >
      <div className="flex flex-col w-full">
        <div
          className="flex justify-between text-neutral-600 text-[1.6rem] leading-9 cursor-pointer"
          onClick={() => setShowCreated(!showCreated)}
        >
          <span>
            {t("created")} ({activeEvents.length})
          </span>
          <Image
            className={`transition-transform duration-300 ${showCreated ? "rotate-180" : ""}`}
            src={ArrowDown}
            alt="arrow-down"
            width={20}
            height={20}
          />
        </div>
        {showCreated && (
          <div>
            {activeEvents.length > 0 ? (
              <ul className="grid grid-cols-2 gap-4 pt-4 -ml-3">
                {activeEvents.map((event) => (
                  <li key={event.eventId} className="w-114">
                    <EventCard event={event} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[1.4rem] text-neutral-400 pt-4">
                {t("no_activities")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col w-full">
        <div
          className="flex justify-between text-neutral-600 text-[1.6rem] leading-9 cursor-pointer"
          onClick={() => setShowCancelled(!showCancelled)}
        >
          <span>
            {t("cancelled")} ({cancelledEvents.length})
          </span>
          <Image
            className={`transition-transform duration-300 ${showCancelled ? "rotate-180" : ""}`}
            src={ArrowDown}
            alt="arrow-down"
            width={20}
            height={20}
          />
        </div>
        {showCancelled && (
          <div>
            {cancelledEvents.length > 0 ? (
              <ul className="grid grid-cols-2 gap-4 pt-4 -ml-3">
                {cancelledEvents.map((event) => (
                  <li key={event.eventId} className="w-114">
                    <EventCard event={event} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[1.4rem] text-neutral-400 pt-4">
                {t("no_cancelled")}
              </p>
            )}
          </div>
        )}
      </div>

      <Separator />

      <div className="flex justify-between text-deep-100 text-[1.6rem] leading-9">
        <span className="text-neutral-600">{t("joined_on")}</span>
        <span>{formatDate(createdAt, locale, "local")}</span>
      </div>
    </TabsContent>
  );
}
