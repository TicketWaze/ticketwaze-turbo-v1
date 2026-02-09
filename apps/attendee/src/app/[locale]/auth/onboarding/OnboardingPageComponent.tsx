"use client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import PageLoader from "@/components/PageLoader";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";

export default function OnboardingPageComponent() {
  const t = useTranslations("Auth.onboarding");
  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const delta = currentStep - previousStep;
  const [intent, setIntent] = useState<
    "buyer" | "seller" | "both" | undefined
  >();
  const [interest, setInterest] = useState<string[] | undefined>();
  const [currency, setCurrency] = useState<string | undefined>();
  const [recommendations, setRecommendations] = useState<boolean | undefined>();
  const [notifications, setNotifications] = useState<string | undefined>();
  const [isOrganisation, setIsorganisation] = useState<boolean | undefined>();
  const locale = useLocale();
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  function next() {
    switch (currentStep) {
      case 1:
        if (!intent) {
          toast.warning(t("error"));
        } else {
          setPreviousStep(currentStep);
          setCurrentStep((s) => s + 1);
        }
        break;
      case 2:
        if (!interest) {
          toast.warning(t("error"));
        } else {
          setPreviousStep(currentStep);
          setCurrentStep((s) => s + 1);
        }
        break;
      case 3:
        if (!currency) {
          toast.warning(t("error"));
        } else {
          setPreviousStep(currentStep);
          setCurrentStep((s) => s + 1);
        }
        break;
      case 4:
        if (!recommendations) {
          toast.warning(t("error"));
        } else {
          setPreviousStep(currentStep);
          setCurrentStep((s) => s + 1);
        }
        break;
      case 5:
        if (!notifications) {
          toast.warning(t("error"));
        } else {
          setPreviousStep(currentStep);
          setCurrentStep((s) => s + 1);
        }
        break;
      case 6:
        if (isOrganisation === undefined) {
          toast.warning(t("error"));
        } else if (session?.user.isOnboarded) {
          toast.warning(t("onboarded"));
        } else {
          submit();
        }
        break;
    }
  }
  function previous() {
    if (currentStep > 1) {
      setPreviousStep(currentStep);
      setCurrentStep((s) => s - 1);
    }
  }

  async function submit() {
    setIsLoading(true);
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/onboarding/user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        body: JSON.stringify({
          intent,
          interest,
          currency,
          recommendation: recommendations,
          notifications,
          isOrganisation,
        }),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      await update({
        ...session,
        user: {
          ...session?.user,
          userPreference: response.userPreference,
        },
      });
      if (intent === "buyer") {
        router.push("/explore");
      } else {
        router.push("/auth/onboarding/choice");
      }
    } else {
      toast.error(response.message);
    }
    setIsLoading(false);
  }
  return (
    <div className="pt-[4.5rem] h-full flex flex-col justify-between">
      <PageLoader isLoading={isLoading} />
      <div className="flex flex-col gap-16 items-center lg:justify-between h-full">
        <div className="flex flex-col gap-8 items-center">
          <motion.h3
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-medium font-primary text-center text-[3.2rem] leading-[3.5rem] text-black"
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
        {/* <AnimatePresence mode="wait"> */}
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
              transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }}
              className="font-semibold text-[16px] leading-[22px] text-deep-100"
            >
              {t("first.question")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeInOut" }}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${intent === "buyer" ? "border-primary-500" : "border-neutral-100"} cursor-pointer`}
              onClick={() => setIntent("buyer")}
            >
              {t("first.1")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7, ease: "easeInOut" }}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${intent === "seller" ? "border-primary-500" : "border-neutral-100"} cursor-pointer`}
              onClick={() => setIntent("seller")}
            >
              {t("first.2")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${intent === "both" ? "border-primary-500" : "border-neutral-100"} cursor-pointer`}
              onClick={() => setIntent("both")}
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
            <p className="font-semibold text-[16px] leading-[22px] text-deep-100">
              {t("second.question")}
            </p>
            <p
              onClick={() => setInterest(["concert", "festival"])}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${interest && interest.includes("concert") ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("second.1")}
            </p>
            <p
              onClick={() => setInterest(["sport", "competition"])}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${interest && interest.includes("sport") ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("second.2")}
            </p>
            <p
              onClick={() => setInterest(["movies", "entertainment"])}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${interest && interest.includes("movies") ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("second.3")}
            </p>
            <p
              onClick={() => setInterest(["conference", "seminar"])}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${interest && interest.includes("conference") ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("second.4")}
            </p>
          </motion.div>
        )}
        {currentStep === 3 && (
          <motion.div
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            layout={false}
            className="w-full flex flex-col gap-6"
          >
            <p className="font-semibold text-[16px] leading-[22px] text-deep-100">
              {t("third.question")}
            </p>
            <p
              onClick={() => setCurrency("USD")}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${currency === "USD" ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("third.1")}
            </p>
            <p
              onClick={() => setCurrency("HTG")}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${currency === "HTG" ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("third.2")}
            </p>
          </motion.div>
        )}
        {currentStep === 4 && (
          <motion.div
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            layout={false}
            className="w-full flex flex-col gap-6"
          >
            <p className="font-semibold text-[16px] leading-[22px] text-deep-100">
              {t("fourth.question")}
            </p>
            <p
              onClick={() => setRecommendations(true)}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${recommendations === true ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("fourth.1")}
            </p>
            <p
              onClick={() => setRecommendations(false)}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${recommendations === false ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("fourth.2")}
            </p>
          </motion.div>
        )}
        {currentStep === 5 && (
          <motion.div
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            layout={false}
            className="w-full flex flex-col gap-6"
          >
            <p className="font-semibold text-[16px] leading-[22px] text-deep-100">
              {t("fith.question")}
            </p>
            <p
              onClick={() => setNotifications("email")}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${notifications === "email" ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("fith.1")}
            </p>
            <p
              onClick={() => setNotifications("whatsapp")}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${notifications === "whatsapp" ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("fith.2")}
            </p>
            <p
              onClick={() => setNotifications("none")}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${notifications === "none" ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("fith.3")}
            </p>
          </motion.div>
        )}
        {currentStep === 6 && (
          <motion.div
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            layout={false}
            className="w-full flex flex-col gap-6"
          >
            <p className="font-semibold text-[16px] leading-[22px] text-deep-100">
              {t("sixth.question")}
            </p>
            <p
              onClick={() => setIsorganisation(true)}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${isOrganisation === true ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("sixth.1")}
            </p>
            <p
              onClick={() => setIsorganisation(false)}
              className={`border px-[1.5rem] py-8 rounded-[15px] text-[1.6rem]  text-deep-100 leading-[22px] ${isOrganisation === false ? "border-primary-500" : "border-neutral-100"} cursor-pointer transition-all duration-500`}
            >
              {t("sixth.2")}
            </p>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="hidden lg:flex gap-4 pb-4 justify-between items-center w-full"
        >
          <ButtonSecondary onClick={previous} className="flex-1 w-auto">
            {t("previous")}
          </ButtonSecondary>
          <ButtonPrimary
            disabled={isLoading}
            onClick={next}
            className="w-full flex-1"
          >
            {currentStep === 6 ? t("submit") : t("next")}
          </ButtonPrimary>
        </motion.div>
      </div>
      <div className="flex flex-col lg:flex-row lg:hidden gap-4 justify-between items-center w-full mb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className=" flex-1 w-full"
        >
          <ButtonPrimary
            disabled={isLoading}
            onClick={next}
            className="w-full "
          >
            {currentStep === 6 ? t("submit") : t("next")}
          </ButtonPrimary>
        </motion.div>
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
      </div>
    </div>
  );
}
