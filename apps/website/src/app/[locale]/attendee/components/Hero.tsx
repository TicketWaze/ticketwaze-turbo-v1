"use client";
import Navbar from "@/components/Navbar";
import { Link } from "@/i18n/navigation";
import { Timer1 } from "iconsax-reactjs";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import HeroPersonal from "@/assets/images/hero-personal.png";
import Image from "next/image";

export default function Hero() {
  const t = useTranslations("PersonalPage.hero");
  return (
    <section className="bg-white py-[2.5rem] px-4 rounded-[3rem] flex flex-col gap-[6.5rem] items-center">
      <Navbar />
      <div className="flex flex-col gap-8 max-w-[890px]">
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
          className="text-[1.6rem] lg:text-[2.6rem] leading-[22.5px] lg:leading-[35px] text-neutral-700 font-sans text-center"
        >
          {t("description")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-center"
        >
          <Link
            href={"/waitlist"}
            className="px-[3rem] py-[7.5px] border border-[#E45B00] bg-[#fee7d5] rounded-[100px] flex items-center gap-4"
          >
            <Timer1 size="20" color="#E45B00" variant="Bulk" />
            <span className="font-medium font-sans text-[1.5rem] text-primary-500">
              {t("cta.waitlist")}
            </span>
          </Link>
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
