import React from "react";
import { MoreCircle } from "iconsax-reactjs";
import { cn } from "@/lib/utils";

/*
 * The table vocabulary of the revamped admin lists (Figma "Admin" → Tickets
 * 4351:91910): uppercase 11px headings, 15px rows split by neutral-100 rules,
 * pill badges, the small grey ⋯ circle and the double-ringed empty state.
 * Plain markup so server and client pages can both use it.
 */

export const TABLE_HEAD = "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase text-left";
export const TABLE_CELL = "py-6 pr-4 text-[1.5rem] leading-8 text-deep-100";
export const TABLE_ROW = "border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors";
export const TABLE_BADGE =
  "inline-block py-[0.3rem] px-2 rounded-[30px] text-[1.1rem] font-bold leading-6 uppercase whitespace-nowrap";

/** Badge colours shared by the settings pages' statuses. */
export const BADGE_TONE = {
  success: "bg-[#E8F8EF] text-[#1E8E4E]",
  warning: "bg-[#FFF7E6] text-[#B76E00]",
  danger: "bg-[#FFF1F1] text-[#D32F2F]",
  primary: "bg-primary-50 text-primary-500",
  neutral: "bg-neutral-100 text-neutral-700",
} as const;
export type BadgeTone = keyof typeof BADGE_TONE;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn(TABLE_BADGE, BADGE_TONE[tone], className)}>{children}</span>;
}

/**
 * Figma 4351:92366: a 20px neutral-100 circle around a 10px bulk ⋯. The
 * invisible ::after keeps a finger-sized tap area. Decorative by default (the
 * whole row is the link); pass it inside a button for a real menu.
 */
export function RowMore() {
  return (
    <span
      aria-hidden
      className="relative w-[2rem] h-[2rem] shrink-0 rounded-full bg-neutral-100 inline-flex items-center justify-center after:absolute after:-inset-[0.8rem] after:content-['']"
    >
      <MoreCircle size="10" variant="Bulk" color="#737C8A" />
    </span>
  );
}

/** The table frame: scrolls sideways on phones instead of the page. */
export function TableFrame({
  minWidth = "72rem",
  pending,
  children,
}: {
  minWidth?: string;
  pending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("overflow-x-auto transition-opacity", pending && "opacity-60")}>
      <table className="w-full border-collapse" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

/**
 * Nothing to show. `filtered` = the filters emptied the list, which gets a
 * plain line; otherwise the ringed icon and a sentence, as in Figma's empty
 * frames.
 */
export function EmptyState({
  Icon,
  text,
  filtered = false,
}: {
  Icon: React.ComponentType<{ size?: string | number; variant?: "Bulk"; color?: string }>;
  text: string;
  filtered?: boolean;
}) {
  if (filtered) {
    return <p className="text-[1.6rem] text-neutral-600 leading-10 text-center py-16">{text}</p>;
  }
  return (
    <div className="flex flex-col items-center gap-10 py-16">
      <div className="rounded-full bg-neutral-100 p-6">
        <div className="rounded-full bg-neutral-200 p-8">
          <Icon size="44" variant="Bulk" color="#454A53" />
        </div>
      </div>
      <p className="max-w-[44rem] text-[1.6rem] text-neutral-600 leading-9 text-center">{text}</p>
    </div>
  );
}

/**
 * The header action pills of the profile and activity pages (Suspend, Edit…),
 * full-width and sharing one row on phones. Same values as
 * ActivityHeaderActions.
 */
export const HEADER_PILL =
  "h-[3.5rem] px-4 sm:px-8 rounded-[10rem] inline-flex items-center justify-center whitespace-nowrap font-medium cursor-pointer transition-colors flex-1 lg:flex-none min-w-0 disabled:opacity-50 disabled:cursor-not-allowed";
export const PILL_TONE = {
  primary: "bg-primary-500 border-2 border-primary-500 text-white text-[1.4rem] hover:bg-primary-600",
  danger:
    "bg-[#FCE5EA] border-[1.5px] border-failure text-failure text-[1.3rem] sm:text-[1.5rem] hover:bg-[#F9D3DC]",
  success:
    "bg-success/10 border-[1.5px] border-success text-success text-[1.3rem] sm:text-[1.5rem] hover:bg-success/15",
  neutral: "bg-neutral-100 border-[1.5px] border-neutral-100 text-deep-100 text-[1.4rem] hover:bg-neutral-200",
} as const;

/** A white ruled card for detail blocks. */
export const CARD = "bg-white rounded-[1.5rem] border border-neutral-100 p-8";
