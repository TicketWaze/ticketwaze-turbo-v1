import React from "react";
import { ArrowDown2, ArrowUp2 } from "iconsax-reactjs";
import { cn } from "@/lib/utils";
import { GrowBar } from "@/components/shared/motion";

/* Presentational pieces of the analytics page, sized to the Figma frames
   (Admin › Analytics, 4009:103596 empty / 4111:65348 data); ported from the
   organisation dashboard's analytics so both read the same. */

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-primary font-medium text-[2.2rem] leading-12 text-black">
      {children}
    </h3>
  );
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-sans font-medium text-[1.5rem] leading-8 text-deep-100">
      {children}
    </span>
  );
}

/** The change badge beside a KPI. Nothing is shown when there is no trend. */
export function TrendBadge({
  value,
  label,
}: {
  value: number | null | undefined;
  /** Spoken label, e.g. "Up 12% on the previous period". */
  label: string;
}) {
  if (value === null || value === undefined) return null;
  const down = value < 0;
  const Icon = down ? ArrowDown2 : ArrowUp2;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[.3rem] shrink-0 font-sans font-medium text-[1.1rem] leading-6 uppercase",
        down ? "text-failure" : "text-success",
      )}
      title={label}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden>{Math.abs(value)}%</span>
      <Icon size="20" variant="Bulk" color={down ? "#DE0028" : "#349C2E"} aria-hidden />
    </span>
  );
}

/** A KPI tile: label and trend on one line, the figure under it. */
export function Metric({
  label,
  children,
  trend,
  note,
  className,
}: {
  label: string;
  children: React.ReactNode;
  trend?: React.ReactNode;
  /** A small grey line under the figure (the USD equivalent). */
  note?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 min-w-0", className)}>
      <div className="flex items-start justify-between gap-4">
        <span className="font-sans text-[1.4rem] leading-8 text-neutral-600">
          {label}
        </span>
        {trend}
      </div>
      <p className="font-primary font-medium text-black leading-12 text-[1.8rem] lg:text-[2.5rem] break-words">
        {children}
      </p>
      {note && (
        <span className="font-sans text-[1.3rem] leading-6 text-neutral-500 -mt-2">
          {note}
        </span>
      )}
    </div>
  );
}

/** A figure's unit, greyed like Figma's "HTG". */
export function Unit({ children }: { children: React.ReactNode }) {
  return <span className="font-normal text-neutral-500">{children}</span>;
}

/**
 * Label · bar · value rows (gender distribution, top events). `value` is a
 * 0–100 share; `display` is what is printed on the right.
 */
export function BarList({
  rows,
  truncateLabels = false,
}: {
  rows: { label: string; value: number; display: string }[];
  truncateLabels?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-6">
      {rows.map((row, i) => (
        <li
          key={i}
          className="grid grid-cols-[6.5rem_1fr_4rem] lg:grid-cols-[8rem_1fr_5rem] items-center gap-6 font-sans text-[1.4rem] leading-8 text-deep-100"
        >
          <span
            className={cn(truncateLabels ? "truncate" : "whitespace-nowrap")}
            title={truncateLabels ? row.label : undefined}
          >
            {row.label}
          </span>
          <span className="h-[.5rem] rounded-[2rem] bg-neutral-100 overflow-hidden">
            <GrowBar
              value={row.value}
              delay={0.3 + i * 0.06}
              className="block h-full bg-primary-500"
            />
          </span>
          <span className="text-right whitespace-nowrap">{row.display}</span>
        </li>
      ))}
    </ul>
  );
}
