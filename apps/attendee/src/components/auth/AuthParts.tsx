"use client";
import React from "react";
import Image, { StaticImageData } from "next/image";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { Ticket2, User } from "iconsax-reactjs";
import { cn } from "@/lib/utils";
import Logo from "@ticketwaze/ui/assets/images/logo-horizontal-white.svg";
import ticket from "@ticketwaze/ui/assets/images/ticket-auth-bg.svg";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";

// Building blocks for the auth screens (Figma "Attendee + Mobile" →
// Authentication). Every screen is: heading, body, then a pinned footer pill.

const ease = [0.22, 1, 0.36, 1] as const;

const staggerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.18 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
};

/**
 * One entrance step inside an AuthScreen: items fade up in document order.
 * Wrap form fields, buttons and notes in it.
 */
export function AuthItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={cn("w-full", className)}>
      {children}
    </motion.div>
  );
}

export function AuthHeading({
  title,
  description,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 items-center text-center w-full">
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease }}
        className="font-medium font-primary text-[3.2rem] leading-14 text-black"
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease }}
          className="text-[1.8rem] leading-10 text-neutral-700"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

/**
 * Screen scaffold with the footer pinned to the bottom. Forms sit 120px from
 * the top of the panel as in Figma; status screens (mail sent, success) are
 * vertically centred. Body children wrapped in AuthItem stagger in; the footer
 * fades up last.
 */
export function AuthScreen({
  children,
  footer,
  centered = false,
  className,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  centered?: boolean;
  className?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-16 w-full h-full pb-4 lg:pb-12">
      <motion.div
        variants={staggerVariants}
        initial="hidden"
        animate="show"
        className={cn(
          "flex-1 flex flex-col w-full pt-18",
          centered ? "justify-center lg:pt-0" : "lg:pt-[10rem]",
          className,
        )}
      >
        {children}
      </motion.div>
      {footer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45, ease }}
          className="flex justify-center w-full"
        >
          {footer}
        </motion.div>
      )}
    </div>
  );
}

/** Rounded outline pill holding a short prompt and an action, e.g. "Don't own an account? [Sign up]". */
export function FooterPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[1.8rem] border border-neutral-100 py-4 pr-4 pl-6 rounded-[10rem]">
      {children}
    </div>
  );
}

export function FooterPillText({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[1.8rem] leading-10 text-neutral-700 text-center">
      {children}
    </span>
  );
}

/** Small accent button used inside FooterPill (45px tall in Figma). */
export const pillActionClass =
  "h-[4.5rem] px-12 border-2 border-primary-400 rounded-[10rem] bg-primary-50 text-primary-500 text-[1.5rem] leading-8 flex items-center justify-center whitespace-nowrap cursor-pointer transition-all duration-200 hover:bg-primary-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed";

/** Standalone "Back" pill pinned under single screens (150×60 in Figma). */
export const backPillClass = cn(pillActionClass, "h-[6rem] w-[15rem]");

/** "1/2 [Back]" step indicator from the multi-step auth screens. */
export function StepFooter({
  step,
  total,
  onBack,
}: {
  step: number;
  total: number;
  onBack?: () => void;
}) {
  const t = useTranslations("Auth.flow");
  return (
    <FooterPill>
      <span className="text-[1.8rem] leading-10 text-neutral-500 px-2 inline-flex">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={step}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease }}
            className="text-primary-500"
          >
            {step}
          </motion.span>
        </AnimatePresence>
        /{total}
      </span>
      {onBack && (
        <button type="button" onClick={onBack} className={pillActionClass}>
          {t("back")}
        </button>
      )}
    </FooterPill>
  );
}

export function OrDivider() {
  const t = useTranslations("Auth.flow");
  return (
    <motion.p
      variants={itemVariants}
      className="text-[1.8rem] leading-10 text-neutral-700 text-center"
    >
      {t("or")}
    </motion.p>
  );
}

export type AuthRole = "attendee" | "organizer";

