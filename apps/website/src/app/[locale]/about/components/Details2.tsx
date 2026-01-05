"use client";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export default function Details2() {
  const t = useTranslations("AboutPage.details2");
  return (
    <section className="bg-primary-500 py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start gap-[3.5rem] lg:gap-[75px]">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[32px] lg:leading-[50px] text-white max-w-[690px]"
      >
        {t("title")}
      </motion.h2>
      <div className="flex flex-col lg:flex-row gap-[50px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col flex-1 gap-12"
        >
          <span className="font-primary font-bold text-[5.4rem] lg:text-[7.8rem] leading-[65px] lg:leading-[90px] text-white">
            18
          </span>
          <span className="text-neutral-200 text-[2.2rem] leading-[2.5rem]">
            {t("region")}
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-[2.5px] hidden lg:block h-auto bg-primary-600"
        ></motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-[2.5px] w-full lg:hidden bg-primary-600"
        ></motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col flex-1 gap-12"
        >
          <span className="font-primary font-bold text-[5.4rem] lg:text-[7.8rem] leading-[65px] lg:leading-[90px] text-white">
            2
          </span>
          <span className="text-neutral-200 text-[2.2rem] leading-[2.5rem]">
            {t("languages")}
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-[2.5px] hidden lg:block h-auto bg-primary-600"
        ></motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-[2.5px] w-full lg:hidden bg-primary-600"
        ></motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col flex-1 gap-12"
        >
          <span className="font-primary font-bold text-[5.4rem] lg:text-[7.8rem] leading-[65px] lg:leading-[90px] text-white">
            3
          </span>
          <span className="text-neutral-200 text-[2.2rem] leading-[2.5rem]">
            {t("payments")}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
