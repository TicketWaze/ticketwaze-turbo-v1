"use client";

import React from "react";
import { Calendar, Clock } from "iconsax-reactjs";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

/*
 * Figma's grey pill fields (60px tall, fully rounded) for the create forms,
 * with the small label sitting inside the pill over the value so a native
 * date/time picker still reads like the design's "Start date 📅".
 */

export const pillClass =
  "bg-neutral-100 w-full rounded-[5rem] min-h-[6rem] px-8 py-3 flex items-center gap-4 border border-transparent focus-within:border-primary-500 transition-colors";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="block text-[1.2rem] px-8 pt-2 text-failure">{message}</span>
  );
}

/** A native date / time / datetime input in a labelled pill with an icon. */
export function PickerField({
  label,
  type,
  inputProps,
  error,
  className,
}: {
  label: string;
  type: "date" | "time" | "datetime-local";
  inputProps: UseFormRegisterReturn | React.InputHTMLAttributes<HTMLInputElement>;
  error?: string;
  className?: string;
}) {
  const Icon = type === "time" ? Clock : Calendar;
  return (
    <div className={cn("flex-1 min-w-0", className)}>
      <label className={pillClass}>
        <span className="flex-1 min-w-0 flex flex-col">
          <span className="text-[1.1rem] leading-6 text-neutral-600">{label}</span>
          <input
            type={type}
            className="w-full bg-transparent outline-none text-[1.5rem] leading-8 text-deep-200 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer relative"
            {...inputProps}
          />
        </span>
        <Icon size="20" variant="Bulk" color="#737C8A" className="shrink-0" />
      </label>
      <FieldError message={error} />
    </div>
  );
}

/** A ticket class's optional sales start and end, side by side. */
export function SalesWindowFields({
  startProps,
  endProps,
  startError,
  endError,
  t,
}: {
  startProps: UseFormRegisterReturn;
  endProps: UseFormRegisterReturn;
  startError?: string;
  endError?: string;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col lg:flex-row gap-4">
        <PickerField
          label={t("sales_start")}
          type="datetime-local"
          inputProps={startProps}
          error={startError}
        />
        <PickerField
          label={t("sales_end")}
          type="datetime-local"
          inputProps={endProps}
          error={endError}
        />
      </div>
      <p className="text-[1.2rem] leading-6 text-neutral-600 px-4">
        {t("sales_window_hint")}
      </p>
    </div>
  );
}
