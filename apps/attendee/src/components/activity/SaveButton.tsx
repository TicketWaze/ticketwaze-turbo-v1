"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArchiveMinus } from "iconsax-reactjs";
import { cn } from "@/lib/utils";

/**
 * Bookmark toggle beside "Share" (Figma's save button). Flips optimistically,
 * pops when saved, and rolls back if the request fails.
 */
export default function SaveButton({
  initialSaved,
  save,
  unsave,
}: {
  initialSaved: boolean;
  /** Each resolves true on success. */
  save: () => Promise<boolean>;
  unsave: () => Promise<boolean>;
}) {
  const t = useTranslations("Event");
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !saved;
    setSaved(next);
    setBusy(true);
    const ok = await (next ? save() : unsave());
    if (!ok) setSaved(!next);
    setBusy(false);
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? t("saved") : t("save")}
      title={saved ? t("saved") : t("save")}
      whileTap={{ scale: 0.85 }}
      className={cn(
        "relative w-fit h-fit p-[7.5px] flex items-center justify-center rounded-[30px] cursor-pointer transition-colors duration-300",
        saved ? "bg-primary-100" : "bg-neutral-100 hover:bg-primary-100",
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={saved ? "saved" : "unsaved"}
          initial={{ scale: 0.4, opacity: 0, y: saved ? -6 : 0 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex"
        >
          <ArchiveMinus
            size={20}
            variant="Bulk"
            color={saved ? "#E45B00" : "#737C8A"}
          />
        </motion.span>
      </AnimatePresence>
      {/* A ring that ripples out once when saving. */}
      <AnimatePresence>
        {saved && (
          <motion.span
            key="ripple"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-primary-400 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
