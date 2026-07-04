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
import {
  ButtonNeutral,
  ButtonPrimary,
  ButtonRed,
} from "@/components/shared/buttons";
import { InfoCircle, Warning2 } from "iconsax-reactjs";
import { MarkFailedAction, MarkPaidAction } from "@/actions/Payout";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export function MarkPaidDialog({
  trigger,
  withdrawalRequestId,
}: {
  trigger: React.ReactNode;
  withdrawalRequestId: string;
}) {
  const t = useTranslations("Payouts.dialogs");
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    const result = await MarkPaidAction(
      session?.user.accessToken ?? "",
      locale,
      withdrawalRequestId,
    );
    if (result.status === "sucess") {
      setOpen(false);
      toast.success("success");
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary-50">
            <InfoCircle size={36} color="#f97316" variant="Bulk" />
          </div>
          <DialogTitle className="pb-0">{t("paid.title")}</DialogTitle>
          <p className="text-[1.5rem] leading-8 text-neutral-700">
            {t("paid.description")}
          </p>
          <div className="w-full rounded-[12px] bg-[#FEF3E2] px-6 py-4 flex items-start gap-3">
            <Warning2
              size={18}
              color="#EA961C"
              variant="Bulk"
              className="shrink-0 mt-[2px]"
            />
            <p className="text-[1.4rem] leading-7 text-[#EA961C] text-left font-medium">
              {t("paid.irreversible")}
            </p>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <ButtonNeutral className="flex-1">{t("cancel")}</ButtonNeutral>
          </DialogClose>
          <ButtonPrimary
            className="flex-1"
            disabled={isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? <LoadingCircleSmall /> : t("paid.confirm")}
          </ButtonPrimary>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MarkFailedDialog({
  trigger,
  withdrawalRequestId,
}: {
  trigger: React.ReactNode;
  withdrawalRequestId: string;
}) {
  const t = useTranslations("Payouts.dialogs");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { data: session } = useSession();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    if (!reason.trim()) return;
    setIsLoading(true);
    const result = await MarkFailedAction(
      { reason },
      session?.user.accessToken ?? "",
      locale,
      withdrawalRequestId,
    );
    if (result.status === "sucess") {
      setOpen(false);
      toast.success("success");
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#FCE5EA]">
            <Warning2 size={36} color="#E53935" variant="Bulk" />
          </div>
          <DialogTitle className="pb-0">{t("failed.title")}</DialogTitle>
          <p className="text-[1.5rem] leading-8 text-neutral-700">
            {t("failed.description")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[1.3rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide px-2">
            {t("failed.reason_label")}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("failed.reason_placeholder")}
            rows={4}
            className="bg-neutral-100 rounded-[1.5rem] px-6 py-5 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-failure resize-none transition-colors"
          />
        </div>

        <div className="w-full rounded-[12px] bg-[#FCE5EA] px-6 py-4 flex items-start gap-3">
          <Warning2
            size={18}
            color="#E53935"
            variant="Bulk"
            className="shrink-0 mt-[2px]"
          />
          <p className="text-[1.4rem] leading-7 text-failure text-left font-medium">
            {t("failed.irreversible")}
          </p>
        </div>

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <ButtonNeutral className="flex-1">{t("cancel")}</ButtonNeutral>
          </DialogClose>
          <ButtonRed
            className="flex-1"
            disabled={!reason.trim() || isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? <LoadingCircleSmall /> : t("failed.confirm")}
          </ButtonRed>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
