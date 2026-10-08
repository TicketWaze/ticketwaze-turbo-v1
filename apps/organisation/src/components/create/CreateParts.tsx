"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft2 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { AuthStatus } from "@/components/auth/AuthParts";
import SuccessBadge from "@/assets/images/auth/success-badge.png";
import { cn } from "@/lib/utils";
import { ease } from "@/components/shared/motion";

/*
 * The pieces every create flow is built from, sized to Figma (Organizers +
 * Mobile › Events, Create Event rows): the Back + title + stepper header, the
 * white section cards, the Continue / Back footer (a "1/3" pill bar on phones)
 * and the "Created successfully" screen. Events, raffles, teasers, venues and
 * digital products all use them, so every create flow reads as one product.
 */

/** Back pill + page title, with the step indicator on the right on desktop. */
export function CreateHeader({
  title,
  steps,
  current = 0,
  onBack,
  backLabel,
}: {
  title: string;
  /** Step labels; omitted for single-page forms. */
  steps?: string[];
  /** Zero-based current step. */
  current?: number;
  onBack: () => void;
  backLabel?: string;
}) {
  const t = useTranslations("Events.create_event");
  return (
    <motion.header
      className="flex flex-col gap-8 shrink-0"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit cursor-pointer items-center gap-4 group"
      >
        <span className="size-[3.5rem] rounded-full bg-neutral-100 flex items-center justify-center transition-transform group-active:scale-90">
          <ArrowLeft2 size="20" color="#0d0d0d" variant="Bulk" />
        </span>
        <span className="text-neutral-700 text-[1.4rem] leading-8">
          {backLabel ?? t("back")}
        </span>
      </button>
      <div className="flex items-center gap-4 pb-4">
        <h1 className="flex-1 min-w-0 font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-12 text-black">
          {title}
        </h1>
        {steps && steps.length > 1 && (
          <Stepper steps={steps} current={current} />
        )}
      </div>
    </motion.header>
  );
}

/** "Basic Details ━━ Date & Time ━━ Ticket", filling as steps complete. */
function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="hidden lg:flex items-center gap-4 w-[58rem] shrink-0">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <li
            className={cn(
              "font-sans text-[1.5rem] leading-12 whitespace-nowrap transition-colors duration-300",
              i <= current ? "text-primary-500" : "text-neutral-500",
              i === current && "font-medium",
            )}
            aria-current={i === current ? "step" : undefined}
          >
            {label}
          </li>
          {i < steps.length - 1 && (
            <li aria-hidden className="flex-1 h-[.5rem] rounded-full bg-neutral-100 overflow-hidden">
              <motion.span
                className="block h-full bg-primary-500 rounded-full"
                initial={false}
                animate={{ width: i < current ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease }}
              />
            </li>
          )}
        </React.Fragment>
      ))}
    </ol>
  );
}

/** The white bordered card each group of fields sits in. */
export function Section({
  id,
  title,
  action,
  children,
  className,
}: {
  /** Anchor, so links such as the details drawer can jump to it. */
  id?: string;
  title?: React.ReactNode;
  /** Right of the title, e.g. a delete button on "Day 2". */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "w-full max-w-[54rem] mx-auto scroll-mt-8 bg-white border border-neutral-100 rounded-[1.5rem] p-6 flex flex-col gap-6",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-4">
          {title && (
            <h2 className="font-sans font-semibold text-[1.6rem] leading-[2.25rem] text-deep-100">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** The steps' content, sliding in from the side the user is heading to. */
export function StepPanel({
  stepKey,
  direction,
  children,
  className,
}: {
  stepKey: React.Key;
  /** >= 0 forward, < 0 back. */
  direction: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      key={stepKey}
      initial={{ x: direction >= 0 ? 40 : -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease }}
      className={cn("flex flex-col gap-12", className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Continue (and Back, from the second step). Desktop: centred under the form,
 * 540px wide like the cards. Phones: the "1/3 [Back] [Continue]" pill bar
 * pinned above the tab bar.
 */
export function CreateFooter({
  step,
  total,
  onBack,
  onContinue,
  continueLabel,
  disabled = false,
  loading = false,
  type = "button",
  formId,
}: {
  /** Zero-based. */
  step: number;
  total: number;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  /** The form a submit button belongs to, when it sits outside it. */
  formId?: string;
}) {
  const t = useTranslations("Events.create_event");
  const label = loading ? <LoadingCircleSmall /> : (continueLabel ?? t("proceed"));
  return (
    <>
      <div className="hidden lg:flex w-full max-w-[54rem] mx-auto gap-6 pt-4 pb-8 shrink-0">
        {onBack && (
          <ButtonSecondary type="button" onClick={onBack} className="flex-1 h-[6rem] font-bold text-[1.6rem]">
            {t("back")}
          </ButtonSecondary>
        )}
        <ButtonPrimary
          type={type}
          form={formId}
          onClick={onContinue}
          disabled={disabled || loading}
          className="flex-1 h-[6rem] font-semibold disabled:cursor-not-allowed"
        >
          {label}
        </ButtonPrimary>
      </div>

      <div className="lg:hidden fixed bottom-36 inset-x-0 z-50 px-8 mb-4">
        <div className="bg-white border border-neutral-100 rounded-[10rem] pl-6 pr-3 py-2 flex items-center justify-between gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          {total > 1 ? (
            <span className="font-sans text-[2.2rem] leading-12 text-neutral-600 inline-flex">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={step}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25, ease }}
                  className="text-primary-500"
                >
                  {step + 1}
                </motion.span>
              </AnimatePresence>
              /{total}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-4">
            {onBack && (
              <ButtonSecondary type="button" onClick={onBack} className="h-[4.5rem] px-10 font-bold">
                {t("back")}
              </ButtonSecondary>
            )}
            <ButtonPrimary
              type={type}
              form={formId}
              onClick={onContinue}
              disabled={disabled || loading}
              className="h-[4.5rem] px-10 font-semibold disabled:cursor-not-allowed"
            >
              {label}
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </>
  );
}

/** "Event Created Successfully — Opening event…", shown while we navigate. */
export function CreatedScreen({
  title,
  description,
  pendingLabel,
}: {
  title: string;
  description: string;
  /** "Opening event", without the trailing dots (they animate). */
  pendingLabel: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <div className="max-w-[46rem]">
        <AuthStatus image={SuccessBadge} title={title} description={description}>
          <p
            aria-live="polite"
            className="text-[1.8rem] leading-10 text-primary-500 flex items-end"
          >
            {pendingLabel.replace(/\.+$/, "")}
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                aria-hidden
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
              >
                .
              </motion.span>
            ))}
          </p>
        </AuthStatus>
      </div>
    </div>
  );
}

/** Categories an event can be filed under, as stored by the API. */
export const EVENT_CATEGORIES = [
  "conference",
  "concert",
  "festival",
  "comedy",
  "theater",
  "tournament",
  "workshop",
  "seminar",
  "networking",
  "startup",
  "food_festival",
  "art",
  "cultural",
  "charity",
  "fundraiser",
  "meetup",
  "community",
] as const;

/** The subset that makes sense online (no festivals or tournaments). */
export const ONLINE_EVENT_CATEGORIES = EVENT_CATEGORIES.filter(
  (c) => !["festival", "tournament", "food_festival"].includes(c),
);
