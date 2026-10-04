"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowDown2, TickCircle } from "iconsax-reactjs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ease } from "./motion";

export type FilterOption = { value: string; label: string };

/**
 * The grey rounded dropdown pill from the Figma filter bars ("This month ▾",
 * "Location ▾"), with the attendee app's behaviour: the caret turns while it is
 * open, the options cascade in, and a filter that is narrowing the results is
 * tinted orange so it can be spotted at a glance.
 *
 * Shows the selected option, or `placeholder` while the filter sits on
 * `defaultValue`, so an unused filter reads as its name.
 */
export default function FilterPill({
  label,
  options,
  value,
  onChange,
  placeholder,
  defaultValue,
  pending = false,
  align = "end",
}: {
  /** Accessible name of the control, and the menu's heading. */
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  /** Shown instead of the option label while `value === defaultValue`. */
  placeholder?: string;
  /** The "no filter" value; anything else tints the pill as active. */
  defaultValue?: string;
  pending?: boolean;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const isDefault = defaultValue !== undefined && value === defaultValue;
  const active = defaultValue !== undefined && !isDefault;
  const current =
    placeholder && isDefault
      ? placeholder
      : (selected?.label ?? placeholder ?? label);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          "rounded-[3rem] px-6 py-3 inline-flex items-center gap-2 cursor-pointer max-w-[22rem] lg:max-w-[28rem]",
          "font-sans text-[1.4rem] leading-8 transition-colors duration-200",
          active
            ? "bg-primary-50 text-primary-500"
            : "bg-neutral-100 text-neutral-700 hover:text-deep-100",
          pending && "opacity-60",
        )}
      >
        <span className="truncate">{current}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex shrink-0"
        >
          <ArrowDown2
            size="20"
            variant="Bulk"
            color={active ? "#E45B00" : "#737C8A"}
            aria-hidden
          />
        </motion.span>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-auto min-w-[22rem] max-w-[30rem] p-[1rem] bg-white border border-neutral-100 rounded-[1rem] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)]"
      >
        <p className="px-[1rem] pt-[.5rem] pb-[1rem] font-sans text-[1.4rem] font-medium text-deep-100">
          {label}
        </p>
        <ul
          role="listbox"
          aria-label={label}
          className="flex flex-col max-h-[30rem] overflow-y-auto"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <motion.li
                key={o.value}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.025, ease }}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setOpen(false);
                    if (!isSelected) onChange(o.value);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-6 px-[1rem] py-[.8rem] rounded-[.75rem] text-left cursor-pointer transition-colors",
                    "font-sans text-[1.4rem] leading-8",
                    isSelected
                      ? "bg-primary-50 text-primary-500"
                      : "text-deep-100 hover:bg-neutral-100",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {isSelected && (
                    <TickCircle
                      size="16"
                      variant="Bulk"
                      color="#E45B00"
                      aria-hidden
                    />
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
