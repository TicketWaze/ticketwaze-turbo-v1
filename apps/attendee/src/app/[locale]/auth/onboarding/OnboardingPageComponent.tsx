"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import { Building, People, User } from "iconsax-reactjs";

export default function OnboardingPageComponent() {
  const t = useTranslations("Auth.onboarding");
  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const delta = currentStep - previousStep;

  function next() {
    setPreviousStep(currentStep);
    setCurrentStep((s) => s + 1);
  }
  function previous() {
    if (currentStep > 1) {
      setPreviousStep(currentStep);
      setCurrentStep((s) => s - 1);
    }
  }
  return (
    <div className="pt-18  flex flex-col gap-12">
      <div className="flex flex-col gap-16 items-center lg:justify-between h-full">
        <div className="flex flex-col gap-8 items-center">
          <motion.h3
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-medium font-primary text-center text-[3.2rem] leading-14 text-black"
          >
            {t("title")}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-[1.8rem] text-center leading-10 text-neutral-700"
          >
            {t("description")}
          </motion.p>
        </div>
        {currentStep === 1 && (
          <motion.div
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            layout={false}
            className="w-full flex flex-col gap-6"
          >
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="font-primary text-center font-medium text-[1.5rem] leading-10 text-deep-100"
            >
              {t("first.1")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="font-primary text-center font-medium text-[1.5rem] leading-10 text-deep-100"
            >
              {t("first.2")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="font-primary text-center font-medium text-[1.5rem] leading-10 text-deep-100"
            >
              {t("first.3")}
            </motion.p>
          </motion.div>
        )}
        {currentStep === 2 && (
          <motion.div
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            layout={false}
            className="w-full flex flex-col gap-6"
          >
            <p className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
              {t("second.question")}
            </p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link
                className={`flex gap-6 items-center bg-neutral-100 rounded-[20px] p-6 border cursor-pointer`}
                href={"/auth/onboarding/attendee"}
              >
                <div>
                  <User size={25} variant="Bulk" color="#454A53" />
                </div>
                <div className="flex flex-col gap-4">
                  <span className="font-primary font-medium text-[1.8rem] leading-10 text-neutral-900">
                    {t("attendee.title")}
                  </span>
                  <p className="text-neutral-500 leading-8 text-[1.5rem]">
                    {t("attendee.description")}
                  </p>
                </div>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link
                className={`flex gap-6 items-center bg-neutral-100 rounded-[20px] p-6 border cursor-pointer`}
                href={"/auth/onboarding/organisation"}
              >
                <div>
                  <Building size={25} variant="Bulk" color="#454A53" />
                </div>
                <div className="flex flex-col gap-4">
                  <span className="font-primary font-medium text-[1.8rem] leading-10 text-neutral-900">
                    {t("organisation.title")}
                  </span>
                  <p className="text-neutral-500 leading-8 text-[1.5rem]">
                    {t("organisation.description")}
                  </p>
                </div>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link
                className={`flex gap-6 items-center bg-neutral-100 rounded-[20px] p-6 border cursor-pointer`}
                href={"/auth/onboarding/invited"}
              >
                <div>
                  <People size={25} variant="Bulk" color="#454A53" />
                </div>
                <div className="flex flex-col gap-4">
                  <span className="font-primary font-medium text-[1.8rem] leading-10 text-neutral-900">
                    {t("invited.title")}
                  </span>
                  <p className="text-neutral-500 leading-8 text-[1.5rem]">
                    {t("invited.description")}
                  </p>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="hidden lg:flex gap-4 pb-4 justify-between items-center w-full"
        >
          {currentStep === 2 && (
            <ButtonSecondary onClick={previous} className="flex-1 w-auto">
              {t("previous")}
            </ButtonSecondary>
          )}
          {currentStep === 1 && (
            <ButtonPrimary onClick={next} className="w-full flex-1">
              {t("started")}
            </ButtonPrimary>
          )}
        </motion.div>
      </div>
      <div className="flex flex-col lg:flex-row lg:hidden gap-4 justify-between items-center w-full pb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className=" flex-1 w-full"
        >
          {currentStep === 1 && (
            <ButtonPrimary onClick={next} className="w-full ">
              {t("started")}
            </ButtonPrimary>
          )}
        </motion.div>
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className=" flex-1 w-full"
          >
            <ButtonSecondary onClick={previous} className="flex-1 w-full">
              {t("previous")}
            </ButtonSecondary>
          </motion.div>
        )}
      </div>
    </div>
  );
}
