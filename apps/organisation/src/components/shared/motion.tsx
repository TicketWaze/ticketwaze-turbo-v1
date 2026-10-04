"use client";

import { motion } from "motion/react";
import React from "react";

/*
 * The motion vocabulary of the dashboard pages, matching the attendee app's
 * Explore page so both products move the same way.
 */

/** The attendee app's ease-out curve. */
export const ease = [0.22, 1, 0.36, 1] as const;

/** Cards rising into a grid, staggered and capped so long lists don't drag. */
export function cardMotion(index: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97 },
    transition: {
      duration: 0.35,
      ease: "easeOut" as const,
      delay: Math.min(index * 0.06, 0.3),
    },
  };
}

/** Spring for the active-tab highlight sliding between pills. */
export const tabSpring = {
  type: "spring",
  stiffness: 420,
  damping: 34,
} as const;

/**
 * A block that fades and rises in on mount. Usable from server components:
 * the page stays server-rendered and only this wrapper is client-side.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Rise distance; negative drops in from above (headers). */
  y?: number;
  as?: "div" | "section";
}) {
  const Tag = as === "section" ? motion.section : motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
    >
      {children}
    </Tag>
  );
}

/** A bar that grows to its width, for the analytics distributions. */
export function GrowBar({
  value,
  className,
  delay = 0,
}: {
  /** 0–100. */
  value: number;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.span
      className={className}
      initial={{ width: 0 }}
      animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      transition={{ duration: 0.6, ease, delay }}
    />
  );
}

/**
 * Each child rises in after the one before it — for the cards of a form or
 * list rendered in one go. Falsy children (conditional cards) are skipped.
 */
export function Stagger({
  children,
  step = 0.05,
  max = 0.4,
}: {
  children: React.ReactNode;
  step?: number;
  max?: number;
}) {
  let i = 0;
  return (
    <>
      {React.Children.map(children, (child) => {
        if (!child) return child;
        const delay = Math.min(i++ * step, max);
        return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay }}
          >
            {child}
          </motion.div>
        );
      })}
    </>
  );
}
