"use client";

import { AnimatePresence, motion } from "motion/react";
import { CloseCircle, SearchNormal1 } from "iconsax-reactjs";
import { cn } from "@/lib/utils";

/**
 * The grey rounded search pill of the Figma list toolbars. The magnifier turns
 * into a clear button once something is typed. Pass `flex` (or `hidden
 * lg:flex`) in `className` — it sets no display of its own.
 */
export default function SearchField({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <label
      className={cn(
        "items-center gap-4 bg-neutral-100 rounded-[3rem] px-6 py-3",
        className,
      )}
    >
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className="flex-1 min-w-0 bg-transparent outline-none font-sans text-[1.4rem] leading-8 text-deep-100 placeholder:text-neutral-700 [&::-webkit-search-cancel-button]:hidden"
      />
      <AnimatePresence initial={false} mode="wait">
        {value ? (
          <motion.button
            key="clear"
            type="button"
            aria-label="Clear"
            onClick={() => onChange("")}
            className="cursor-pointer flex"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <CloseCircle size="20" variant="Bulk" color="#737C8A" />
          </motion.button>
        ) : (
          <motion.span
            key="search"
            className="flex"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <SearchNormal1
              size="20"
              variant="Bulk"
              color="#737C8A"
              aria-hidden
            />
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}
