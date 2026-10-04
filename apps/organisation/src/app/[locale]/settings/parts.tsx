"use client";
import React from "react";
import { motion } from "motion/react";
import { ArrowLeft2, ArrowRight2, Icon } from "iconsax-reactjs";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/*
 * The Settings pieces, sized to Figma (Organizers + Mobile › Settings): the
 * home cards, the Back + title header with its actions (Edit / Save changes),
 * and the centred 540px column the forms sit in.
 */

const cardClass =
  "w-full flex items-center justify-between gap-4 rounded-[1.2rem] bg-neutral-100 px-6 py-8 lg:py-10 cursor-pointer transition-[background-color,transform,box-shadow] duration-300 hover:bg-primary-50 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] group";

function CardInner({ Icon: I, label }: { Icon: Icon; label: string }) {
  return (
    <>
      <span className="flex items-center gap-5 min-w-0">
        <I
          size="24"
          variant="Bulk"
          className="shrink-0 fill-neutral-700 stroke-neutral-700 transition-colors group-hover:fill-primary-500 group-hover:stroke-primary-500"
        />
        <span className="font-primary font-medium text-[1.8rem] lg:text-[2rem] leading-10 text-deep-100 truncate transition-colors group-hover:text-primary-500">
          {label}
        </span>
      </span>
      <span className="w-[3.2rem] h-[3.2rem] shrink-0 rounded-full bg-neutral-200 flex items-center justify-center transition-colors group-hover:bg-primary-100">
        <ArrowRight2
          size="16"
          variant="Bulk"
          className="fill-neutral-700 stroke-neutral-700 transition-[transform,colors] group-hover:translate-x-0.5 group-hover:fill-primary-500 group-hover:stroke-primary-500"
        />
      </span>
    </>
  );
}

/** One Settings home card (Figma 1809:15286). Links, or acts when `onClick`. */
export function SettingsCard({
  Icon: I,
  label,
  href,
  external = false,
  onClick,
  index = 0,
  className,
}: {
  Icon: Icon;
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  index?: number;
  className?: string;
}) {
  const body = <CardInner Icon={I} label={label} />;
  return (
    <motion.li
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
        delay: Math.min(index * 0.05, 0.4),
      }}
    >
      {href ? (
        external ? (
          <a href={href} target="_blank" rel="noreferrer" className={cardClass}>
            {body}
          </a>
        ) : (
          <Link href={href} className={cardClass}>
            {body}
          </Link>
        )
      ) : (
        <button type="button" onClick={onClick} className={cardClass}>
          {body}
        </button>
      )}
    </motion.li>
  );
}

export const settingsCardClass = cardClass;

/**
 * Back pill, page title and the actions on the right (Figma: "Edit" turning
 * into "Save changes"). On phones the actions drop under the title.
 */
export function SettingsHeader({
  title,
  backHref = "/settings",
  actions,
}: {
  title: string;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  const t = useTranslations("Settings");
  const router = useRouter();
  return (
    <motion.header
      className="flex flex-col gap-8 shrink-0"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="flex w-fit cursor-pointer items-center gap-4 group"
      >
        <span className="size-[3.5rem] rounded-full bg-neutral-100 flex items-center justify-center transition-transform group-active:scale-90">
          <ArrowLeft2 size="20" color="#0d0d0d" variant="Bulk" />
        </span>
        <span className="text-neutral-700 text-[1.4rem] leading-8">
          {t("back")}
        </span>
      </button>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-12 text-black">
          {title}
        </h1>
        {actions && (
          <div className="flex flex-wrap items-center gap-4">{actions}</div>
        )}
      </div>
    </motion.header>
  );
}

/** The centred form column with its heading ("Organizer Information"). */
export function SettingsColumn({
  title,
  children,
  className,
  delay = 0.08,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay }}
      className={cn(
        "w-full max-w-[54rem] mx-auto flex flex-col gap-6",
        className,
      )}
    >
      {title && (
        <h2 className="font-sans font-medium text-[1.8rem] leading-10 text-deep-100">
          {title}
        </h2>
      )}
      {children}
    </motion.section>
  );
}

/** Figma's switch (2FA, notifications, save details). */
export function SettingsSwitch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-[2.8rem] w-[5rem] shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-primary-500" : "bg-neutral-500",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
        className={cn(
          "inline-block h-[2.2rem] w-[2.2rem] rounded-full bg-white shadow",
          checked ? "ml-[2.5rem]" : "ml-[0.3rem]",
        )}
      />
    </button>
  );
}
