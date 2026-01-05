"use client";
import {
  TabDes,
  TabHeader,
  TabImage,
  TabImageContainer,
  TabItem,
  TabList,
  TabsProvider,
} from "@/components/image-tabs";
import Image from "next/image";
import Zap from "@/assets/icons/zap.svg";
import cards from "@/assets/icons/cards.svg";
import addColumn from "@/assets/icons/addColumn.svg";
import pie from "@/assets/icons/pie.svg";
import bg from "@/assets/images/details-card-bg.svg";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export default function Details1() {
  const t = useTranslations("HomePage.details1");
  const tabs = [
    {
      title: t("personal.title"),
      id: "Personal",
      content: [
        {
          id: "01",
          title: t("personal.item1"),
          image: Zap,
        },
        {
          id: "02",
          title: t("personal.item2"),
          image: cards,
        },
      ],
    },
    {
      title: t("business.title"),
      id: "Business",
      content: [
        {
          id: "01",
          title: t("business.item1"),
          image: addColumn,
        },
        {
          id: "02",
          title: t("business.item2"),
          image: pie,
        },
      ],
    },
  ];
  return (
    <section className=" w-full bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] h-full">
      <TabsProvider
        defaultValue="Personal"
        className="flex flex-col lg:flex-row justify-between h-full gap-[3.5rem] lg:gap-[7.5rem]"
      >
        <TabList className="flex flex-col gap-[3.5rem] justify-between w-full">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-primary font-bold text-[3.2rem] lg:text-[4.5rem] leading-[35px] lg:leading-[50px] text-deep-200"
          >
            {t("title")}
          </motion.h2>
          <div className="flex flex-col gap-8">
            {tabs.map(({ id, title }, index) => (
              <TabItem index={index} key={index} value={id}>
                <TabHeader value={id}>{title}</TabHeader>
                {/* <TabDes value={tab.id}> */}
                {/* <img
                        src={tab.imageUrl}
                        alt={tab.title}
                        className="md:hidden block rounded-md"
                      /> */}
                {/* </TabDes> */}
              </TabItem>
            ))}
          </div>
        </TabList>
        <div className="w-[5px] hidden lg:block h-auto bg-neutral-100"></div>
        <TabImageContainer className="flex flex-col gap-8 flex-1">
          {tabs.map(({ id, content }, index) => {
            return (
              <TabImage index={index} key={index} value={id}>
                {content.map(({ id, image, title }) => {
                  return (
                    <div
                      key={id}
                      className="bg-neutral-100 w-full lg:w-[450px] rounded-[3rem] flex flex-col gap-[55px] overflow-hidden"
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
                        <span className="font-sans font-semibold text-[2.2rem] leading-[3rem] text-neutral-700">
                          {id}
                        </span>
                        <span className="font-semibold font-sans uppercase text-[2.2rem] leading-[30px] text-black">
                          {title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </TabImage>
            );
          })}
        </TabImageContainer>
      </TabsProvider>
    </section>
  );
}
