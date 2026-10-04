"use client";
import Image from "next/image";
import React from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/*
 * The one card every activity type wears in the activities list, sized to
 * Figma (Organizers + Mobile › Events, card 1601:26395, mobile 2215:49015):
 * image, name, two facts, and a price line. Desktop stacks them; phones put the
 * image on the left half.
 *
 * Badges are only for what needs the organiser's attention (in review,
 * rejected, deleted…) or is live right now. A normal approved listing wears
 * none, which is what the design shows.
 */

export type CardBadge = {
  label: string;
  tone: "neutral" | "warning" | "failure" | "muted" | "success";
  /** "Live now" pulse, for ongoing events. */
  pulse?: boolean;
};

const TONE: Record<CardBadge["tone"], string> = {
  neutral: "bg-neutral-900 text-white",
  warning: "bg-warning text-white",
  failure: "bg-failure text-white",
  muted: "bg-neutral-500 text-white",
  success: "bg-success text-white",
};

export function CardMeta({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <span className="shrink-0 flex">{icon}</span>
      <span className="truncate font-sans font-medium text-[1rem] leading-6 text-deep-100">
        {children}
      </span>
    </div>
  );
}

/** "100–356 HTG": the figure in bold orange, the unit in grey. */
export function CardPrice({
  amount,
  unit,
}: {
  amount: React.ReactNode;
  unit?: React.ReactNode;
}) {
  return (
    <p className="font-sans text-primary-500 truncate">
      <span className="font-bold text-[1.2rem] leading-6">{amount}</span>
      {unit && (
        <span className="text-[1.2rem] leading-[1.65rem] text-neutral-700">
          {" "}
          {unit}
        </span>
      )}
    </p>
  );
}

export default function ActivityCard({
  href,
  imageUrl,
  title,
  badge,
  liveBadge,
  meta,
  price,
}: {
  href: string;
  imageUrl?: string | null;
  title: string;
  /** Top-right: the one status that needs attention, if any. */
  badge?: CardBadge | null;
  /** Top-left: something happening right now (an ongoing event). */
  liveBadge?: CardBadge | null;
  /** The two facts under the name (date, place, file…). */
  meta: [React.ReactNode, React.ReactNode?];
  price: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group bg-white rounded-[1rem] overflow-hidden shadow-[0_15px_25px_rgba(0,0,0,0.05)] w-full",
        // The attendee cards lift on hover; same gesture here.
        "transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
        "flex flex-row items-stretch gap-4 p-2",
        "lg:flex-col lg:gap-4 lg:p-0 lg:pb-4",
      )}
    >
      <div className="relative flex-1 lg:flex-none h-[15.5rem] lg:h-[19.1rem] rounded-[.75rem] lg:rounded-[1rem] border border-neutral-100 overflow-hidden bg-neutral-100">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 255px, 50vw"
            className="object-cover object-top-left"
          />
        )}
        {liveBadge && <Badge badge={liveBadge} className="left-3 top-3" />}
        {badge && <Badge badge={badge} className="right-3 top-3" />}
      </div>

      <div className="flex-1 lg:flex-none min-w-0 flex flex-col justify-center gap-6 lg:gap-4 px-4">
        <h2 className="font-sans font-semibold text-[1.2rem] leading-[1.65rem] text-deep-100 line-clamp-2 lg:truncate lg:line-clamp-none">
          {title}
        </h2>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          {meta[0]}
          {meta[1]}
        </div>
        {price}
      </div>
    </Link>
  );
}

function Badge({ badge, className }: { badge: CardBadge; className?: string }) {
  return (
    <span
      className={cn(
        "absolute z-10 flex items-center gap-2 py-1 px-4 rounded-[30px] font-primary font-bold text-[1rem] leading-6 uppercase",
        TONE[badge.tone],
        className,
      )}
    >
      {badge.pulse && (
        <span className="size-[.6rem] rounded-full bg-white animate-pulse shrink-0" />
      )}
      {badge.label}
    </span>
  );
}
