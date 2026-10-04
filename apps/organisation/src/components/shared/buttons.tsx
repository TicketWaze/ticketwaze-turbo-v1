/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  ref?: any;
}

function Button({ className, children, ref, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      ref={ref}
      className={cn(
        "px-12 py-6 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ButtonPrimary({ children, className, ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "bg-primary-500 disabled:bg-primary-500/50 hover:bg-primary-500/80 hover:border-primary-600",
        className,
      )}
    >
      {children}
    </Button>
  );
}

export function ButtonSecondary({
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "bg-primary-50 border-primary-500 hover:border-primary-200  text-primary-500",
        className,
      )}
    >
      {children}
    </Button>
  );
}

export function ButtonBlack({ children, className, ...props }: ButtonProps) {
  return (
    <Button {...props} className={cn("bg-black", className)}>
      {children}
    </Button>
  );
}

export function ButtonAccent({ children, className, ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "border-primary-500 text-primary-500 bg-primary-100",
        className,
      )}
    >
      {children}
    </Button>
  );
}

export function ButtonRed({ children, className, ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "border-failure text-failure bg-[#FCE5EA] disabled:bg-neutral-400 disabled:border-neutral-700 disabled:cursor-not-allowed disabled:text-neutral-700",
        className,
      )}
    >
      {children}
    </Button>
  );
}

export function ButtonNeutral({ children, className, ...props }: ButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "bg-neutral-100 text-neutral-700 hover:border-primary-500 hover:text-primary-500",
        className,
      )}
    >
      {children}
    </Button>
  );
}

export function ButtonYellowSecondary({
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "bg-warning/20 border-warning text-neutral-700 hover:bg-warning/30",
        className,
      )}
    >
      {children}
    </Button>
  );
}

/**
 * The compact pill of the Figma page headers ("Check in", "Share event",
 * "Create ticket"): 35px tall, 14px text. `primary` is the orange one.
 */
export function ButtonPill({
  children,
  className,
  tone = "neutral",
  ref,
  ...props
}: ButtonProps & { tone?: "neutral" | "primary" }) {
  return (
    <button
      {...props}
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-3 rounded-[3rem] px-6 py-[.7rem] border font-sans text-[1.4rem] leading-8 whitespace-nowrap cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        tone === "primary"
          ? "bg-primary-500 border-primary-600 text-white hover:bg-primary-600"
          : "bg-neutral-100 border-transparent text-neutral-700 hover:bg-neutral-200 hover:text-deep-100",
        className,
      )}
    >
      {children}
    </button>
  );
}
