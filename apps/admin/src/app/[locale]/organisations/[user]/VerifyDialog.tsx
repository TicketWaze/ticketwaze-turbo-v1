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
import { useRouter } from "@/i18n/navigation";
import type { DialogControl } from "@/lib/dialogControl";
import { VerifyOrganisationAction } from "@/actions/Organisation";

export function VerifyDialog({
  organisationId,
  isVerified,
  hideTrigger,
  open: controlledOpen,
  onOpenChange,
}: {
  organisationId: string;
  isVerified: boolean;
} & DialogControl) {
  const t = useTranslations("Organisations.profile.verify");
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  function setOpen(next: boolean) {
    if (onOpenChange) onOpenChange(next);
    else setUncontrolledOpen(next);
  }
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();

  async function handleConfirm() {
    setIsLoading(true);
    const result = await VerifyOrganisationAction(
      organisationId,
      session?.user.accessToken ?? "",
      locale,
    );
    if ("status" in result && result.status === "success") {
      toast.success(result.isVerified ? t("success") : t("success_remove"));
      setOpen(false);
      router.refresh();
    } else {
      toast.error("error" in result ? result.error : t("error"));
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <ButtonPrimary className="py-[7.5px]">
            {isVerified ? t("trigger_remove") : t("trigger")}
          </ButtonPrimary>
        </DialogTrigger>
      )}
      <DialogContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DialogTitle>
              {isVerified ? t("title_remove") : t("title")}
            </DialogTitle>
            <p className="text-[1.3rem] leading-6 text-neutral-500">
              {isVerified ? t("description_remove") : t("description")}
            </p>
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
              {isLoading ? (
                <LoadingCircleSmall />
              ) : isVerified ? (
                t("confirm_remove")
              ) : (
                t("confirm")
              )}
            </ButtonPrimary>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
