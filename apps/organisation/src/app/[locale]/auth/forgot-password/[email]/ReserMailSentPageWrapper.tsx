"use client";
import Image from "next/image";
import mail from "./mail-big.svg";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import maskEmail from "@/lib/maskEmail";

export default function ReserMailSentPageWrapper({ email }: { email: string }) {
  const t = useTranslations("Auth.email_sent");
  return (
    <div
      className={
        " flex flex-col gap-16 items-center justify-center h-dvh lg:h-full"
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Image src={mail} alt={"email icon"} />
      </motion.div>
      <div className={"flex flex-col gap-8 items-center"}>
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={
            "font-medium font-primary text-[3.2rem] leading-14 text-center text-black"
          }
        >
          {t("title")}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={
            "font-normal text-[1.8rem] leading-10 text-center text-neutral-700"
          }
        >
          {t("description")}{" "}
          <span className={"font-bold"}>
            {maskEmail(decodeURIComponent(email))}
          </span>
        </motion.p>
      </div>
      {/* <ResendButton email={decodeURIComponent(email)}/> */}
    </div>
  );
}
