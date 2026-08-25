"use client";
import { Link } from "@/i18n/navigation";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Building from "@/assets/images/building.png";
import { Briefcase, Headphone, People, Setting2 } from "iconsax-reactjs";

export default function Enterprise() {
  const t = useTranslations("BusinessPage.enterprise");

  const services = [
    { icon: Setting2, key: "integrations" },
    { icon: People, key: "onsite" },
    { icon: Headphone, key: "support" },
  ] as const;

  return (
    <section
      id={"enterprise"}
      className="bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col lg:items-start gap-[3.5rem] lg:gap-[75px]"
    >
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[32px] lg:leading-[50px] text-deep-200 max-w-[600px]"
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
            src={Building}
            alt="enterprise"
            height={620}
            className="h-full rounded-[3rem] object-cover"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-primary-50 rounded-[3rem] w-full p-[5rem] hidden lg:flex flex-col gap-[8rem]"
        >
          <span className="font-semibold text-[2.5rem] lg:text-[3rem] leading-12 text-primary-900 uppercase">
            {t("beyond")}
          </span>
          <div className="relative inline-block self-center">
            {/* Background layers */}
            <span className="absolute -top-10 lg:-top-24 text-[50px] lg:text-[120px] font-primary font-bold text-primary-500 leading-[100%] opacity-20">
              {t("word")}
            </span>
            <span className="absolute top-10 lg:top-24 text-[50px] lg:text-[120px] font-primary font-bold text-primary-500 leading-[100%] opacity-20">
              {t("word")}
            </span>

            {/* Main text */}
            <span className="relative text-[50px] lg:text-[120px] font-primary font-bold text-primary-500 leading-[100%]">
              {t("word")}
            </span>
          </div>
          <span className="font-semibold self-end text-[2.5rem] lg:text-[3rem] leading-12 text-primary-900 uppercase text-end">
            {t("tailored")}
          </span>
        </motion.div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px] w-full">
        {services.map(({ icon: Icon, key }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            className="bg-neutral-100 rounded-[30px] p-8 flex flex-col gap-6"
          >
            <Icon size="28" color="#E45B00" variant="Bulk" />
            <span className="text-black font-medium text-[1.8rem] leading-8">
              {t(`services.${key}.title`)}
            </span>
            <p className="text-[1.4rem] lg:text-[1.6rem] text-neutral-700 leading-[28px] lg:leading-[35.5px]">
              {t(`services.${key}.description`)}
            </p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center self-center"
      >
        <Link
          href={"/contact"}
          className="px-12 py-[7.5px] border border-[#E45B00] bg-[#fee7d5] rounded-[100px] flex items-center gap-4"
        >
          <Briefcase size="20" color="#E45B00" variant="Bulk" />
          <span className="font-medium font-sans text-[1.5rem] text-primary-500">
            {t("cta")}
          </span>
        </Link>
      </motion.div>
    </section>
  );
}
