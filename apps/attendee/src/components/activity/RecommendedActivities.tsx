"use client";
import { motion } from "framer-motion";
import { Event } from "@ticketwaze/typescript-config";
import EventCard from "@/components/shared/EventCard";

export default function RecommendedActivities({
  title,
  events,
}: {
  title: string;
  events: Event[];
}) {
  if (events.length === 0) return null;
  return (
    <section className="flex flex-col gap-6 pt-4 pb-8">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="font-primary font-medium text-[2rem] lg:text-[2.2rem] leading-10 text-black"
      >
        {title}
      </motion.h2>
      <ul className="list pt-2">
        {events.map((event, index) => (
          <motion.li
            key={event.eventId}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.35,
              delay: index * 0.07,
              ease: "easeOut",
            }}
            className="h-full flex"
          >
            <EventCard event={event} />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
