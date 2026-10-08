"use client";
import React, { useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";

export const OTP_LENGTH = 6;
export const emptyOtp = () => Array<string>(OTP_LENGTH).fill("");

/**
 * Six single-digit boxes with auto-advance, backspace-to-previous and paste
 * support. Boxes stagger in, pop as digits land, and shake on a new `error`.
 * Submits by itself as soon as the sixth digit lands (typed, pasted or
 * autofilled by the phone).
 */
export default function OtpCodeInput({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  onSubmit: (code: string) => void;
  error?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const shake = useAnimationControls();

  useEffect(() => {
    if (error) {
      void shake.start({
        x: [0, -10, 10, -6, 6, 0],
        transition: { duration: 0.4 },
      });
    }
  }, [error, shake]);

  /** Writes digits from `start` on, moves focus, and submits once complete. */
  function fill(start: number, digits: string, base: string[]) {
    const next = [...base];
    digits.split("").forEach((ch, i) => {
      if (start + i < OTP_LENGTH) next[start + i] = ch;
    });
    onChange(next);
    const code = next.join("");
    if (code.length === OTP_LENGTH) {
      refs.current[OTP_LENGTH - 1]?.blur();
      // The parent's state hasn't caught up yet, so the code travels along.
      onSubmit(code);
    } else {
      refs.current[Math.min(start + digits.length, OTP_LENGTH - 1)]?.focus();
    }
  }

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      const next = [...value];
      next[index] = "";
      onChange(next);
      return;
    }
    // Typing into a filled box leaves the old digit next to the new one:
    // keep the new one. Anything longer is phone autofill (`one-time-code`)
    // dropping the whole code into this box.
    if (value[index] && digits.length === 2) {
      fill(index, digits[0] === value[index] ? digits[1] : digits[0], value);
      return;
    }
    fill(index, digits, value);
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") onSubmit(value.join(""));
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (digits) fill(0, digits, emptyOtp());
  }

  return (
    <motion.div animate={shake} className="flex gap-4 justify-center">
      {value.map((digit, index) => (
        <motion.input
          key={index}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: digit ? [1.12, 1] : 1,
          }}
          transition={{
            opacity: { delay: 0.25 + index * 0.05 },
            y: {
              delay: 0.25 + index * 0.05,
              type: "spring",
              stiffness: 300,
              damping: 20,
            },
            scale: { duration: 0.2 },
          }}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          maxLength={OTP_LENGTH}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            "w-[5.2rem] h-[6rem] text-center text-[2.2rem] font-semibold border rounded-[1.5rem] outline-none focus:border-primary-500 transition-colors duration-200 text-deep-100 bg-neutral-100",
            error ? "border-failure" : "border-transparent",
          )}
        />
      ))}
    </motion.div>
  );
}
