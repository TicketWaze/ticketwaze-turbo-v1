"use client";
import React from "react";
import { motion } from "motion/react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * The phone filter sheet of the Figma tables (2223:64001): a bottom drawer of
 * radio groups and a Close button. The desktop pills live in the toolbar.
 */
export default function FilterSheet({
  open,
  onOpenChange,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="bg-white rounded-t-[3rem] px-6 pb-10 max-h-[85dvh]">
        <DrawerTitle className="font-primary font-medium text-[2.2rem] leading-12 text-black text-center pt-6 pb-4">
          {title}
        </DrawerTitle>
        <DrawerDescription className="sr-only">{title}</DrawerDescription>
        <div className="flex flex-col py-4 overflow-y-auto divide-y divide-neutral-100">
          {children}
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full mt-4 border-2 border-primary-500 bg-primary-50 text-primary-500 rounded-[3rem] py-5 font-sans font-bold text-[1.6rem] leading-8 cursor-pointer"
        >
          {closeLabel}
        </button>
      </DrawerContent>
    </Drawer>
  );
}

export function RadioGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-col py-6">
      <legend className="font-sans font-medium text-[1.6rem] leading-8 text-deep-100 pb-4">
        {title}
      </legend>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <label
            key={o.value}
            className="flex items-center justify-between py-[.8rem] cursor-pointer"
          >
            <span className="font-sans text-[1.4rem] leading-8 text-deep-100">
              {o.label}
            </span>
            <input
              type="radio"
              className="sr-only"
              checked={on}
              onChange={() => onChange(o.value)}
            />
            <span
              aria-hidden
              className={cn(
                "w-[3rem] h-[3rem] rounded-full border-2 flex items-center justify-center transition-colors",
                on ? "border-primary-500" : "border-neutral-200",
              )}
            >
              <motion.span
                className="w-[1.6rem] h-[1.6rem] rounded-full bg-primary-500"
                initial={false}
                animate={{ scale: on ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
