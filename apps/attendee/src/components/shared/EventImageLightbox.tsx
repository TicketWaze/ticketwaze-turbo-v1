"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { CloseCircle } from "iconsax-reactjs";

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function EventImageLightbox({ src, alt, width, height }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
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
        className="w-full max-h-[298px] overflow-hidden rounded-[10px] flex-shrink-0 cursor-zoom-in block"
      >
        <Image
          src={src}
          width={width}
          height={height}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
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
            onClick={() => setOpen(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors"
            >
              <CloseCircle size={32} variant="Bold" color="currentColor" />
            </button>

            {/* Image */}
            <motion.div
              className="relative z-10 max-w-full max-h-full"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={src}
                width={width}
                height={height}
                alt={alt}
                className="rounded-[12px] object-contain max-h-[90dvh] w-auto"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
