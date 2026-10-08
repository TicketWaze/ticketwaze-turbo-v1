"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArchiveMinus } from "iconsax-reactjs";
import { Event } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import EventCard from "@/components/shared/EventCard";

const ease = [0.22, 1, 0.36, 1] as const;

export default function SavedPageContent({ events }: { events: Event[] }) {
  const t = useTranslations("Liked");
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex flex-col gap-8"
      >
        <BackButton text={t("back")} />
        <h1 className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-12 text-black">
          {t("title")}
        </h1>
      </motion.div>
      {events.length > 0 ? (
        <ul className="list pt-4">
          {events.map((event, index) => (
            <motion.li
              key={event.eventId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease,
                delay: Math.min(index * 0.06, 0.3),
              }}
              className="h-full flex"
            >
              <EventCard event={event} />
            </motion.li>
          ))}
        </ul>
      ) : (
        <div className="w-full max-w-[46rem] mx-auto flex-1 flex flex-col items-center justify-center gap-[5rem] py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="size-[12rem] rounded-full flex items-center justify-center bg-neutral-100"
          >
            <div className="size-[9rem] rounded-full flex items-center justify-center bg-neutral-200">
              <ArchiveMinus size="50" color="#0d0d0d" variant="Bulk" />
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease }}
            className="text-center text-[1.6rem] lg:text-[1.8rem] leading-10 text-neutral-600"
          >
            {t("noEvent")}
          </motion.p>
        </div>
      )}
    </>
  );
}
