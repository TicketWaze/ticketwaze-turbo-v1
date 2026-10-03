"use client";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Figma's settings rows, shared by Preference and Settings: a titled section of
 * rows split by dividers, each row a full-width target with its control on
 * the right.
 */
export function Section({
  title,
  index,
  children,
}: {
  title: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease }}
      className="flex flex-col"
    >
      <span className="font-medium text-[1.8rem] mb-6 leading-10 text-deep-100">
        {title}
      </span>
      <div className="flex flex-col divide-y-2 divide-neutral-100">
        {children}
      </div>
    </motion.section>
  );
}

/** A whole-row target, as in Figma: label left, control right. */
export function Row({
  onClick,
  role = "checkbox",
  ariaChecked,
  children,
}: {
  onClick: () => void;
  role?: "checkbox" | "switch" | "radio";
  ariaChecked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={ariaChecked}
      onClick={onClick}
      className="w-full flex items-center justify-between gap-6 py-6 text-left cursor-pointer group"
    >
      {children}
    </button>
  );
}

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <motion.span
      animate={{
        backgroundColor: checked ? "#E45B00" : "#FFFFFF",
        borderColor: checked ? "#E45B00" : "#DADDE1",
        scale: checked ? [1, 1.15, 1] : 1,
      }}
      transition={{ duration: 0.25 }}
      className="shrink-0 w-12 h-12 rounded-[0.6rem] border-2 flex items-center justify-center group-hover:border-primary-500"
    >
      <motion.svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        initial={false}
        animate={{ opacity: checked ? 1 : 0 }}
      >
        <motion.path
          d="M2.5 7.5l3 3 6-7"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.25 }}
        />
      </motion.svg>
    </motion.span>
  );
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <motion.span
      animate={{ backgroundColor: on ? "#E45B00" : "#737C8A" }}
      transition={{ duration: 0.2 }}
      className={`shrink-0 w-20 h-12 rounded-full p-1 flex ${on ? "justify-end" : "justify-start"}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 35 }}
        className="w-10 h-10 rounded-full bg-white shadow-sm"
      />
    </motion.span>
  );
}

export function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={`shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? "border-primary-500" : "border-neutral-300 group-hover:border-primary-500"}`}
    >
      <motion.span
        initial={false}
        animate={{ scale: checked ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-6 h-6 rounded-full bg-primary-500"
      />
    </span>
  );
}
