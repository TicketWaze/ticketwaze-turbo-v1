"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonPrimary } from "@/components/shared/buttons";
import {
  Clock,
  MoneyRecive,
  People,
  Profile2User,
  ShieldSecurity,
  Ticket,
} from "iconsax-reactjs";
import { useRouter } from "@/i18n/navigation";

type Step = {
  key: string;
  icon: React.ReactNode;
  gradient: string;
  isWelcome?: boolean;
};

const STEPS: Step[] = [
  { key: "welcome", icon: null, gradient: "", isWelcome: true },
  {
    key: "tickets",
    icon: <Ticket size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-violet-400 to-violet-600",
  },
  {
    key: "history",
    icon: <Clock size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-sky-400 to-sky-600",
  },
  {
    key: "security",
    icon: <ShieldSecurity size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-emerald-400 to-emerald-600",
  },
  {
    key: "transactions",
    icon: <MoneyRecive size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-amber-400 to-amber-600",
  },
  {
    key: "profile",
    icon: <Profile2User size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-rose-400 to-rose-600",
  },
  {
    key: "invite",
    icon: <People size="36" color="#ffffff" variant="Bold" />,
    gradient: "from-orange-400 to-primary-500",
  },
];

export default function WelcomeModal() {
  const { data: session } = useSession();
  const t = useTranslations("WelcomeModal");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const token = session?.user?.accessToken;
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/welcome-modal`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.hasSeenWelcomeModal === false) setOpen(true);
      })
      .catch(() => {});
  }, [session?.user?.accessToken]);

  async function markSeen() {
    const token = session?.user?.accessToken;
    if (!token) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/welcome-modal`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
      },
    });
  }

  async function dismiss() {
    setOpen(false);
    await markSeen();
  }

  function slide(fn: () => void) {
    setVisible(false);
    setTimeout(() => {
      fn();
      setVisible(true);
    }, 180);
  }

  function goNext() {
    slide(() => setStep((s) => s + 1));
  }

  async function explore() {
    setOpen(false);
    await markSeen();
    router.push("/explore");
  }

  function handleOpenChange(value: boolean) {
    if (!value) dismiss();
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[360px] lg:w-[560px] flex flex-col overflow-hidden max-h-[90dvh] gap-0 p-0 lg:p-0">
        {/* Animated content area */}
        <div className="flex-1 overflow-y-auto px-[20px] pt-[20px] lg:px-[30px] lg:pt-[45px] pb-4">
          <div
            style={{
              transition: "opacity 0.18s ease, transform 0.18s ease",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(16px)",
            }}
            className="flex flex-col gap-6"
          >
            {/* Icon or logo */}
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
          </div>
        </div>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-[6px] pt-6 pb-4 px-[20px] lg:px-[30px]">
          {STEPS.map((_, i) => (
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
            <ButtonPrimary className="w-full" onClick={explore}>
              {t("explore")}
            </ButtonPrimary>
          ) : (
            <ButtonPrimary className="w-full" onClick={goNext}>
              {t("next")}
            </ButtonPrimary>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