/** Attendee / Organizer radio cards. Selected card is white with an orange outline. */
export function RoleCards({
  value,
  onChange,
}: {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
}) {
  const t = useTranslations("Auth.flow.role");
  const roles = [
    {
      key: "attendee" as const,
      Icon: User,
      title: t("attendee_title"),
      description: t("attendee_description"),
    },
    {
      key: "organizer" as const,
      Icon: Ticket2,
      title: t("organizer_title"),
      description: t("organizer_description"),
    },
  ];
  return (
    <div role="radiogroup" className="flex flex-col gap-8 w-full">
      {roles.map(({ key, Icon, title, description }, i) => {
        const selected = value === key;
        return (
          <motion.button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 + i * 0.07, ease }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-6 p-6 rounded-[20px] border text-left transition-[background-color,border-color,box-shadow] duration-300 cursor-pointer",
              selected
                ? "bg-white border-primary-400 shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)]"
                : "bg-neutral-100 border-transparent hover:border-primary-200",
            )}
          >
            <motion.span
              animate={{ scale: selected ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="shrink-0 flex"
            >
              <Icon
                size={25}
                variant="Bulk"
                color={selected ? "#E45B00" : "#454A53"}
              />
            </motion.span>
            <span className="flex flex-col gap-4 flex-1 min-w-0">
              <span className="font-primary font-medium text-[1.8rem] leading-10 text-neutral-900">
                {title}
              </span>
              <span className="text-[1.5rem] leading-8 text-neutral-500">
                {description}
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Centred illustration + heading block used by "Verify Account", "Account Created", etc. */
export function AuthStatus({
  image,
  title,
  description,
  children,
}: {
  image: StaticImageData;
  title: React.ReactNode;
  description: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-16 items-center w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src={image} alt="" width={150} height={150} priority />
        </motion.div>
      </motion.div>
      <AuthHeading title={title} description={description} />
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3, ease }}
          className="flex flex-col gap-12 items-center w-full"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

/** "Signing you in..." line under the success screens, with bouncing dots. */
export function SigningIn() {
  const t = useTranslations("Auth.flow");
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      aria-live="polite"
      className="text-[1.8rem] leading-10 text-primary-500 flex items-end"
    >
      {t("signing_in").replace(/\.+$/, "")}
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
    </motion.p>
  );
}

/**
 * Mobile-only entry screen: orange hero card with the ticket illustration and
 * "Create account" / "Log in" buttons. Desktop shows the same hero in the
 * layout's left panel, so this renders `lg:hidden`.
 */
export function AuthSplash({
  onCreate,
  onLogin,
}: {
  onCreate: () => void;
  onLogin: () => void;
}) {
  const tLayout = useTranslations("Auth.layout");
  const t = useTranslations("Auth.flow.splash");
  return (
    <div className="lg:hidden flex flex-col gap-8 h-full w-full py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="bg bg-primary-500 rounded-[30px] flex-1 flex flex-col gap-8 p-8 overflow-hidden bg-cover"
      >
        <motion.div
          variants={staggerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-8"
        >
          <motion.div variants={itemVariants}>
            <Image src={Logo} alt="Ticketwaze" width={130} height={37} />
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="font-primary font-bold text-[3.2rem] leading-[4rem] text-white"
          >
            {tLayout("title")}
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-[1.6rem] leading-9 text-neutral-200"
          >
            {tLayout("description")}
          </motion.p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 60, rotate: -6 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 14,
            delay: 0.35,
          }}
          className="self-center w-[60%] max-w-[22rem] mt-auto"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image src={ticket} alt="" className="w-full h-auto" />
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5, ease }}
        className="flex flex-col gap-6"
      >
        <ButtonPrimary
          onClick={onCreate}
          className="w-full h-[6rem] active:scale-[0.98]"
        >
          {t("create")}
        </ButtonPrimary>
        <ButtonSecondary
          onClick={onLogin}
          className="w-full h-[6rem] active:scale-[0.98]"
        >
          {t("login")}
        </ButtonSecondary>
      </motion.div>
    </div>
  );
}

/** Inline error under a form block; slides open/closed as it appears. */
export function AuthError({ message }: { message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          key={message}
          role="alert"
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="text-failure text-[1.3rem] text-center overflow-hidden"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
