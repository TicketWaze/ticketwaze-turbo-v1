"use client";
import HistoryCard from "@/components/HistoryCard";
import ListPageHeader from "@/components/ListPageHeader";
import { Calendar2, Star } from "iconsax-reactjs";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";

export type HistoryItem = {
  eventId: string;
  eventName: string;
  eventImageUrl: string;
  daysAgo: number;
  rating: number;
};

export default function HistoryPageContent({
  items,
}: {
  items: HistoryItem[];
}) {
  const t = useTranslations("History");
  const tUpcoming = useTranslations("Upcoming");
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const filtered = items.filter((item) =>
    item.eventName.toLowerCase().includes(search),
  );

  return (
    <>
      <ListPageHeader
        title={t("title")}
        searchPlaceholder={t("search")}
        onSearch={setQuery}
      />
      {items.length > 0 && (
        <div className="pt-4 overflow-y-scroll flex flex-col gap-8 -mx-4">
          <ul className="list px-4 pb-8">
            {filtered.map((item, index) => (
              <motion.li
                key={item.eventId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                  delay: Math.min(index * 0.06, 0.3),
                }}
              >
                <HistoryCard
                  href={`history/${item.eventId}`}
                  image={item.eventImageUrl}
                  name={item.eventName}
                  day={item.daysAgo}
                  rated={item.rating}
                />
              </motion.li>
            ))}
          </ul>
        </div>
      )}
      <AnimatePresence>
        {items.length > 0 && filtered.length === 0 && (
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
              {tUpcoming("noResult")}{" "}
              <span className="text-deep-100">{query}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {items.length === 0 && (
        <motion.div
          className="w-132 lg:w-184 mx-auto h-full justify-center flex flex-col items-center gap-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100">
            <div className="w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200">
              <Calendar2 size="50" color="#0d0d0d" variant="Bulk" />
            </div>
          </div>
          <p className="text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem] text-center">
            {t("description")}
          </p>
        </motion.div>
      )}
    </>
  );
}
