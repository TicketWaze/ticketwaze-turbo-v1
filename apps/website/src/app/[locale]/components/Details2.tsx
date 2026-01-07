"use client";
import locks from "@/assets/icons/locks.svg";
import verifieds from "@/assets/icons/verifieds.svg";
import scans from "@/assets/icons/scans.svg";
import bg from "@/assets/images/details2-card-bg.svg";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export default function Details2() {
  const t = useTranslations("HomePage.details2");
  const items = [
    {
      title: t("first.title"),
      description: t("first.description"),
      image: locks,
    },
    {
      title: t("second.title"),
      description: t("second.description"),
      image: verifieds,
    },
    {
      title: t("third.title"),
      description: t("third.description"),
      image: scans,
    },
  ];
  return (
    <section className="bg-deep-300 py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start gap-[3.5rem] lg:gap-[100px]">
      <div className="flex flex-col gap-8 max-w-[800px]">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[32px] lg:leading-[50px] text-white max-w-[480px]"
        >
          {t("title1")} <span className="text-primary-500">{t("title2")}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-sans text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-[3.5rem] text-neutral-300"
        >
          {t("description")}
        </motion.p>
      </div>
      <ul className="hidden lg:flex justify-between w-full gap-8">
        {items.map(({ description, image, title }, index) => {
          return (
            <motion.li
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.4 * (index + 1) }}
              key={title}
              className="bg-deep-200 w-[340px] lg:w-auto flex-1 lg:max-w-[480px] rounded-[3rem] flex flex-col gap-[55px] overflow-hidden"
            >
              <div className="relative">
                <Image src={bg} alt="background" />
                <Image
                  src={image}
                  alt={title}
                  className="absolute top-[50%] left-[50%] -translate-y-[50%] -translate-x-[50%]"
                />
              </div>
              <div className="flex flex-col gap-8 px-[3rem] pb-12">
                <span className="font-sans font-semibold text-[2.2rem] leading-[3rem] text-white">
                  {title}
                </span>
                <span className="font-normal font-sans text-[1.8rem] leading-[25px] text-neutral-300">
                  {description}
                </span>
              </div>
            </motion.li>
          );
        })}
      </ul>
      <ul className="flex lg:hidden flex-col lg:flex-row gap-8">
        {items.map(({ description, image, title }, index) => {
          return (
            <motion.li
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              key={title}
              className="bg-deep-200 flex-1 lg:max-w-[380px] rounded-[3rem] flex flex-col gap-[55px] overflow-hidden w-full"
            >
              <div className="relative">
                <Image src={bg} alt="background" />
                <Image
                  src={image}
                  alt={title}
                  className="absolute top-[50%] left-[50%] -translate-y-[50%] -translate-x-[50%]"
                />
              </div>
              <div className="flex flex-col gap-8 px-[3rem] pb-12">
                <span className="font-sans font-semibold text-[2.2rem] leading-[3rem] text-white">
                  {title}
                </span>
                <span className="font-normal font-sans text-[1.8rem] leading-[25px] text-neutral-300">
                  {description}
                </span>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
