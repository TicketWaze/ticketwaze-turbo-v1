"use client";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Logo from "@ticketwaze/ui/assets/images/logo-horizontal-orange.svg";
import GoogleSignInButton from "@/components/shared/GoogleSignInButton";

export default function LoginPageContent() {
  const t = useTranslations("Auth.login");

  return (
    <div className="flex flex-col items-center justify-center gap-12 h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:hidden pt-10"
      >
        <Image src={Logo} alt="Ticket Waze" width={140} height={40} />
      </motion.div>
      <div className="flex flex-col gap-8 items-center text-center">
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-medium font-primary text-[3.2rem] leading-14 text-black"
        >
          {t("title")}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-[1.8rem] leading-10 text-neutral-700"
        >
          {t("description")}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full"
      >
        <GoogleSignInButton />
      </motion.div>
    </div>
  );
}
