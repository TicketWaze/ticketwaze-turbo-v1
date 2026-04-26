"use client";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Success from "@ticketwaze/ui/assets/images/accepted.png";
import { motion } from "framer-motion";

export default function AcceptedPage() {
  const t = useTranslations("Auth.password_created");
  return (
    <div className="flex flex-col justify-center gap-16 h-full pb-4 overflow-y-auto">
      <div className="w-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Image src={Success} alt="Success icon"></Image>
        </motion.div>
      </div>
      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="font-primary text-center font-medium text-[3.2rem] leadind-[3.5rem]"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-neutral-700 text-[1.8rem] leading-10 text-center"
          >
            {t("text")}
          </motion.p>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-primary-500 text-center text-[1.8rem] leading-10"
        >
          {t("signing")}
        </motion.p>
      </div>
    </div>
  );
}
