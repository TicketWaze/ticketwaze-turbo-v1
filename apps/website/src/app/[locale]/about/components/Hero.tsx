"use client";
import Navbar from "@/components/Navbar";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations("AboutPage.hero");
  const slide1 = [
    {
      name: t("simple"),
    },
    {
      name: "blank",
    },
    {
      name: t("global"),
    },
    {
      name: "blank",
    },
  ];
  const slide2 = [
    {
      name: t("accessible"),
    },
    {
      name: t("secured"),
    },
    {
      name: "blank",
    },
    {
      name: "blank",
    },
  ];
  return (
    <section className="bg-white pt-[2.5rem] pb-[2.5rem] lg:pb-[5rem] px-4 lg:px-0 rounded-[3rem] flex flex-col gap-[6.5rem] lg:gap-[15.6rem] items-center overflow-hidden">
      <Navbar />
      <div className="flex flex-col items-center gap-8 max-w-[950px]">
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
          className="text-[1.6rem] lg:text-[2.6rem] leading-[22.5px] lg:leading-[35px] lg:tracking-[-0.78px] text-neutral-700 font-sans text-center w-full max-w-[850px]"
        >
          {t("description")}
        </motion.p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col gap-[13.5px] lg:gap-[21px] items-center justify-center relative overflow-hidden"
      >
        <InfiniteMovingCards items={slide1} direction="right" speed="fast" />
        <InfiniteMovingCards items={slide2} direction="left" speed="fast" />
      </motion.div>
    </section>
  );
}
