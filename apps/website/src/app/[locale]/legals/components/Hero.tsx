"use client";
import Navbar from "@/components/Navbar";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations("LegalPage.hero");
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
      name: "blank",
    },
    {
      name: "blank",
    },
    {
      name: t("secured"),
    },
  ];
  return (
    <section className="bg-white py-[2.5rem] px-4 lg:px-0 rounded-[3rem] flex flex-col gap-[6.5rem] lg:gap-[15.6rem] items-center overflow-hidden">
      <Navbar />
      <div className="flex flex-col gap-8 max-w-[950px]">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-bold text-[3.8rem] text-neutral-900 lg:text-[7.8rem] font-primary leading-[45px] lg:leading-[90px] text-center"
        >
          {t("title-1")}{" "}
          <span className="text-primary-500">{t("title-2")}</span>{" "}
          {t("title-3")}
        </motion.h1>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className=" flex flex-col gap-0 lg:gap-8 items-center justify-center relative overflow-hidden"
      >
        <InfiniteMovingCards items={slide1} direction="right" speed="fast" />
        <InfiniteMovingCards items={slide2} direction="left" speed="fast" />
      </motion.div>
    </section>
  );
}
