"use client";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod/v4";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import LoadingCircleSmall from "@/components/LoadingCircleSmall";
import { toast } from "sonner";
import { useState } from "react";

export default function ContactSection() {
  const t = useTranslations("ContactPage.section");

  // General Contact Schema
  const GeneralContactSchema = z.object({
    fullName: z
      .string()
      .min(2, { error: t("errors.name.min") })
      .max(100, { error: t("errors.name.max") }),
    email: z.email({ error: t("errors.email") }),
    subject: z.enum(
      [
        "General questions",
        "Media",
        "Partnerships",
        "Business collaborations",
        "Non-urgent concerns.",
      ],
      { error: t("errors.subject") }
    ),
    message: z
      .string()
      .min(10, { error: t("errors.message.min") })
      .max(2000, { error: t("errors.message.max") }),
  });

  // Support Contact Schema
  const SupportContactSchema = z.object({
    fullName: z
      .string()
      .min(2, { error: t("errors.name.min") })
      .max(100, { error: t("errors.name.max") }),
    email: z.email({ error: t("errors.email") }),
    subject: z.enum(
      [
        "Account related issues",
        "Activity help",
        "Ticketing",
        "Technical support",
      ],
      { error: t("errors.subject") }
    ),
    message: z
      .string()
      .min(10, { error: t("errors.message.min") })
      .max(2000, { error: t("errors.message.max") }),
  });

  type TGeneralContactSchema = z.infer<typeof GeneralContactSchema>;
  type TSupportContactSchema = z.infer<typeof SupportContactSchema>;

  // General form
  const {
    register: registerGeneral,
    handleSubmit: handleSubmitGeneral,
    setValue: setValueGeneral,
    resetField: resetFieldGeneral,
    formState: { errors: errorsGeneral, isSubmitting: isSubmittingGeneral },
  } = useForm<TGeneralContactSchema>({
    resolver: zodResolver(GeneralContactSchema),
  });

  // Support form
  const {
    register: registerSupport,
    handleSubmit: handleSubmitSupport,
    setValue: setValueSupport,
    resetField: resetFieldSupport,
    formState: { errors: errorsSupport, isSubmitting: isSubmittingSupport },
  } = useForm<TSupportContactSchema>({
    resolver: zodResolver(SupportContactSchema),
  });
  const locale = useLocale();
  async function submitGeneralHandler(data: TGeneralContactSchema) {
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            origin: process.env.NEXT_PUBLIC_WEBSITE_URL!,
            "Accept-Language": locale,
          },
          body: JSON.stringify(data),
        }
      );
      const response = await request.json();
      if (response.status === "success") {
        toast.success(t("errors.success"));
        resetFieldGeneral("email");
        resetFieldGeneral("fullName");
        resetFieldGeneral("message");
        resetFieldGeneral("subject");
      } else {
        toast.error(t("errors.failed"));
      }
    } catch (error) {
      toast.error(t("errors.failed"));
    }
  }

  async function submitSupportHandler(data: TSupportContactSchema) {
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            origin: process.env.NEXT_PUBLIC_WEBSITE_URL!,
            "Accept-Language": locale,
          },
          body: JSON.stringify(data),
        }
      );
      const response = await request.json();
      if (response.status === "success") {
        toast.success(t("errors.success"));
        resetFieldSupport("email");
        resetFieldSupport("fullName");
        resetFieldSupport("message");
        resetFieldSupport("subject");
      } else {
        toast.error(t("errors.failed"));
      }
    } catch (error) {
      toast.error(t("errors.failed"));
    }
  }

  const [generalWord, setGeneralWord] = useState(0);
  const [supportWord, setSupportWord] = useState(0);

  return (
    <section className="bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center gap-[3.5rem] lg:gap-[100px]">
      <Tabs defaultValue="general" className="flex flex-col gap-[50px] w-full ">
        <TabsList>
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          <TabsTrigger value="support">{t("support")}</TabsTrigger>
        </TabsList>

        {/* GENERAL TAB */}
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
          <form
            onSubmit={handleSubmitGeneral(submitGeneralHandler)}
            className="flex-1 flex flex-col items-center w-full gap-[4rem]"
          >
            <div className="flex flex-col gap-[1.5rem] w-full items-center">
              <div className="w-full flex flex-col items-center max-w-[493px]">
                <motion.input
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  placeholder={t("name")}
                  type="text"
                  {...registerGeneral("fullName")}
                  disabled={isSubmittingGeneral}
                  className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
                />
                {errorsGeneral.fullName && (
                  <span className="text-failure self-start text-[1.2rem] pl-8 font-primary leading-8">
                    {errorsGeneral.fullName?.message}
                  </span>
                )}
              </div>
              <div className="w-full flex flex-col items-center max-w-[493px]">
                <motion.input
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  placeholder={t("email")}
                  {...registerGeneral("email")}
                  disabled={isSubmittingGeneral}
                  type="email"
                  className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
                />
                {errorsGeneral.email && (
                  <span className="text-failure self-start text-[1.2rem] pl-8 font-primary leading-8">
                    {errorsGeneral.email?.message}
                  </span>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-[493px]"
              >
                <Select
                  onValueChange={(e) =>
                    setValueGeneral(
                      "subject",
                      e as TGeneralContactSchema["subject"]
                    )
                  }
                >
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
                {errorsGeneral.subject && (
                  <span className="text-failure self-start text-[1.2rem] pl-8 font-primary leading-8">
                    {errorsGeneral.subject?.message}
                  </span>
                )}
              </motion.div>

              <div className="w-full flex flex-col items-center max-w-[493px]">
                <motion.textarea
                  {...registerGeneral("message")}
                  onChange={(e) => setGeneralWord(e.target.value.length)}
                  disabled={isSubmittingGeneral}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  placeholder={t("message")}
                  className="p-8 bg-neutral-100 h-[266px] resize-none rounded-[1.5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
                />
                {generalWord > 0 && (
                  <span
                    className={`self-end mt-3 text-[1.2rem] font-primary leading-8 ${generalWord >= 10 ? "text-success" : "text-failure"}`}
                  >
                    {generalWord}/2000
                  </span>
                )}
                {errorsGeneral.message && (
                  <span className="text-failure self-start text-[1.2rem] pl-8 font-primary leading-8">
                    {errorsGeneral.message?.message}
                  </span>
                )}
              </div>
            </div>
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              type="submit"
              disabled={isSubmittingGeneral}
              className="px-12 py-8 w-full max-w-[493px] cursor-pointer rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium leading-8 disabled:cursor-not-allowed disabled:bg-primary-500/50 flex items-center justify-center"
            >
              {isSubmittingGeneral ? <LoadingCircleSmall /> : t("send")}
            </motion.button>
          </form>
        </TabsContent>

        {/* SUPPORT TAB */}
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
          <form
            onSubmit={handleSubmitSupport(submitSupportHandler)}
            className="flex-1 flex flex-col items-center w-full gap-[4rem]"
          >
            <div className="flex flex-col w-full items-center gap-[1.5rem]">
              <div className="w-full flex flex-col items-center max-w-[493px]">
                <motion.input
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  placeholder={t("name")}
                  type="text"
                  {...registerSupport("fullName")}
                  disabled={isSubmittingSupport}
                  className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
                />
                {errorsSupport.fullName && (
                  <span className="text-failure self-start text-[1.2rem] pl-8 font-primary leading-8">
                    {errorsSupport.fullName?.message}
                  </span>
                )}
              </div>
              <div className="w-full flex flex-col items-center max-w-[493px]">
                <motion.input
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  placeholder={t("email")}
                  type="email"
                  {...registerSupport("email")}
                  disabled={isSubmittingSupport}
                  className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
                />
                {errorsSupport.email && (
                  <span className="text-failure self-start text-[1.2rem] pl-8 font-primary leading-8">
                    {errorsSupport.email?.message}
                  </span>
                )}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-[493px]"
              >
                <Select
                  onValueChange={(e) =>
                    setValueSupport(
                      "subject",
                      e as TSupportContactSchema["subject"]
                    )
                  }
                >
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
                {errorsSupport.subject && (
                  <span className="text-failure self-start text-[1.2rem] pl-8 font-primary leading-8">
                    {errorsSupport.subject?.message}
                  </span>
                )}
              </motion.div>
              <div className="w-full flex flex-col items-center max-w-[493px]">
                <motion.textarea
                  {...registerSupport("message")}
                  onChange={(e) => setSupportWord(e.target.value.length)}
                  disabled={isSubmittingSupport}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  placeholder={t("message")}
                  className="p-8 bg-neutral-100 h-[266px] resize-none rounded-[1.5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
                />
                {supportWord > 0 && (
                  <span
                    className={`self-end mt-3 text-[1.2rem] font-primary leading-8 ${supportWord >= 10 ? "text-success" : "text-failure"}`}
                  >
                    {supportWord}/2000
                  </span>
                )}
                {errorsSupport.message && (
                  <span className="text-failure self-start text-[1.2rem] pl-8 font-primary leading-8">
                    {errorsSupport.message?.message}
                  </span>
                )}
              </div>
            </div>
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="px-12 py-8 w-full max-w-[493px] cursor-pointer rounded-[10rem] bg-primary-500 text-white text-[1.5rem] font-medium leading-8 disabled:cursor-not-allowed disabled:bg-primary-500/50 flex items-center justify-center"
              type="submit"
              disabled={isSubmittingSupport}
            >
              {isSubmittingSupport ? <LoadingCircleSmall /> : t("get")}
            </motion.button>
          </form>
        </TabsContent>
      </Tabs>
    </section>
  );
}
