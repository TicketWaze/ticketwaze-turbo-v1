"use client";
import { Control, useWatch } from "react-hook-form";
import { isOvernight } from "@/lib/eventTime";

/**
 * "Ends the next day", shown under a day's end time when it is earlier than the
 * start. That is how an overnight event (20:00 → 02:00) is entered — there is
 * no end date — so the organiser is told how it will be read rather than left
 * to wonder whether 02:00 means the morning of the same date.
 */
export default function NextDayHint({
  // The four day editors each have their own form value type; the field path
  // below is identical across all of them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control,
  index,
  label,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  index: number;
  label: string;
}) {
  const startTime: string | undefined = useWatch({
    control,
    name: `eventDays.${index}.startTime`,
  });
  const endTime: string | undefined = useWatch({
    control,
    name: `eventDays.${index}.endTime`,
  });

  if (!startTime || !endTime) return null;
  if (startTime.slice(0, 5) === endTime.slice(0, 5)) return null;
  if (!isOvernight(startTime, endTime)) return null;

  return (
    <span className="block text-[1.2rem] px-8 pt-2 text-primary-500">
      {label}
    </span>
  );
}
