"use client";
import Navbar from "@/components/Navbar";
import AppCta from "@/components/AppCta";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import HeroBusiness from "@/assets/images/hero-business.png";
import Image from "next/image";

export default function Hero() {
  const t = useTranslations("BusinessPage.hero");
  const locale = useLocale();
  return (
    <section className="bg-white pt-[2.5rem] pb-[2.5rem] lg:pb-[7rem] px-4 rounded-[3rem] flex flex-col gap-[6.5rem] lg:gap-[3rem] items-center">
      <Navbar />
      <div className="flex flex-col items-center gap-8 max-w-[890px] lg:mt-[7rem]">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-bold text-[3.8rem] lg:text-[7.8rem] font-primary leading-[45px] lg:leading-[90px] text-center"
        >
          <span className="text-neutral-900">{t("title")}</span>{" "}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[1.6rem] lg:text-[2.6rem] leading-[22.5px] lg:leading-[35px] lg:tracking-[-0.78px] text-neutral-700 font-sans text-center max-w-[780px]"
        >
          {t("description")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-center w-full sm:w-auto"
        >
          <AppCta
            href={`${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/auth/login`}
            label={t("cta.create")}
            className="w-full sm:w-auto px-[15px]"
          />
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Image src={HeroBusiness} alt="Hero personal" width={1190} />
      </motion.div>
    </section>
  );
}
