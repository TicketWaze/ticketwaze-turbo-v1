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

const DURATIONS = [14, 30, 90] as const;
type Duration = (typeof DURATIONS)[number];

export function GrantSubscriptionDialog({
  organisationId,
}: {
  organisationId: string;
}) {
  const t = useTranslations("Organisations.profile.grant_subscription");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState<Duration>(30);
  const { data: session } = useSession();
  const locale = useLocale();

  async function handleConfirm() {
    setIsLoading(true);
    const result = await GrantSubscriptionAction(
      organisationId,
      duration,
      session?.user.accessToken ?? "",
      locale,
    );
    if ("status" in result && result.status === "success") {
      toast.success(t("success", { days: duration }));
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

          <div className="grid grid-cols-3 gap-4">
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
                  {d}
                </span>
                <span className="text-[1.2rem] leading-6 text-neutral-600">
                  {t("days")}
                </span>
              </button>
            ))}
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
