"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { GrantSubscriptionAction } from "@/actions/Organisation";

const DURATIONS = [14, 30, 90, 365] as const;
type Duration = (typeof DURATIONS)[number];

const TIERS = ["pro", "premium"] as const;
type Tier = (typeof TIERS)[number];

export function GrantSubscriptionDialog({
  organisationId,
}: {
  organisationId: string;
}) {
  const t = useTranslations("Organisations.profile.grant_subscription");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState<Duration>(30);
  const [tier, setTier] = useState<Tier>("pro");
  const { data: session } = useSession();
  const locale = useLocale();

  async function handleConfirm() {
    setIsLoading(true);
    const result = await GrantSubscriptionAction(
      organisationId,
      duration,
      tier,
      session?.user.accessToken ?? "",
      locale,
    );
    if ("status" in result && result.status === "success") {
      toast.success(t("success", { days: duration, plan: t(`tiers.${tier}`) }));
      setOpen(false);
    } else {
      toast.error("error" in result ? result.error : t("error"));
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ButtonNeutral className="py-[7.5px]">{t("trigger")}</ButtonNeutral>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DialogTitle>{t("title")}</DialogTitle>
            <p className="text-[1.3rem] leading-6 text-neutral-500">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[1.3rem] font-medium text-neutral-700">
              {t("tierLabel")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {TIERS.map((tr) => (
                <button
                  key={tr}
                  type="button"
                  onClick={() => setTier(tr)}
                  className={`rounded-[15px] border py-6 text-center transition-all duration-200 cursor-pointer ${
                    tier === tr
                      ? "border-primary-500 bg-primary-50 text-primary-500"
                      : "border-neutral-100 text-deep-100 hover:border-primary-500"
                  }`}
                >
                  <span className="block font-primary font-medium text-[1.6rem] leading-8">
                    {t(`tiers.${tr}`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-[1.3rem] font-medium text-neutral-700">
              {t("durationLabel")}
            </p>
            <div className="grid grid-cols-4 gap-4">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`rounded-[15px] border py-6 text-center transition-all duration-200 cursor-pointer ${
                    duration === d
                      ? "border-primary-500 bg-primary-50 text-primary-500"
                      : "border-neutral-100 text-deep-100 hover:border-primary-500"
                  }`}
                >
                  <span className="block font-primary font-medium text-[2rem] leading-8">
                    {d === 365 ? 1 : d}
                  </span>
                  <span className="text-[1.2rem] leading-6 text-neutral-600">
                    {d === 365 ? t("year") : t("days")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">{t("cancel")}</ButtonNeutral>
            </DialogClose>
            <ButtonPrimary
              className="flex-1"
              disabled={isLoading}
              onClick={handleConfirm}
            >
              {isLoading ? <LoadingCircleSmall /> : t("confirm")}
            </ButtonPrimary>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
