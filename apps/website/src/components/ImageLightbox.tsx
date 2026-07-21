/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CloseCircle } from "iconsax-reactjs";

/**
 * Tap a photo, see it properly. The same treatment as the attendee app's
 * `EventImageLightbox` — a dish photo on a menu is there to be looked at, and a
 * 96px thumbnail is not looking at it.
 *
 * Deliberately built on a plain `<img>` rather than `next/image`, unlike the
 * attendee version: this app configures no `images.remotePatterns`, so the
 * optimizer would reject the S3 URLs these photos live on. That is also why
 * every image on the public menu is a plain tag.
 */
export default function ImageLightbox({
  src,
  alt,
  triggerClassName,
  imageClassName,
}: {
  src: string;
  alt: string;
  /** The thumbnail's box. Callers own their own shape. */
  triggerClassName?: string;
  /** How the thumbnail fills that box. */
  imageClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // The page behind must not scroll under the overlay on a phone.
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt}
        className={triggerClassName}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={
            imageClassName ??
            "w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          }
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            /* Anywhere outside the photo closes it — on a phone that is the
               whole screen, which beats hunting for a small X. */
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <CloseCircle size={32} variant="Bold" color="currentColor" />
            </button>

            <motion.div
              className="relative z-10 max-w-full max-h-full"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              /* Tapping the photo itself must not dismiss it. */
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src}
                alt={alt}
                className="rounded-[12px] object-contain max-h-[90dvh] max-w-full w-auto"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
