"use client";
import { useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import successBadge from "@/assets/images/auth/success-badge.png";

export type PurchaseKind = "ticket" | "raffle" | "sale" | "reservation";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Figma "Purchase successful": badge, "Ticket purchased", where to find it,
 * then an animated "Opening …" while it moves on to `redirectTo` by itself.
 * `redirectTo` is an app path ("/upcoming/…") or an absolute URL.
 */
export default function PurchaseSuccess({
  kind = "ticket",
  redirectTo,
  delayMs = 2600,
}: {
  kind?: PurchaseKind;
  redirectTo: string;
  delayMs?: number;
}) {
  const t = useTranslations("Checkout");
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (/^https?:\/\//.test(redirectTo)) window.location.href = redirectTo;
      else router.replace(redirectTo);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [redirectTo, delayMs, router]);

  const title = kind === "ticket" ? t("purchased") : t(`success.${kind}.title`);
  const text =
    kind === "ticket" ? t("purchased_text") : t(`success.${kind}.text`);
  const cta = kind === "ticket" ? t("purchased_cta") : t(`success.${kind}.cta`);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-16 text-center px-6 py-16 min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src={successBadge} alt="" width={150} height={150} priority />
        </motion.div>
      </motion.div>
      <div className="flex flex-col gap-6 max-w-[45rem]">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease }}
          className="font-primary font-medium text-[3.2rem] leading-14 text-black"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease }}
          className="text-[1.8rem] leading-10 text-neutral-700"
        >
          {text}
        </motion.p>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        aria-live="polite"
        className="text-[1.8rem] leading-10 text-primary-500 flex items-end"
      >
        {cta.replace(/\s*\.+\s*$/, "")}
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
    </div>
  );
}

/** Shown while a return page is still confirming the payment with the API. */
export function PurchaseChecking() {
  const t = useTranslations("Checkout.success");
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 min-h-[60vh]">
      <motion.span
        className="size-[6rem] rounded-full border-4 border-primary-100 border-t-primary-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-[1.6rem] text-neutral-600">{t("checking")}</p>
    </div>
  );
}
