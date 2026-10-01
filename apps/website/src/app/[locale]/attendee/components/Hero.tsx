"use client";
import Navbar from "@/components/Navbar";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import HeroPersonal from "@/assets/images/hero-personal.png";
import Image from "next/image";
import AppCta from "@/components/AppCta";

export default function Hero() {
  const t = useTranslations("PersonalPage.hero");
  return (
    <section className="bg-white pt-[2.5rem] pb-[2.5rem] lg:pb-[7rem] px-4 rounded-[3rem] flex flex-col gap-[6.5rem] lg:gap-[3rem] items-center">
      <Navbar />
      <div className="flex flex-col items-center gap-8 max-w-[890px] lg:mt-[7rem]">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-bold text-[3.8rem] lg:text-[7.8rem] font-primary leading-[45px] lg:leading-[90px] text-center lg:max-w-[720px]"
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
          <AppCta variant="explore" className="w-full sm:w-auto" />
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Image src={HeroPersonal} alt="Hero personal" width={1190} />
      </motion.div>
    </section>
  );
}
