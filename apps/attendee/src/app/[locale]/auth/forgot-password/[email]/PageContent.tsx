"use client";
import React from "react";
import mail from "./mail-big.svg";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function PageContent({ email }: { email: string }) {
  const t = useTranslations("Auth.email_sent");
  return (
    <div
      className={
        " flex flex-col gap-16 items-center justify-center h-dvh lg:h-full"
      }
    >
      <Image src={mail} alt={"email icon"} />
      <div className={"flex flex-col gap-8 items-center"}>
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={
            "font-medium font-primary text-[3.2rem] leading-[35px] text-center text-black"
          }
        >
          {t("title")}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={
            "font-normal max-w-[530px] text-[1.8rem] leading-[25px] text-center text-neutral-700"
          }
        >
          {t("description")}{" "}
          <span className="font-semibold">{decodeURIComponent(email)}</span>
        </motion.p>
      </div>
      {/* <ResendButton email={decodeURIComponent(email)}/> */}
    </div>
  );
}
