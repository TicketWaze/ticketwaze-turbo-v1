"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Ticket2, User } from "iconsax-reactjs";
import { useRouter } from "@/i18n/navigation";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function ChoicePageComponent() {
  const t = useTranslations("Auth.choice");
  const [selected, setSelected] = useState<"attendee" | "organisation" | null>(
    null,
  );
  const [isLoading, setIsloading] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  function submitHandler() {
    setIsloading(true);
    if (selected === "attendee") {
      router.push("/explore");
    } else {
      router.push(
        `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/auth/login`,
      );
    }
  }
  return (
    <div className="flex flex-col items-center h-full pb-4">
      <div className="flex-1 flex lg:justify-center flex-col w-full pt-[4.5rem]">
        <div className="flex flex-col gap-16 items-center">
          <div className="flex flex-col gap-8 items-center">
            <motion.h3
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="font-medium font-primary text-[3.2rem] leading-[3.5rem] text-black"
            >
              {t("title")}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-[1.8rem] text-center leading-[2.5rem] text-neutral-700"
            >
              {t("description")}
            </motion.p>
          </div>
          <div className=" w-full flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className={`flex gap-[1.5rem] items-center bg-neutral-100 rounded-[20px] p-[1.5rem] border cursor-pointer ${selected === "attendee" ? "border-primary-500" : "border-transparent"}`}
              onClick={() => setSelected("attendee")}
            >
              <User size={25} variant="Bulk" color="#454A53" />
              <div className="flex flex-col gap-4">
                <span className="font-primary font-medium text-[1.8rem] leading-10 text-neutral-900">
                  {t("attendee.title")}
                </span>
                <p className="text-neutral-500 leading-8 text-[1.5rem]">
                  {t("attendee.description")}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className={`flex gap-[1.5rem] items-center bg-neutral-100 rounded-[20px] p-[1.5rem] border cursor-pointer ${selected === "organisation" ? "border-primary-500" : "border-transparent"}`}
              onClick={() => setSelected("organisation")}
            >
              <Ticket2 size={25} variant="Bulk" color="#454A53" />
              <div className="flex flex-col gap-4">
                <span className="font-primary font-medium text-[1.8rem] leading-10 text-neutral-900">
                  {t("organisation.title")}
                </span>
                <p className="text-neutral-500 leading-8 text-[1.5rem]">
                  {t("organisation.description")}
                </p>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="w-full hidden lg:flex flex-col gap-8 "
          >
            <ButtonPrimary
              disabled={!selected}
              className="w-full disabled:cursor-not-allowed"
              onClick={submitHandler}
            >
              {isLoading ? <LoadingCircleSmall /> : t("cta")}
            </ButtonPrimary>
          </motion.div>
        </div>
      </div>
      <div className="flex flex-col gap-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="lg:hidden"
        >
          <ButtonPrimary
            disabled={!selected}
            className="w-full disabled:cursor-not-allowed"
            onClick={submitHandler}
          >
            {isLoading ? <LoadingCircleSmall /> : t("cta")}
          </ButtonPrimary>
        </motion.div>
      </div>
    </div>
  );
}
