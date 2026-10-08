"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonNeutral, ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useRouter } from "@/i18n/navigation";

export type ActivityKind = "event" | "raffle" | "sale" | "restaurant";

/**
 * Suspend (with a reason) or reactivate any activity — Figma's "Suspend" on
 * the activity page and the list's row ⋯. Always driven from outside (open /
 * onOpenChange), see lib/dialogControl.ts. The API caps the emails it sends;
 * when one was skipped the toast says so.
 */
export default function SuspendActivityDialog({
  kind,
  activityId,
  suspended,
  open,
  onOpenChange,
}: {
  kind: ActivityKind;
  activityId: string;
  suspended: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("ActivitiesList");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const mode = suspended ? "reactivate" : "suspend";

  function close(next: boolean) {
    if (!next) setReason("");
    onOpenChange(next);
  }

  async function confirm() {
    if (mode === "suspend" && reason.trim().length < 3) return;
    setSaving(true);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/activities/${kind}/${activityId}/${mode}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        body: mode === "suspend" ? JSON.stringify({ reason: reason.trim() }) : undefined,
      },
    ).catch(() => null);
    const data = await response?.json().catch(() => null);
    setSaving(false);
    if (data?.status === "success") {
      toast.success(
        mode === "suspend" && !data.emailSent ? t("suspend.success_no_email") : t(`${mode}.success`),
      );
      close(false);
      router.refresh();
    } else {
      toast.error(t(`${mode}.error`));
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DialogTitle>{t(`${mode}.title`)}</DialogTitle>
            <p className="text-[1.3rem] leading-6 text-neutral-500">{t(`${mode}.description`)}</p>
          </div>
          {mode === "suspend" && (
            <div className="flex flex-col gap-2">
              <label className="text-[1.4rem] font-medium text-black" htmlFor="suspend-reason">
                {t("suspend.reason_label")} <span className="text-failure">*</span>
              </label>
              <textarea
                id="suspend-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("suspend.reason_placeholder")}
                rows={4}
                maxLength={500}
                autoFocus
                className="w-full resize-none rounded-2xl border-2 border-neutral-200 px-4 py-3 text-[1.4rem] leading-7 text-black placeholder:text-neutral-400 focus:border-failure focus:outline-none transition-colors"
              />
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">{t(`${mode}.cancel`)}</ButtonNeutral>
            </DialogClose>
            {mode === "suspend" ? (
              <ButtonRed
                className="flex-1"
                disabled={saving || reason.trim().length < 3}
                onClick={confirm}
              >
                {saving ? <LoadingCircleSmall /> : t("suspend.confirm")}
              </ButtonRed>
            ) : (
              <ButtonPrimary className="flex-1" disabled={saving} onClick={confirm}>
                {saving ? <LoadingCircleSmall /> : t("reactivate.confirm")}
              </ButtonPrimary>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
