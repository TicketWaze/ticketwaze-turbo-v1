"use client";
import { Link } from "@/i18n/navigation";
import { Timer1 } from "iconsax-reactjs";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import confetti from "@/assets/images/confetti.png";
import Image from "next/image";
import AppCta from "@/components/AppCta";
export default function Discount() {
  const t = useTranslations("PersonalPage.discount");
  return (
    <section className="bg-white py-[3rem] lg:py-[10rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col lg:items-start gap-[3.5rem] lg:gap-[75px]">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[32px] lg:leading-[50px] text-deep-200 max-w-[480px]"
      >
        {t("title1")} <span className="text-primary-500">{t("title2")}</span>
      </motion.h2>
      <div className="flex flex-col lg:flex-row gap-[15px] lg:gap-[2.5rem] w-full lg:h-[620px]">
        <motion.div
          className="relative h-[350px] lg:h-full lg:flex-1 rounded-[3rem] overflow-hidden bg-neutral-100"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Image
            src={confetti}
            alt=""
            fill
            sizes="(min-width: 1024px) 440px, 100vw"
            className="object-cover"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-primary-50 rounded-[3rem] w-full lg:w-[729px] lg:shrink-0 min-h-[415px] lg:min-h-0 p-[3rem] lg:p-[5rem] flex flex-col justify-between gap-[8rem] lg:gap-0"
        >
          <span className="font-semibold text-[2.5rem] lg:text-[3rem] leading-12 text-primary-900 uppercase">
            {t("earn")}
          </span>
          <div className="relative inline-block self-center">
            {/* Background layers */}
            <span className="absolute -top-10 lg:-top-24 text-[50px] lg:text-[120px] font-primary font-bold text-primary-500 leading-[100%] opacity-20">
              20 Tokens
            </span>
            <span className="absolute  top-10 lg:top-24 text-[50px] lg:text-[120px] font-primary font-bold text-primary-500 leading-[100%] opacity-20">
              20 Tokens
            </span>

            {/* Main text */}
            <span className="relative text-[50px] lg:text-[120px] font-primary font-bold text-primary-500 leading-[100%]">
              20 Tokens
            </span>
          </div>
          <span className="font-semibold self-end text-[2.5rem] lg:text-[3rem] leading-12 text-primary-900 uppercase">
            {t("referral")}
          </span>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex items-center"
      >
        <AppCta variant="started" />
      </motion.div>
    </section>
  );
}
