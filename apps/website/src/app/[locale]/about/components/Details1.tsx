"use client";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import Shield from "@/assets/icons/shield.svg";
import Compas from "@/assets/icons/compas.svg";
import Globus from "@/assets/icons/globus.svg";
import Wallet from "@/assets/icons/wallet.svg";
import Image from "next/image";
import bg from "@/assets/images/details-card-bg.svg";

export default function Details1() {
  const t = useTranslations("AboutPage.details1");
  const items = [
    {
      image: Shield,
      title: t("first.title"),
      description: t("first.description"),
    },
    {
      image: Compas,
      title: t("second.title"),
      description: t("second.description"),
    },
    {
      image: Globus,
      title: t("third.title"),
      description: t("third.description"),
    },
    {
      image: Wallet,
      title: t("fourth.title"),
      description: t("fourth.description"),
    },
  ];
  return (
    <section className="bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start gap-[3.5rem] lg:gap-[100px]">
      <div className="flex flex-col gap-8 max-w-[850px]">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[32px] lg:leading-[50px] text-deep-200 max-w-[750px]"
        >
          {t("title1")} <span className="text-primary-500">{t("title2")}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-sans text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-[3.5rem] text-neutral-600"
        >
          {t("description")}
        </motion.p>
      </div>
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {items.map(({ description, image, title }, id) => {
          return (
            <motion.li
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              key={id}
              className="bg-neutral-100 w-full rounded-[3rem] flex flex-col gap-[55px] overflow-hidden"
            >
              <div className="relative">
                <Image src={bg} alt="background" />
                <Image
                  src={image}
                  alt={title}
                  className="absolute top-[50%] left-[50%] -translate-y-[50%] -translate-x-[50%]"
                />
              </div>
              <div className="flex flex-col gap-[1.5rem] px-[3rem] pb-12">
                <span className="font-sans font-semibold text-[2.2rem] leading-[3rem] text-deep-200">
                  {title}
                </span>
                <span className="font-sans text-[1.8rem] leading-[25px] text-neutral-700">
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
