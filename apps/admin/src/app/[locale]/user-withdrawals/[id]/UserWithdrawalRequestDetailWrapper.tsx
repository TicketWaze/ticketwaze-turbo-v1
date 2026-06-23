"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Warning2 } from "iconsax-reactjs";
import { UserWithdrawalRequest } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import {
  ButtonNeutral,
  ButtonPrimary,
  ButtonRed,
} from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AcceptUserWithdrawalAction,
  RejectUserWithdrawalAction,
} from "@/actions/UserWithdrawal";
import formatDate from "@/lib/FormatDate";

function StatusBadge({
  status,
  t,
}: {
  status: UserWithdrawalRequest["status"];
  t: ReturnType<typeof useTranslations>;
}) {
  if (status === "ACCEPTED") {
    return (
      <span className="py-[0.3rem] text-[1.1rem] font-bold leading-6 uppercase text-[#349C2E] px-2 rounded-[30px] bg-[#f5f5f5] whitespace-nowrap">
        {t("status_accepted")}
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="py-[0.3rem] text-[1.1rem] font-bold leading-6 uppercase text-[#EA961C] px-2 rounded-[30px] bg-[#f5f5f5] whitespace-nowrap">
        {t("status_pending")}
      </span>
    );
  }
  return (
    <span className="py-[0.3rem] text-[1.1rem] font-bold leading-6 uppercase text-failure px-2 rounded-[30px] bg-failure/20 whitespace-nowrap">
      {t("status_rejected")}
    </span>
  );
}

