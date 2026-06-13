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

// Subject values are kept as stable English keys so they match the Zod enum
// regardless of the UI locale. Display labels are translated separately.
const GENERAL_SUBJECTS = [
  "General questions",
  "Media",
  "Partnerships",
  "Business collaborations",
  "Non-urgent concerns.",
] as const;

const SUPPORT_SUBJECTS = [
  "Account related issues",
  "Activity help",
  "Ticketing",
  "Technical support",
] as const;

export default function ContactSection() {
  const t = useTranslations("ContactPage.section");

  const GeneralContactSchema = z.object({
    fullName: z
      .string()
      .min(2, { error: t("errors.name.min") })
      .max(100, { error: t("errors.name.max") }),
    email: z.email({ error: t("errors.email") }),
    subject: z.enum(GENERAL_SUBJECTS, { error: t("errors.subject") }),
    message: z
      .string()
      .min(10, { error: t("errors.message.min") })
      .max(2000, { error: t("errors.message.max") }),
  });

  const SupportContactSchema = z.object({
    fullName: z
      .string()
      .min(2, { error: t("errors.name.min") })
      .max(100, { error: t("errors.name.max") }),
    email: z.email({ error: t("errors.email") }),
    subject: z.enum(SUPPORT_SUBJECTS, { error: t("errors.subject") }),
    message: z
      .string()
      .min(10, { error: t("errors.message.min") })
      .max(2000, { error: t("errors.message.max") }),
  });

  type TGeneralContactSchema = z.infer<typeof GeneralContactSchema>;
  type TSupportContactSchema = z.infer<typeof SupportContactSchema>;

  const {
    register: registerGeneral,
    handleSubmit: handleSubmitGeneral,
    setValue: setValueGeneral,
    reset: resetGeneral,
    watch: watchGeneral,
    formState: { errors: errorsGeneral, isSubmitting: isSubmittingGeneral },
  } = useForm<TGeneralContactSchema>({
    resolver: zodResolver(GeneralContactSchema),
  });

  const {
    register: registerSupport,
    handleSubmit: handleSubmitSupport,
    setValue: setValueSupport,
    reset: resetSupport,
    watch: watchSupport,
    formState: { errors: errorsSupport, isSubmitting: isSubmittingSupport },
  } = useForm<TSupportContactSchema>({
    resolver: zodResolver(SupportContactSchema),
  });

  const locale = useLocale();

  // Track a reset key for each Select so we can force a visual reset on success
  const [generalSelectKey, setGeneralSelectKey] = useState(0);
  const [supportSelectKey, setSupportSelectKey] = useState(0);

  // Use watch() to track message length — avoids clobbering RHF's own onChange
  const generalMessageLength = (watchGeneral("message") ?? "").length;
  const supportMessageLength = (watchSupport("message") ?? "").length;

  function charCounterClass(length: number) {
    if (length === 0) return "";
    return length >= 10 && length <= 2000 ? "text-success" : "text-failure";
  }

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
        resetGeneral();
        setGeneralSelectKey((k) => k + 1);
      } else {
        toast.error(t("errors.failed"));
      }
    } catch {
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
        resetSupport();
        setSupportSelectKey((k) => k + 1);
      } else {
        toast.error(t("errors.failed"));
      }
    } catch {
      toast.error(t("errors.failed"));
    }
  }

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
                  key={generalSelectKey}
                  disabled={isSubmittingGeneral}
                  onValueChange={(value) =>
                    setValueGeneral(
                      "subject",
                      value as TGeneralContactSchema["subject"],
                      { shouldValidate: true }
                    )
                  }
                >
                  <SelectTrigger className="w-full max-w-[493px]">
                    <SelectValue placeholder={t("subject")} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="General questions">
                      {t("genQuest")}
                    </SelectItem>
                    <SelectItem value="Media">{t("media")}</SelectItem>
                    <SelectItem value="Partnerships">{t("partner")}</SelectItem>
                    <SelectItem value="Business collaborations">
                      {t("business")}
                    </SelectItem>
                    <SelectItem value="Non-urgent concerns.">
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
                  disabled={isSubmittingGeneral}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  placeholder={t("message")}
                  className="p-8 bg-neutral-100 h-[266px] resize-none rounded-[1.5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
                />
                {generalMessageLength > 0 && (
                  <span
                    className={`self-end mt-3 text-[1.2rem] font-primary leading-8 ${charCounterClass(generalMessageLength)}`}
                  >
                    {generalMessageLength}/2000
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
                  key={supportSelectKey}
                  disabled={isSubmittingSupport}
                  onValueChange={(value) =>
                    setValueSupport(
                      "subject",
                      value as TSupportContactSchema["subject"],
                      { shouldValidate: true }
                    )
                  }
                >
                  <SelectTrigger className="w-full max-w-[493px]">
                    <SelectValue placeholder={t("subject")} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="Account related issues">
                      {t("account")}
                    </SelectItem>
                    <SelectItem value="Activity help">
                      {t("activity")}
                    </SelectItem>
                    <SelectItem value="Ticketing">{t("ticketing")}</SelectItem>
                    <SelectItem value="Technical support">
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
                  disabled={isSubmittingSupport}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  placeholder={t("message")}
                  className="p-8 bg-neutral-100 h-[266px] resize-none rounded-[1.5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
                />
                {supportMessageLength > 0 && (
                  <span
                    className={`self-end mt-3 text-[1.2rem] font-primary leading-8 ${charCounterClass(supportMessageLength)}`}
                  >
                    {supportMessageLength}/2000
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
