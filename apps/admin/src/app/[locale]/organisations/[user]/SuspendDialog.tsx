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
import { ButtonNeutral, ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { SuspendOrganisationAction } from "@/actions/Organisation";

export function SuspendDialog({ organisationId }: { organisationId: string }) {
  const t = useTranslations("Organisations.profile.suspend");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();

  async function handleConfirm() {
    setIsLoading(true);
    const result = await SuspendOrganisationAction(
      organisationId,
      reason,
      session?.user.accessToken ?? "",
      locale,
    );
    if ("status" in result && result.status === "success") {
      toast.success(t("success"));
      setOpen(false);
      setReason("");
    } else {
      toast.error("error" in result ? result.error : t("error"));
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ButtonRed className="py-[7.5px]">{t("trigger")}</ButtonRed>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DialogTitle>{t("title")}</DialogTitle>
            <p className="text-[1.3rem] leading-6 text-neutral-500">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[1.3rem] font-medium text-deep-100">
              {t("reason_label")}
            </label>
            <textarea
              className="w-full rounded-[1.5rem] bg-neutral-100 p-6 text-[1.4rem] leading-7 text-deep-100 resize-none outline-none min-h-[10rem]"
              placeholder={t("reason_placeholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">{t("cancel")}</ButtonNeutral>
            </DialogClose>
            <ButtonRed
              className="flex-1"
              disabled={reason.trim().length < 3 || isLoading}
              onClick={handleConfirm}
            >
              {isLoading ? <LoadingCircleSmall /> : t("confirm")}
            </ButtonRed>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
