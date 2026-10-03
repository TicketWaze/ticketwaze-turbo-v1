"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArchiveMinus,
  Building,
  Clock,
  Setting2,
  Setting5,
  ShoppingCart,
  Star1,
  User,
  WalletMoney,
} from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import { authHref } from "@/lib/authRedirect";

const pages = {
  upcoming: { Icon: Star1, path: "/upcoming" },
  history: { Icon: Clock, path: "/history" },
  profile: { Icon: User, path: "/profile" },
  preferences: { Icon: Setting5, path: "/preferences" },
  wallet: { Icon: WalletMoney, path: "/wallet" },
  settings: { Icon: Setting2, path: "/settings" },
  organisations: { Icon: Building, path: "/organisations" },
  saved: { Icon: ArchiveMinus, path: "/explore/liked" },
  pending: { Icon: ShoppingCart, path: "/explore/pending" },
} as const;

export type SignedOutPage = keyof typeof pages;

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * What an account page shows to a signed-out visitor (Figma "Empty citys"):
 * the page title, a ringed icon, one line about the page, and "Log in or sign
 * up", which returns here afterwards.
 */
export default function SignedOutState({
  page,
  title,
  returnPath,
}: {
  page: SignedOutPage;
  title: string;
  /** Where to come back after signing in; defaults to the page's own path. */
  returnPath?: string;
}) {
  const t = useTranslations("Layout.signedOut");
  const { Icon, path } = pages[page];
  return (
    <div className="flex flex-col h-full min-h-[60vh]">
      <header>
        <h1 className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-12 text-black">
          {title}
        </h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center gap-[5rem] py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
          className="size-[12rem] rounded-full bg-neutral-100 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 14,
              delay: 0.1,
            }}
            className="size-[9rem] rounded-full bg-neutral-200 flex items-center justify-center"
          >
            <motion.span
              initial={{ rotate: -20, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease }}
              className="flex"
            >
              <Icon size={50} color="#0D0D0D" variant="Bulk" />
            </motion.span>
          </motion.div>
        </motion.div>
        <div className="flex flex-col gap-12 items-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease }}
            className="max-w-[42.3rem] text-center text-[1.6rem] lg:text-[1.8rem] leading-10 text-neutral-600"
          >
            {t(page)}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35, ease }}
          >
            <Link
              href={authHref("/auth/login", returnPath ?? path)}
              className="h-[4.5rem] px-12 rounded-[10rem] border-2 border-primary-500 bg-primary-500 text-white font-semibold text-[1.5rem] tracking-[-0.05em] flex items-center justify-center transition-all duration-200 hover:bg-primary-500/85 active:scale-95"
            >
              {t("cta")}
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
