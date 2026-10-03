"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
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
import { RejectKycAction } from "@/actions/Kyc";

/** Same shape as the Suspend dialog: the reason is emailed to the organizer. */
export function RejectKycDialog({
  verificationId,
  organisationId,
}: {
  verificationId: string;
  organisationId: string;
}) {
  const t = useTranslations("Kyc.review");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();
  const router = useRouter();

  async function handleConfirm() {
    setIsLoading(true);
    const result = await RejectKycAction(
      verificationId,
      organisationId,
      reason.trim(),
      session?.user.accessToken ?? "",
      locale,
    );
    setIsLoading(false);
    if ("status" in result) {
      toast.success(t("rejected"));
      setOpen(false);
      setReason("");
      router.refresh();
    } else toast.error(result.error ?? t("error"));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ButtonRed className="py-[7.5px] px-10">{t("reject")}</ButtonRed>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DialogTitle>{t("reject_title")}</DialogTitle>
            <p className="text-[1.3rem] leading-6 text-neutral-500">
              {t("reject_description")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[1.3rem] font-medium text-deep-100">
              {t("reject_label")}
            </label>
            <textarea
              className="w-full rounded-[1.5rem] bg-neutral-100 p-6 text-[1.4rem] leading-7 text-deep-100 resize-none outline-none min-h-[10rem]"
              placeholder={t("reject_placeholder")}
              value={reason}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">{t("cancel")}</ButtonNeutral>
            </DialogClose>
            <ButtonRed
              className="flex-1"
              disabled={reason.trim().length < 5 || isLoading}
              onClick={handleConfirm}
            >
              {isLoading ? <LoadingCircleSmall /> : t("reject_confirm")}
            </ButtonRed>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
