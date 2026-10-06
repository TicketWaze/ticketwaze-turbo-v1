"use client";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { CloseCircle, TickCircle } from "iconsax-reactjs";
import type { SaveStatus } from "@/hooks/useAutoSave";

/**
 * Floating "Saving… / Saved" pill for settings that save as they are clicked
 * (useAutoSave), so a slow connection never looks like nothing happened. The
 * hook hides "Saved" and "Not saved" after a moment.
 */
export default function SaveIndicator({ status }: { status: SaveStatus }) {
  const t = useTranslations("SaveStatus");
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[11rem] lg:bottom-10 z-60 flex justify-center px-4"
    >
      <AnimatePresence>
        {status !== "idle" && (
          <motion.div
            key="pill"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 rounded-full bg-white px-6 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-neutral-100 text-[1.4rem] text-deep-100"
          >
            {status === "saving" && (
              <span className="w-[1.6rem] h-[1.6rem] rounded-full border-2 border-neutral-200 border-t-primary-500 animate-spin" />
            )}
            {status === "saved" && (
              <TickCircle size={18} color="#16A34A" variant="Bold" />
            )}
            {status === "error" && (
              <CloseCircle size={18} color="#DC2626" variant="Bold" />
            )}
            {t(status)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
