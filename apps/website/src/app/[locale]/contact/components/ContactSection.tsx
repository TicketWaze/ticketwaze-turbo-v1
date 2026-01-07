"use client";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContactSection() {
  const t = useTranslations("ContactPage.section");
  return (
    <section className="bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center gap-[3.5rem] lg:gap-[100px]">
      <Tabs defaultValue="general" className="flex flex-col gap-[50px] w-full ">
        <TabsList>
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          <TabsTrigger value="support">{t("support")}</TabsTrigger>
        </TabsList>
        <TabsContent
          value="general"
          className="w-full flex flex-col lg:flex-row gap-[4rem] lg:gap-[6rem]"
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 font-primary font-medium lg:font-bold text-[3.2rem] lg:text-[4.5rem] leading-[35px] lg:leading-[65px] text-deep-100"
          >
            {t("text-1")}
          </motion.h2>
          <form className="flex-1 flex flex-col items-center w-full gap-[4rem]">
            <div className="flex flex-col gap-[1.5rem] w-full items-center">
              <motion.input
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                placeholder={t("name")}
                type="text"
                className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
              />
              <motion.input
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                placeholder={t("email")}
                type="email"
                className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
              />
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-[493px]"
              >
                <Select>
                  <SelectTrigger className="w-full max-w-[493px]">
                    <SelectValue placeholder={t("subject")} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value={t("genQuest")}>
                      {t("genQuest")}
                    </SelectItem>
                    <SelectItem value={t("media")}>{t("media")}</SelectItem>
                    <SelectItem value={t("partner")}>{t("partner")}</SelectItem>
                    <SelectItem value={t("business")}>
                      {t("business")}
                    </SelectItem>
                    <SelectItem value={t("nonUgent")}>
                      {t("nonUgent")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.textarea
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                placeholder={t("message")}
                className="p-8 bg-neutral-100 h-[266px] resize-none rounded-[1.5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
              />
            </div>
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="px-12 py-8 w-full max-w-[493px] cursor-pointer rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium leading-8"
            >
              {t("send")}
            </motion.button>
          </form>
        </TabsContent>
        <TabsContent
          value="support"
          className="w-full flex flex-col lg:flex-row gap-[4rem] lg:gap-[6rem]"
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 font-primary font-medium lg:font-bold text-[3.2rem] lg:text-[4.5rem] leading-[35px] lg:leading-[65px] text-deep-100"
          >
            {t("text-2")}
          </motion.h2>
          <form className="flex-1 flex flex-col items-center w-full gap-[4rem]">
            <div className="flex flex-col w-full items-center gap-[1.5rem]">
              <motion.input
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                placeholder={t("name")}
                type="text"
                className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
              />
              <motion.input
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                placeholder={t("email")}
                type="email"
                className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
              />
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-[493px]"
              >
                <Select>
                  <SelectTrigger className="w-full max-w-[493px]">
                    <SelectValue placeholder={t("subject")} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value={t("account")}>{t("account")}</SelectItem>
                    <SelectItem value={t("activity")}>
                      {t("activity")}
                    </SelectItem>
                    <SelectItem value={t("ticketing")}>
                      {t("ticketing")}
                    </SelectItem>
                    <SelectItem value={t("technical")}>
                      {t("technical")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
              <motion.textarea
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                placeholder={t("message")}
                className="p-8 bg-neutral-100 h-[266px] resize-none rounded-[1.5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
              />
            </div>
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="px-12 py-8 w-full max-w-[493px] cursor-pointer rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium leading-8"
            >
              {t("get")}
            </motion.button>
          </form>
        </TabsContent>
      </Tabs>
    </section>
  );
}
