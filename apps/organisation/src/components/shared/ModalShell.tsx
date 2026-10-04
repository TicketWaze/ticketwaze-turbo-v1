"use client";

import React from "react";
import { motion } from "motion/react";
import { CloseCircle } from "iconsax-reactjs";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ease } from "./motion";

/**
 * The centred modal of the Figma event pages ("Share Event", "Export Data"):
 * 520px card, title on the left, a round grey close button on the right, a
 * hairline under the header, then the body rising in. Goes inside a
 * `<Dialog>`; replaces the dialog's own corner close button.
 */
export default function ModalShell({
  title,
  description,
  children,
  className,
}: {
  title: string;
  /** The grey lead paragraph under the header; also the accessible description. */
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogContent
      className={cn(
        "flex flex-col w-[calc(100vw-3.2rem)] max-w-[52rem] lg:w-[52rem] p-[2rem] lg:p-[3rem] gap-0 rounded-[2rem] border-none",
        "[&>[data-slot=dialog-close]:last-child]:hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 pb-[1.5rem] border-b border-neutral-100">
        <DialogTitle className="font-primary font-medium text-[2rem] lg:text-[2.6rem] leading-12 text-black">
          {title}
        </DialogTitle>
        <DialogClose
          aria-label="Close"
          className="w-[3.5rem] h-[3.5rem] shrink-0 rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer transition-colors hover:bg-neutral-200"
        >
          <CloseCircle size="20" variant="Bulk" color="#2E3237" aria-hidden />
        </DialogClose>
      </div>
      <motion.div
        className="flex flex-col items-center gap-[2.5rem] pt-[2.5rem] min-w-0 w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease, delay: 0.05 }}
      >
        {description ? (
          <DialogDescription className="font-sans text-[1.5rem] lg:text-[1.8rem] leading-[2.5rem] text-neutral-400 text-center max-w-[44rem]">
            {description}
          </DialogDescription>
        ) : (
          <DialogDescription className="sr-only">{title}</DialogDescription>
        )}
        {children}
      </motion.div>
    </DialogContent>
  );
}
