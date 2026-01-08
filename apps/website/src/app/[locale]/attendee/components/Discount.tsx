"use client";
import { Link } from "@/i18n/navigation";
import { Timer1 } from "iconsax-reactjs";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import confetti from "@/assets/images/confetti.png";
import Image from "next/image";
export default function Discount() {
  const t = useTranslations("PersonalPage.discount");
  return (
    <section className="bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col lg:items-start gap-[3.5rem] lg:gap-[75px]">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[32px] lg:leading-[50px] text-deep-200 max-w-[480px]"
      >
        {t("title1")} <span className="text-primary-500">{t("title2")}</span>
      </motion.h2>
      <div className="flex flex-col lg:flex-row gap-[2.5rem] w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Image
            src={confetti}
            alt="confetti"
            height={620}
            className="h-full"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-primary-50 rounded-[3rem] w-full p-[5rem] flex flex-col gap-[8rem]"
        >
          <span className="font-semibold text-[2.5rem] lg:text-[3rem] leading-12 text-primary-900 uppercase">
            {t("earn")}
          </span>
          <div className="relative inline-block self-center">
            {/* Background layers */}
            <span className="absolute -top-10 lg:-top-24 text-[50px] lg:text-[120px] font-primary font-bold text-primary-500 leading-[100%] opacity-20">
              50 Tokens
            </span>
            <span className="absolute  top-10 lg:top-24 text-[50px] lg:text-[120px] font-primary font-bold text-primary-500 leading-[100%] opacity-20">
              50 Tokens
            </span>

            {/* Main text */}
            <span className="relative text-[50px] lg:text-[120px] font-primary font-bold text-primary-500 leading-[100%]">
              50 Tokens
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
        <Link
          href={"/waitlist"}
          className="px-[3rem] py-[7.5px] border border-[#E45B00] bg-[#fee7d5] rounded-[100px] flex items-center gap-4"
        >
          <span className="font-medium font-sans text-[1.5rem] text-primary-500">
            {t("cta.waitlist")}
          </span>
          <Timer1 size="20" color="#E45B00" variant="Bulk" />
        </Link>
      </motion.div>
    </section>
  );
}