function RejectDialog({
  requestId,
  trigger,
  t,
}: {
  requestId: string;
  trigger: React.ReactNode;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const locale = useLocale();

  async function handleConfirm() {
    if (!reason.trim()) return;
    setIsLoading(true);
    const result = await RejectUserWithdrawalAction(
      session?.user.accessToken ?? "",
      locale,
      requestId,
      reason,
    );
    setIsLoading(false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(t("toasts.rejected"));
      setOpen(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReason("");
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#FCE5EA] shrink-0">
            <Warning2 size={36} color="#E53935" variant="Bulk" />
          </div>
          <DialogTitle className="pb-0">{t("reject_dialog.title")}</DialogTitle>
          <p className="text-[1.5rem] leading-8 text-neutral-700">
            {t("reject_dialog.description")}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[1.3rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide px-2">
            {t("reject_dialog.reason_label")}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reject_dialog.reason_placeholder")}
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
            {t("reject_dialog.warning")}
          </p>
        </div>
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <ButtonNeutral className="flex-1">{t("reject_dialog.cancel")}</ButtonNeutral>
          </DialogClose>
          <ButtonRed
            className="flex-1"
            disabled={!reason.trim() || isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? <LoadingCircleSmall /> : t("reject_dialog.confirm")}
          </ButtonRed>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UserWithdrawalRequestDetailWrapper({
  request,
}: {
  request: UserWithdrawalRequest;
}) {
  const t = useTranslations("UserWithdrawals.detail");
  const { data: session } = useSession();
  const locale = useLocale();
  const [isAccepting, setIsAccepting] = useState(false);

  async function handleAccept() {
    setIsAccepting(true);
    const result = await AcceptUserWithdrawalAction(
      session?.user.accessToken ?? "",
      locale,
      request.userWithdrawalRequestId,
    );
    setIsAccepting(false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success(t("toasts.accepted"));
    }
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500 text-[1.6rem]">
        {t("not_found")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      <BackButton text={t("back")} />

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-primary font-medium text-[2rem] lg:text-[2.2rem] leading-10 text-black flex items-center gap-3 flex-wrap">
          {t("title")}
          <StatusBadge status={request.status} t={t} />
        </h2>

        {/* Desktop action buttons — hidden on mobile */}
        <div className="hidden md:flex gap-3 items-center shrink-0">
          {request.status !== "ACCEPTED" && (
            <ButtonPrimary
              className="py-[7.5px] text-[1.4rem]"
              disabled={isAccepting}
              onClick={handleAccept}
            >
              {isAccepting ? <LoadingCircleSmall /> : t("accept")}
            </ButtonPrimary>
          )}
          {request.status !== "REJECTED" && (
            <RejectDialog
              requestId={request.userWithdrawalRequestId}
              t={t}
              trigger={
                <ButtonRed className="py-[7.5px] text-[1.4rem]">
                  {t("reject")}
                </ButtonRed>
              }
            />
          )}
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* User info */}
        <div className="flex flex-col gap-4 bg-neutral-50 rounded-[16px] p-5 lg:p-6">
          <span className="text-[1.2rem] font-bold uppercase text-neutral-400 tracking-wide">
            {t("cards.user")}
          </span>
          {request.user ? (
            <>
              <Row
                label={t("fields.name")}
                value={`${request.user.firstName} ${request.user.lastName}`}
              />
              <Row label={t("fields.email")} value={request.user.email} />
            </>
          ) : (
            <p className="text-[1.4rem] text-neutral-400">{t("cards.no_user")}</p>
          )}
        </div>

        {/* Account details */}
        <div className="flex flex-col gap-4 bg-neutral-50 rounded-[16px] p-5 lg:p-6">
          <span className="text-[1.2rem] font-bold uppercase text-neutral-400 tracking-wide">
            {t("cards.account")}
          </span>
          <Row
            label={t("fields.method")}
            value={request.accountType === "bank" ? t("method_bank") : t("method_moncash")}
          />
          {request.accountType === "bank" && request.bankName && (
            <Row label={t("fields.bank_name")} value={request.bankName} />
          )}
          <Row label={t("fields.account_name")} value={request.accountName} />
          <Row
            label={request.accountType === "bank" ? t("fields.account_number") : t("fields.moncash_number")}
            value={request.accountNumber}
          />
        </div>

        {/* Request details */}
        <div className="flex flex-col gap-4 bg-neutral-50 rounded-[16px] p-5 lg:p-6">
          <span className="text-[1.2rem] font-bold uppercase text-neutral-400 tracking-wide">
            {t("cards.request")}
          </span>
          <Row
            label={t("fields.amount")}
            value={`${Number(request.amount).toLocaleString()} ${request.currency ?? "HTG"}`}
          />
          <Row
            label={t("fields.reference")}
            value={request.reference ?? request.userWithdrawalRequestId}
          />
          <Row
            label={t("fields.date")}
            value={formatDate(request.createdAt, locale, "local")}
          />
        </div>

        {/* Rejection reason */}
        {request.status === "REJECTED" && request.reason && (
          <div className="flex flex-col gap-4 bg-[#FCE5EA] rounded-[16px] p-5 lg:p-6">
            <span className="text-[1.2rem] font-bold uppercase text-failure tracking-wide">
              {t("cards.rejection")}
            </span>
            <p className="text-[1.5rem] leading-8 text-neutral-800">
              {request.reason}
            </p>
          </div>
        )}
      </div>

      {/* Mobile action buttons — full width, stacked, visible on mobile only */}
      <div className="flex flex-col gap-3 md:hidden pb-4">
        {request.status !== "ACCEPTED" && (
          <ButtonPrimary
            className="w-full py-[12px] text-[1.5rem]"
            disabled={isAccepting}
            onClick={handleAccept}
          >
            {isAccepting ? <LoadingCircleSmall /> : t("accept")}
          </ButtonPrimary>
        )}
        {request.status !== "REJECTED" && (
          <RejectDialog
            requestId={request.userWithdrawalRequestId}
            t={t}
            trigger={
              <ButtonRed className="w-full py-[12px] text-[1.5rem]">
                {t("reject")}
              </ButtonRed>
            }
          />
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[1.2rem] leading-5 text-neutral-400 uppercase font-medium tracking-wide">
        {label}
      </span>
      <span className="text-[1.5rem] leading-8 text-neutral-900 font-medium break-all">
        {value}
      </span>
    </div>
  );
}
