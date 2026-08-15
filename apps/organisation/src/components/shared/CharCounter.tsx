"use client";
import { cn } from "@/lib/utils";

/**
 * The "142 / 3000" counter shown under a length-limited field.
 *
 * The rules are the description editor's, which this generalises so every
 * counted field reads the same: hidden until there is something to count, red
 * while the value is still short of the minimum the schema will demand, green
 * once it is long enough to pass.
 *
 * `max` should be the limit actually enforced on the input, not an aspirational
 * one — the number here is a promise about when typing will stop working.
 */
export default function CharCounter({
  count,
  min,
  max,
  className,
}: {
  count: number;
  min: number;
  max: number;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "text-[1.2rem] text-nowrap",
        count < min ? "text-failure" : "text-success",
        className,
      )}
    >
      {count} / {max}
    </span>
  );
}
