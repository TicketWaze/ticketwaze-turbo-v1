"use client";
import Separator from "@/components/shared/Separator";
import { useTranslations } from "next-intl";
import Image from "next/image";
import ArrowDown from "@ticketwaze/ui/assets/icons/arrow-down.svg";
import EventCard from "@/components/shared/EventCard";
import { Event } from "@ticketwaze/typescript-config";
import { TabsContent } from "@/components/ui/tabs";
import { useState } from "react";

export default function ActivitySummary({ events }: { events: Event[] }) {
  const t = useTranslations("Organisations.profile.summary");
  const [showCreated, setShowCreated] = useState(true);
  const [showCancelled, setShowCancelled] = useState(true);

  return (
    <TabsContent value="summary" className="h-full overflow-y-scroll flex flex-col gap-12">
      <div className="flex flex-col w-full">
        <div
          className="flex justify-between text-neutral-600 text-[1.6rem] leading-9 cursor-pointer"
          onClick={() => setShowCreated(!showCreated)}
        >
          <span>{t("created")}</span>
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
            {events.length > 0 && (
              <ul className="grid grid-cols-2 gap-4 pt-4 -ml-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <li key={index} className="w-114">
                    <EventCard event={events[0]} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div
        className="flex justify-between text-neutral-600 text-[1.6rem] leading-9 cursor-pointer"
        onClick={() => setShowCancelled(!showCancelled)}
      >
        <span>{t("cancelled")}</span>
        <Image
          className={`transition-transform duration-300 ${showCancelled ? "rotate-180" : ""}`}
          src={ArrowDown}
          alt="arrow-down"
          width={20}
          height={20}
        />
      </div>
      <Separator />
      <div className="flex justify-between text-deep-100 text-[1.6rem] leading-9">
        <span className="text-neutral-600">{t("joined_on")}</span>
        <span>20th August 2024</span>
      </div>
      <div></div>
      <div></div>
    </TabsContent>
  );
}
