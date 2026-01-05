"use client";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  TabDes,
  TabHeader,
  TabImage,
  TabImageContainer,
  TabItem,
  TabList,
  TabsProvider,
} from "@/components/image-tabs-2";
import Girls from "@/assets/images/details-1-personal.png";
import Image from "next/image";

export default function Details1() {
  const t = useTranslations("PersonalPage.details1");
  const tabs = [
    {
      title: t("first.title"),
      number: "01",
      id: 1,
      description: [
        t("first.1"),
        t("first.2"),
        t("first.3"),
        t("first.4"),
        t("first.5"),
        t("first.6"),
      ],
    },
    {
      title: t("second.title"),
      number: "02",
      id: 2,
      description: [t("second.1"), t("second.2"), t("second.3"), t("second.4")],
    },
    {
      title: t("third.title"),
      number: "03",
      id: 3,
      description: [t("third.1"), t("third.2"), t("third.3")],
    },
  ];
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
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className=" hidden lg:block w-full h-full"
      >
        <TabsProvider
          defaultValue={1}
          className="flex items-start gap-[2.5rem]"
        >
          <TabImageContainer className="flex-1 h-full">
            <TabImage>
              <Image
                src={Girls}
                alt={"girls"}
                className="w-full h-full rounded-md"
              />
            </TabImage>
          </TabImageContainer>
          <TabList className="flex-1 flex flex-col gap-[2.5rem]">
            {tabs.map((tab, index) => (
              <TabItem index={index} key={index} value={tab.id}>
                <TabHeader value={tab.id} number={tab.number}>
                  {tab.title}{" "}
                </TabHeader>
                <TabDes value={tab.id}>
                  {tab.description.map((des, i) => {
                    return (
                      <div key={i} className="flex items-center gap-8">
                        <div className="w-3 h-3 bg-primary-900 rounded-full"></div>
                        <p className="text-[2.5rem] text-primary-900">{des}</p>
                      </div>
                    );
                  })}
                </TabDes>
              </TabItem>
            ))}
          </TabList>
        </TabsProvider>
      </motion.div>
      <div className="flex lg:hidden flex-col gap-[1.5rem]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Image
            src={Girls}
            alt={"girls"}
            className="w-full h-full rounded-md"
          />
        </motion.div>
        {tabs.map(({ description, number, title }) => {
          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              key={title}
              className="h-[280px] bg-white p-8 rounded-[3rem] flex flex-col justify-between"
            >
              <div className="font-semibold text-[2rem] leading-12 flex justify-between w-full items-center">
                <span className="text-primary-500">{title}</span>
                <span className="text-primary-900">{number}</span>
              </div>
              <ul>
                {description.map((des, i) => {
                  return (
                    <li key={i} className="flex items-center gap-8">
                      <div className="w-2 h-2 bg-primary-900 rounded-full"></div>
                      <p className="text-[1.8rem] text-primary-900">{des}</p>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
