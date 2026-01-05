"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function TermsSections() {
  const t = useTranslations("LegalPage.terms");
  return (
    <section className="bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start gap-[3.5rem] lg:gap-[100px]">
      <Tabs defaultValue="terms" className="flex flex-col gap-[50px] w-full">
        <TabsList>
          <TabsTrigger value="terms">{t("terms")}</TabsTrigger>
          <TabsTrigger value="privacy">{t("privacy")}</TabsTrigger>
        </TabsList>
      </Tabs>
    </section>
  );
}
