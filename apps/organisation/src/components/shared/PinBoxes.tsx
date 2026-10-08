"use client";
import React, { useEffect, useRef } from "react";
import { motion, useAnimationControls } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Figma's four PIN squares (Withdrawal Pin, Create Withdrawal Pin): digits
 * show as dots, focus moves on by itself, backspace goes back, a pasted PIN
 * fills every box, and the row shakes when `errorKey` changes.
 */
export default function PinBoxes({
  value,
  onChange,
  length = 4,
  errorKey,
  autoFocus = false,
  label,
  stretch = false,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  /** Bump to shake (e.g. a counter incremented on a wrong PIN). */
  errorKey?: number;
  autoFocus?: boolean;
  /** Accessible name for the group. */
  label: string;
  /** Boxes share the row's full width (Create Withdrawal Pin). */
  stretch?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const shake = useAnimationControls();
  useEffect(() => {
    if (errorKey) {
      void shake.start({
        x: [0, -10, 10, -6, 6, 0],
        transition: { duration: 0.4 },
      });
    }
  }, [errorKey, shake]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function write(start: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;
    const next = digits.slice();
    typed.split("").forEach((d, i) => {
      if (start + i < length) next[start + i] = d;
    });
    onChange(next.join("").slice(0, length));
    refs.current[Math.min(start + typed.length, length - 1)]?.focus();
  }

  return (
    <motion.div
      animate={shake}
      role="group"
      aria-label={label}
      className={cn("flex gap-3", stretch && "w-full")}
    >
      {digits.map((d, i) => (
        <motion.label
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className={cn(
            stretch
              ? "relative flex-1 h-[5.6rem] rounded-[1.2rem]"
              : "relative w-[5.6rem] h-[5.6rem] rounded-[1.2rem]",
            " bg-neutral-100 border border-transparent flex items-center justify-center cursor-text transition-colors",
            "focus-within:border-primary-500",
          )}
        >
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={length}
            autoFocus={autoFocus && i === 0}
            aria-label={`${label} ${i + 1}`}
            value={d}
            onChange={(e) => {
              if (!e.target.value) {
                const next = digits.slice();
                next[i] = "";
                onChange(next.join(""));
                return;
              }
              write(i, e.target.value.slice(-length));
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) {
                refs.current[i - 1]?.focus();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              write(i, e.clipboardData.getData("text"));
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
          />
          <motion.span
            aria-hidden
            initial={false}
            animate={{ scale: d ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 26 }}
            className="w-[1rem] h-[1rem] rounded-full bg-deep-100"
          />
        </motion.label>
      ))}
    </motion.div>
  );
}
