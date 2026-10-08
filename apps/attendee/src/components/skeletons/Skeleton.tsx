import React from "react";
import { cn } from "@/lib/utils";
import styles from "./skeleton.module.css";

/*
 * Skeleton building blocks for the route `loading.tsx` files.
 *
 * THE RULE: a skeleton copies the real page's boxes — same wrappers, same
 * paddings, same image sizes — and only swaps text and pictures for bones, so
 * nothing jumps when the content arrives. When a page's layout changes, its
 * skeleton changes with it.
 *
 * Plain markup (no hooks), so they render in server components.
 */

/** One grey block. Size it with className; `strong` for titles and figures. */
export function Bone({
  className,
  strong = false,
  round = false,
}: {
  className?: string;
  strong?: boolean;
  /** A circle (avatars, icon buttons) instead of a pill. */
  round?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "block shrink-0",
        round ? "rounded-full" : "rounded-[30px]",
        styles.bone,
        strong && styles.strong,
        className,
      )}
    />
  );
}

/** A line of text: a bone as tall as the font, centred in its line box. */
export function TextBone({
  className,
  line = "h-8",
  strong = false,
}: {
  /** Width (and font height, e.g. "h-[1.2rem] w-1/2"). */
  className?: string;
  /** The text's line box, so the row keeps the real text's height. */
  line?: string;
  strong?: boolean;
}) {
  return (
    <span aria-hidden className={cn("flex items-center", line)}>
      <Bone strong={strong} className={cn("h-[1.2rem]", className)} />
    </span>
  );
}

/** Announces the loading state once, for screen readers. */
export function SkeletonPage({
  label = "Loading",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={cn("contents", className)}>
      {children}
    </div>
  );
}

/**
 * The activity card of the Explore lists (EventCard, RaffleCard, SaleCard,
 * RestaurantCard all share this frame): image left on phones, on top on
 * desktop, then tags, title, date + place, price.
 */
export function ActivityCardSkeleton({ aside = false }: { aside?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-row items-center lg:items-stretch lg:mb-8 lg:flex-col gap-4 w-full bg-white shadow-lg rounded-[10px] overflow-hidden pb-4 pl-4 lg:pl-0",
        !aside && "lg:max-w-140",
      )}
    >
      <Bone className="h-62 w-62 min-w-62 lg:h-[19.1rem] lg:w-full rounded-[10px]" />
      <div className="px-4 flex flex-1 lg:flex-auto flex-col gap-6 lg:gap-4 min-w-0">
        <TextBone line="hidden lg:flex h-8" className="w-1/2 h-[1.1rem]" />
        <div className="flex flex-col w-full gap-1">
          <TextBone line="h-[1.7rem]" className="w-3/4" strong />
          <TextBone line="flex lg:hidden h-8" className="w-1/3 h-[1.1rem]" />
        </div>
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <TextBone line="h-6" className="w-28 h-4" />
          <TextBone line="h-6" className="w-24 h-4" />
        </div>
        <TextBone line="h-6" className="w-24" strong />
      </div>
    </div>
  );
}

/** The grey circle of the header icon buttons (bell, saved, cart, back). */
export function IconButtonBone({ className }: { className?: string }) {
  return <Bone round className={cn("w-12 h-12 lg:w-14 lg:h-14", className)} />;
}

/** The grey rounded chips of the filter bars (Explore FilterSelect). */
export function PillBone({ className }: { className?: string }) {
  return <Bone className={cn("h-[3.5rem] w-[11rem]", className)} />;
}

/** A page title line: 1.8rem / 2.6rem font in a 4 / 4.8rem line. */
export function TitleBone({ className }: { className?: string }) {
  return (
    <TextBone
      line="h-10 lg:h-12"
      strong
      className={cn("h-[1.8rem] lg:h-[2.6rem] w-[16rem] lg:w-[22rem]", className)}
    />
  );
}
