"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonPrimary } from "@/components/shared/buttons";
import {
  Calendar,
  MoneyRecive,
  People,
  Profile2User,
  Crown,
  Timer1,
  Chart,
  Ticket,
} from "iconsax-reactjs";

type Step = {
  key: string;
  icon: React.ReactNode;
  gradient: string;
  isWelcome?: boolean;
};

const STEPS: Step[] = [
  {
    key: "welcome",
    icon: null,
    gradient: "",
    isWelcome: true,
  },
  {
    key: "activities",
    icon: <Calendar size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-violet-400 to-violet-600",
  },
  {
    key: "finance",
    icon: <MoneyRecive size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-emerald-400 to-emerald-600",
  },
  {
    key: "team",
    icon: <People size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-sky-400 to-sky-600",
  },
  {
    key: "profile",
    icon: <Profile2User size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-rose-400 to-rose-600",
  },
  {
    key: "trial",
    icon: <Crown size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-amber-400 to-primary-500",
  },
];

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function WelcomeTrialModal() {
  const { data: session } = useSession();
  const t = useTranslations("WelcomeModal");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [isAdmin, setIsAdmin] = useState(true);
  const direction = useRef(1);

  useEffect(() => {
    const orgId = session?.activeOrganisation?.organisationId;
    const token = session?.user?.accessToken;
    if (!orgId || !token) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${orgId}/welcome-modal`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.hasSeenWelcomeModal === false) {
          setIsAdmin(data.isAdmin !== false);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, [session?.activeOrganisation?.organisationId, session?.user?.accessToken]);

  async function dismiss() {
    setOpen(false);
    const orgId = session?.activeOrganisation?.organisationId;
    const token = session?.user?.accessToken;
    if (!orgId || !token) return;

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${orgId}/welcome-modal`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
  }

  function goNext() {
    direction.current = 1;
    setStep((s) => s + 1);
  }

  function handleOpenChange(value: boolean) {
    if (!value) dismiss();
  }

  const steps = isAdmin ? STEPS : STEPS.filter((s) => s.key !== "trial");
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[360px] lg:w-[560px] flex flex-col overflow-hidden max-h-[90dvh] gap-0 p-0 lg:p-0">
        {/* Scrollable + animated content */}
        <div className="flex-1 overflow-y-auto px-[20px] pt-[20px] lg:px-[30px] lg:pt-[45px] pb-4">
          <AnimatePresence mode="wait" custom={direction.current}>
            <motion.div
              key={step}
              custom={direction.current}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="flex flex-col gap-6"
            >
              {/* Icon / logo */}
              <div className="flex items-center justify-center">
                {current.isWelcome ? (
                  <Image
                    src="/logo-simple-orange.svg"
                    alt="Ticketwaze"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                ) : (
                  <div
                    className={`w-[80px] h-[80px] rounded-full bg-gradient-to-br ${current.gradient} flex items-center justify-center`}
                  >
                    {current.icon}
                  </div>
                )}
              </div>

              {/* Title & description */}
              <div className="flex flex-col gap-3 text-center">
                <DialogTitle className="font-medium text-[2.4rem] leading-[1.3] text-black pb-0">
                  {t(`steps.${current.key}.title`)}
                </DialogTitle>
                <DialogDescription className="text-[1.4rem] text-neutral-500 leading-[1.7]">
                  {t(`steps.${current.key}.description`)}
                </DialogDescription>
              </div>

              {/* Trial-specific feature list */}
              {current.key === "trial" && (
                <div className="flex flex-col gap-3 border-t border-b border-neutral-100 py-5">
                  <FeatureRow
                    icon={<Timer1 size="18" color="#6c47ff" variant="Bulk" />}
                    label={t("steps.trial.feature1")}
                  />
                  <FeatureRow
                    icon={<Chart size="18" color="#6c47ff" variant="Bulk" />}
                    label={t("steps.trial.feature2")}
                  />
                  <FeatureRow
                    icon={<Ticket size="18" color="#6c47ff" variant="Bulk" />}
                    label={t("steps.trial.feature3")}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-[6px] pt-6 pb-4 px-[20px] lg:px-[30px]">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-[7px] rounded-full transition-all duration-300 ${
                i === step
                  ? "w-[28px] bg-primary-500"
                  : "w-[7px] bg-neutral-200"
              }`}
            />
          ))}
        </div>

        {/* Navigation footer */}
        <div className="px-[20px] pb-[20px] lg:px-[30px] lg:pb-[45px] pt-8 flex flex-col gap-3">
          {isLast ? (
            <ButtonPrimary className="w-full" onClick={dismiss}>
              {t("getStarted")}
            </ButtonPrimary>
          ) : (
            <ButtonPrimary className="w-full" onClick={goNext}>
              {t("next")}
            </ButtonPrimary>
          )}
          {/* {!isFirst && !isLast && (
            <ButtonSecondary className="w-full" onClick={goBack}>
              {t("back")}
            </ButtonSecondary>
          )} */}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-[36px] h-[36px] rounded-full bg-primary-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <p className="text-[1.4rem] text-neutral-700 leading-[1.5]">{label}</p>
    </div>
  );
}
