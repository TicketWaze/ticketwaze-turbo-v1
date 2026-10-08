"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import userBadge from "@/assets/images/auth/user-badge.png";
import { authHref } from "@/lib/authRedirect";

export type NoAuthIntent =
  | "purchase"
  | "follow"
  | "save"
  | "report"
  | "reserve"
  | "generic";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Signed-out prompt (Figma "Complete Purchase" / "Follow Organizer" modals):
 * illustration, title, one line, Cancel / Proceed. Proceed opens sign-in and
 * brings the visitor back to `callbackUrl` afterwards.
 */
export default function NoAuthDialog({
  callbackUrl,
  intent = "generic",
}: {
  callbackUrl: string;
  intent?: NoAuthIntent;
}) {
  const t = useTranslations("Layout.prompt");
  return (
    <DialogContent showCloseButton={false} className="gap-0">
      <NoAuthPrompt
        title={t(`${intent}.title`)}
        description={t(`${intent}.description`)}
      >
        <div className="flex gap-6 w-full">
          <DialogClose className="flex-1 h-[6rem] px-8 rounded-[10rem] border-2 border-primary-400 bg-primary-50 text-primary-500 text-[1.6rem] cursor-pointer transition-all duration-200 hover:bg-primary-100 active:scale-95">
            {t("cancel")}
          </DialogClose>
          <Link
            href={authHref("/auth/login", callbackUrl)}
            className="flex-1 h-[6rem] px-8 rounded-[10rem] border-2 border-primary-500 bg-primary-500 text-white font-semibold text-[1.6rem] flex items-center justify-center transition-all duration-200 hover:bg-primary-500/85 active:scale-95"
          >
            {t("proceed")}
          </Link>
        </div>
      </NoAuthPrompt>
    </DialogContent>
  );
}

/** The prompt body, shared with the buy-ticket dialog. */
export function NoAuthPrompt({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-16 lg:gap-20 items-center py-4 lg:py-0">
      {/* Time-based with an overshoot curve rather than a spring: inside the
          dialog the spring version never left its first frame, leaving the
          illustration invisible. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          opacity: { duration: 0.25, delay: 0.05 },
          default: { duration: 0.5, delay: 0.05, ease: [0.34, 1.56, 0.64, 1] },
        }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={userBadge}
            alt=""
            width={150}
            height={150}
            className="size-[11rem] lg:size-[15rem]"
            priority
          />
        </motion.div>
      </motion.div>
      <div className="flex flex-col gap-12 items-center w-full">
        <div className="flex flex-col gap-6 text-center max-w-[42.3rem]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15, ease }}
          >
            <DialogTitle className="font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-12 text-black capitalize">
              {title}
            </DialogTitle>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2, ease }}
          >
            <DialogDescription className="text-[1.6rem] lg:text-[1.8rem] leading-10 text-[#CDCDCD]">
              {description}
            </DialogDescription>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28, ease }}
          className="w-full flex flex-col gap-8"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
