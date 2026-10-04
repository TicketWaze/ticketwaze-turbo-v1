import { ArrowDown2, ArrowUp2 } from "iconsax-reactjs";
import { cn } from "@/lib/utils";
import React from "react";
import { GrowBar } from "@/components/shared/motion";

/* Presentational pieces of the analytics page, sized to the Figma frames
   (Organizers + Mobile › Analytics, 1554:52583 / 2211:20545). */

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
  inverse = false,
}: {
  value: number | null | undefined;
  /** Spoken label, e.g. "Up 12% on the previous period". */
  label: string;
  /** A fall is the good news (e.g. tickets left): green down, red up. */
  inverse?: boolean;
}) {
  if (value === null || value === undefined) return null;
  const down = value < 0;
  const bad = inverse ? !down && value !== 0 : down;
  const Icon = down ? ArrowDown2 : ArrowUp2;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[.3rem] font-sans font-medium text-[1.1rem] leading-6 uppercase",
        bad ? "text-failure" : "text-success",
      )}
      title={label}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden>{Math.abs(value)}%</span>
      <Icon
        size="20"
        variant="Bulk"
        color={bad ? "#DE0028" : "#349C2E"}
        aria-hidden
      />
    </span>
  );
}

/** A label over a big figure — the KPI tiles and the engagement row. */
export function Metric({
  label,
  children,
  trend,
  className,
  size = "lg",
}: {
  label: string;
  children: React.ReactNode;
  trend?: React.ReactNode;
  className?: string;
  /** `sm` is the mobile KPI grid's 16px figure. */
  size?: "lg" | "sm" | "responsive";
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-2 min-w-0">
        <span className="font-sans text-[1.4rem] leading-8 text-neutral-600">
          {label}
        </span>
        <p
          className={cn(
            "font-primary font-medium text-black leading-12 whitespace-nowrap",
            size === "lg" && "text-[2.5rem]",
            size === "sm" && "text-[1.6rem]",
            size === "responsive" && "text-[1.6rem] lg:text-[2.5rem]",
          )}
        >
          {children}
        </p>
      </div>
      {trend}
    </div>
  );
}

/** A figure's unit, greyed like Figma's "HTG" and "/ 5". */
export function Unit({ children }: { children: React.ReactNode }) {
  return <span className="font-normal text-neutral-500">{children}</span>;
}

/**
 * Label · bar · value rows (gender distribution, top activities). `value` is a
 * 0–100 share; `display` is what is printed on the right.
 */
export function BarList({
  rows,
  truncateLabels = false,
}: {
  rows: { label: string; value: number; display: string }[];
  /** Activity names are clipped to a short column, as in the design. */
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
