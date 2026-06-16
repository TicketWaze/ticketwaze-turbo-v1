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
import { SuspendAttendeeAction } from "@/actions/Attendee";

export function SuspendDialog({ userId }: { userId: string }) {
  const t = useTranslations("Attendees.profile.suspend");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();

  function handleOpenChange(next: boolean) {
    if (!next) setReason("");
    setOpen(next);
  }

  async function handleConfirm() {
    if (!reason.trim()) return;
    setIsLoading(true);
    const result = await SuspendAttendeeAction(
      userId,
      reason.trim(),
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <ButtonRed className="py-[7.5px] w-full lg:w-auto">
          {t("trigger")}
        </ButtonRed>
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
            <label className="text-[1.4rem] font-medium text-black">
              {t("reason_label")} <span className="text-[#E53935]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reason_placeholder")}
              rows={4}
              autoFocus
              className="w-full resize-none rounded-2xl border-2 border-neutral-200 px-4 py-3 text-[1.4rem] leading-7 text-black placeholder:text-neutral-400 focus:border-[#E53935] focus:outline-none transition-colors"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">{t("cancel")}</ButtonNeutral>
            </DialogClose>
            <ButtonRed
              className="flex-1"
              disabled={isLoading || !reason.trim()}
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
