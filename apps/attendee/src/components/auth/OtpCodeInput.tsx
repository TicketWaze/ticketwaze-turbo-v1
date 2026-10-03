"use client";
import React, { useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";

export const OTP_LENGTH = 6;
export const emptyOtp = () => Array<string>(OTP_LENGTH).fill("");

/**
 * Six single-digit boxes with auto-advance, backspace-to-previous and paste
 * support. Boxes stagger in, pop as digits land, and shake on a new `error`.
 */
export default function OtpCodeInput({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  onSubmit: () => void;
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

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") onSubmit();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const next = emptyOtp();
    digits.split("").forEach((ch, i) => (next[i] = ch));
    onChange(next);
    refs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
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
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          className={cn(
            "w-[5.2rem] h-[6rem] text-center text-[2.2rem] font-semibold border rounded-[1.5rem] outline-none focus:border-primary-500 transition-colors duration-200 text-deep-100 bg-neutral-100",
            error ? "border-failure" : "border-transparent",
          )}
        />
      ))}
    </motion.div>
  );
}
