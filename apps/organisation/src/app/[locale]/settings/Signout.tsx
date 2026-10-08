"use client";
import { motion } from "motion/react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

/** Phone-only "Log out" at the end of the Settings list (Figma 2226:68956). */
export default function Signout() {
  const t = useTranslations("Settings");
  return (
    <li className="lg:hidden pt-2">
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() =>
          signOut({
            redirect: true,
            redirectTo: `${process.env.NEXT_PUBLIC_ORGANISATION_URL}`,
          })
        }
        className="w-full h-[5rem] rounded-[10rem] border-2 border-failure bg-failure/10 font-sans font-semibold text-[1.5rem] text-failure cursor-pointer transition-colors hover:bg-failure/20"
      >
        {t("logout")}
      </motion.button>
    </li>
  );
}
