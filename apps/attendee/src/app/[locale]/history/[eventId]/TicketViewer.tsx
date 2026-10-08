"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HTicket from "./HTicket";
import { ArrowLeft2, ArrowRight2, TicketExpired } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Event, Ticket } from "@ticketwaze/typescript-config";

/**
 * Figma History ticket: the past ticket (no QR, nothing left to scan), then a
 * bar with the pager and whether this ticket was scanned at the door.
 */
export default function TicketViewer({
  tickets,
  event,
}: {
  tickets: Ticket[];
  event: Event;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const t = useTranslations("Event");

  if (tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-160 bg-neutral-100 rounded-[10px]">
        <p className="text-neutral-600 text-[1.5rem]">{t("noTickets")}</p>
      </div>
    );
  }

  const ticket = tickets[currentIndex];
  const multiple = tickets.length > 1;
  // Online tickets are never scanned, so used / not used means nothing there.
  const showUsage = event.eventCategory !== "meet";
  const used = ticket.status === "CHECKED";

  const go = (step: 1 | -1) => {
    setDirection(step);
    setCurrentIndex((i) => (i + step + tickets.length) % tickets.length);
  };

  return (
    <>
      <div className="relative overflow-hidden shrink-0">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={ticket.ticketId}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <HTicket ticket={ticket} event={event} />
          </motion.div>
        </AnimatePresence>
      </div>

      {(multiple || showUsage) && (
        <div className="border border-neutral-100 rounded-[100px] py-4 px-6 flex items-center justify-between gap-4">
          {multiple ? (
            <div className="flex items-center gap-[1.8rem]">
              <button
                onClick={() => go(-1)}
                aria-label={t("previous")}
                className="w-14 cursor-pointer h-14 rounded-full bg-neutral-100 flex items-center justify-center active:scale-90 transition-transform"
              >
                <ArrowLeft2 variant="Bulk" size={20} color="#0D0D0D" />
              </button>
              <span className="text-[2.2rem] leading-12 text-neutral-600 tabular-nums">
                <span className="text-primary-500">{currentIndex + 1}</span>/
                {tickets.length}
              </span>
              <button
                onClick={() => go(1)}
                aria-label={t("next")}
                className="w-14 cursor-pointer h-14 rounded-full bg-neutral-100 flex items-center justify-center active:scale-90 transition-transform"
              >
                <ArrowRight2 variant="Bulk" size={20} color="#0D0D0D" />
              </button>
            </div>
          ) : (
            <span />
          )}
          {showUsage && (
            <motion.div
              key={used ? "used" : "not-used"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="px-8 lg:px-12 py-[7.5px] bg-neutral-300 rounded-[100px] flex gap-4 items-center justify-center text-deep-100"
            >
              <TicketExpired
                size="20"
                variant="Bulk"
                color="#2E3237"
                className="hidden lg:flex"
              />
              <span className="hidden lg:flex text-[1.5rem]">
                {used ? t("used") : t("not_used")}
              </span>
              <span className="lg:hidden text-[1.5rem]">
                {used ? t("used_m") : t("not_used_m")}
              </span>
            </motion.div>
          )}
        </div>
      )}
    </>
  );
}
