"use client";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export default function Testimonials() {
  const t = useTranslations("AboutPage.testimonials");
  const items = [
    {
      id: 1,
      description: t("first.description"),
      name: t("first.name"),
      role: t("first.role"),
    },
    {
      id: 2,
      description: t("second.description"),
      name: t("second.name"),
      role: t("second.role"),
    },
    {
      id: 3,
      description: t("third.description"),
      name: t("third.name"),
      role: t("third.role"),
    },
  ];
  return (
    <section className="bg-deep-300 py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start gap-[3.5rem] lg:gap-[56px]">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[32px] lg:leading-[50px] text-white max-w-[690px]"
      >
        {t("title")}
      </motion.h2>
      <div>
        <motion.ul className="flex flex-col lg:flex-row gap-[1.5rem] lg:gap-12">
          {items.map(({ description, id, name, role }) => {
            return (
              <motion.li
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                key={id}
                className="bg-deep-200 w-full flex-1 rounded-[3rem] p-8 flex flex-col gap-[106px]"
              >
                <p className="font-primary font-medium  text-[2.6rem] leading-[35px] text-white">
                  “<br />
                  {description}
                  <br />”
                </p>
                <div className="font-medium text-[2.6rem] leading-[35px] flex flex-col">
                  <span className=" text-white">{name}</span>
                  <span className="text-neutral-300">{role}</span>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
