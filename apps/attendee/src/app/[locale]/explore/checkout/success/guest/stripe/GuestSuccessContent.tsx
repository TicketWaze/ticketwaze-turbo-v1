"use client";
import { motion } from "framer-motion";
import { TickCircle } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Event } from "@ticketwaze/typescript-config";
import { slugify } from "@/lib/Slugify";
import { LinkPrimary, LinkAccent } from "@/components/shared/Links";

export default function GuestSuccessContent({ event }: { event: Event }) {
  const t = useTranslations("Checkout.guestSuccess");

  return (
    <div className="overflow-y-scroll  flex-1 py-16 px-4">
      <div className="flex flex-col items-center gap-10 max-w-200 mx-auto w-full">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 18,
            delay: 0.1,
          }}
        >
          <TickCircle size={80} color="#E45B00" variant="Bulk" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <h1 className="font-primary font-medium text-[3.2rem] leading-14 text-black">
            {t("title")}
          </h1>
          <p className="text-[1.8rem] leading-10 text-neutral-700">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="w-full border border-neutral-100 rounded-[15px] p-6 flex flex-col gap-4"
        >
          <span className="text-[1.3rem] leading-6 text-neutral-500 font-medium uppercase tracking-wide">
            {t("event_label")}
          </span>
          <span className="font-primary font-medium text-[2rem] leading-10 text-black">
            {event.eventName}
          </span>
          <div className="h-px bg-neutral-100" />
          <p className="text-[1.5rem] leading-8 text-neutral-600">
            {t("email_note")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="w-full flex flex-col gap-4"
        >
          <LinkPrimary href="/auth/register" className="w-full">
            {t("create_account")}
          </LinkPrimary>
          <LinkAccent
            href={`/explore/${slugify(event.eventName, event.eventId)}`}
          >
            {t("view_event_cta")}
          </LinkAccent>
        </motion.div>
      </div>
    </div>
  );
}
