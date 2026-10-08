"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatMoney } from "@ticketwaze/currency";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ButtonAccent, ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Link } from "@/i18n/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import formatDateTime from "@/lib/formatDateTime";
import { cn } from "@/lib/utils";
import { AcceptUserWithdrawalAction } from "@/actions/UserWithdrawal";
import { SettlePayoutDialog } from "./[id]/SettlePayoutDialog";
import { RejectDialog } from "../user-withdrawals/[id]/UserWithdrawalRequestDetailWrapper";

/** One row of /admin/payouts-list (services/admin_payouts.ts). */
export type PayoutRow = {
  id: string;
  kind: "organisation" | "user";
  status: string;
  accountType: string;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  amount: { htg: number; usd: number };
  currency: string;
  requestedBy: string;
  organisation: { id: string; name: string } | null;
  reason: string | null;
  createdAt: string;
  processedAt: string | null;
  wise: { resolvedName: string | null; recipientValue: string | null } | null;
};

export const PAYOUT_BADGE: Record<string, string> = {
  PENDING: "bg-warning/15 text-[#C98A00]",
  APPROVED: "bg-[#EAF2FF] text-[#2F6FEB]",
  SUCCESSFUL: "bg-success/10 text-success",
  ACCEPTED: "bg-success/10 text-success",
  FAILED: "bg-failure/10 text-failure",
  REJECTED: "bg-failure/10 text-failure",
};

const OPEN = ["PENDING", "APPROVED"];
const METHODS = ["bank", "moncash", "natcash", "wise", "cash"];

/** "Sogebank", or the method when there is no bank (MonCash, Wise…). */
export function bankLabel(row: PayoutRow, t: (key: string) => string) {
  if (row.bankName) return row.bankName;
  const method = row.accountType?.toLowerCase();
  return METHODS.includes(method) ? t(`methods.${method}`) : row.accountType || "-";
}

export function amountLabel(row: PayoutRow, locale: string) {
  return formatMoney(row.currency === "USD" ? row.amount.usd : row.amount.htg, row.currency, locale);
}

/**
 * Figma "Request Details" (4384:74777, Close + Approve payout) for an open
 * request and "Withdrawal Details" (4406:78483, Close) for a settled one.
 *
 * Approve payout opens the EXISTING Settle dialog for an organisation (paid
 * with a reference / failed with a reason / the two honest Wise steps — user
 * decision), and accepts an attendee withdrawal the way its own page does,
 * with Reject beside it. "View full details" keeps the organisation stats page.
 */
export default function PayoutDrawer({ row, onSettled }: { row: PayoutRow; onSettled: () => void }) {
  const t = useTranslations("PayoutsList");
  const tUser = useTranslations("UserWithdrawals.detail");
  const locale = useLocale();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [accepting, setAccepting] = useState(false);
  const isOpen = OPEN.includes(row.status);
  const isWise = row.accountType?.toLowerCase() === "wise";

  async function acceptAttendee() {
    setAccepting(true);
    const result = await AcceptUserWithdrawalAction(session?.user.accessToken ?? "", locale, row.id);
    setAccepting(false);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success(t("drawer.approved"));
      onSettled();
    }
  }

  const rowEl = (label: string, value: React.ReactNode) => (
    <p className="flex justify-between items-start gap-8 text-[1.4rem] leading-8 text-neutral-600">
      <span className="shrink-0">{label}</span>
      <span className="text-deep-100 font-medium text-right min-w-0 break-words">{value}</span>
    </p>
  );
  const badge = "py-[0.3rem] px-2 rounded-[30px] text-[1.1rem] font-bold leading-6 uppercase";
  const fullDetailsHref =
    row.kind === "organisation" ? `/payouts/${row.id}` : `/user-withdrawals/${row.id}`;

  return (
    <DrawerContent className="my-8 p-12 rounded-[30px] w-full">
      <div className="w-full flex flex-col items-center overflow-y-auto">
        <DrawerTitle className="pb-12">
          <span className="font-primary font-medium text-center text-[2.6rem] leading-12 text-black">
            {isOpen ? t("drawer.request_title") : t("drawer.withdrawal_title")}
          </span>
        </DrawerTitle>
        <DrawerDescription asChild className="w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              {rowEl(
                t("drawer.amount"),
                <>
                  {amountLabel(row, locale)}
                  {row.currency !== "USD" && (
                    <span className="block text-[1.2rem] font-normal text-neutral-500">
                      {formatMoney(row.amount.usd, "USD", locale)}
                    </span>
                  )}
                </>,
              )}
              {rowEl(t("drawer.request_date"), formatDateTime(row.createdAt, locale))}
              {rowEl(t("drawer.requested_by"), row.requestedBy)}
              {row.organisation && rowEl(t("drawer.organisation"), row.organisation.name)}
              {rowEl(
                isOpen ? t("drawer.request_status") : t("drawer.transaction_status"),
                <span className={cn(badge, PAYOUT_BADGE[row.status] ?? PAYOUT_BADGE.PENDING)}>
                  {t(`status.${row.status}`)}
                </span>,
              )}
            </div>
            <div className="h-[2px] w-full bg-neutral-100" />
            <div className="flex flex-col gap-6">
              {rowEl(t("drawer.method"), t(`methods.${METHODS.includes(row.accountType?.toLowerCase()) ? row.accountType.toLowerCase() : "bank"}`))}
              {rowEl(t("drawer.bank"), bankLabel(row, t))}
              {row.accountName && rowEl(t("drawer.account_name"), row.wise?.resolvedName ?? row.accountName)}
              {rowEl(t("drawer.account"), row.accountNumber ?? "-")}
              {rowEl(t("drawer.processed"), row.processedAt ? formatDateTime(row.processedAt, locale) : "-")}
              {row.reason && rowEl(t("drawer.reason"), row.reason)}
            </div>
            <Link
              href={fullDetailsHref}
              className="self-start text-[1.4rem] font-medium text-primary-500 hover:underline"
            >
              {t("drawer.full_details")}
            </Link>
          </div>
        </DrawerDescription>
      </div>

      <DrawerFooter>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <DrawerClose asChild className="lg:flex-1 cursor-pointer">
            <ButtonAccent className="w-full">{t("drawer.close")}</ButtonAccent>
          </DrawerClose>
          {isOpen && row.kind === "organisation" && (
            <SettlePayoutDialog
              withdrawalRequestId={row.id}
              isWise={isWise}
              wiseStage={row.status === "APPROVED" ? "confirm" : "approve"}
              canSendWise={can("payouts.send")}
              resolvedName={row.wise?.resolvedName ?? row.accountName ?? ""}
              recipientValue={row.wise?.recipientValue ?? row.accountNumber ?? ""}
              amountUsd={row.amount.usd}
              trigger={
                <ButtonPrimary className="w-full lg:flex-1">
                  {row.status === "APPROVED" ? t("drawer.confirm_sent") : t("drawer.approve")}
                </ButtonPrimary>
              }
            />
          )}
          {isOpen && row.kind === "user" && (
            <>
              <RejectDialog
                requestId={row.id}
                t={tUser}
                trigger={<ButtonRed className="w-full lg:flex-1">{t("drawer.reject")}</ButtonRed>}
              />
              <ButtonPrimary className="w-full lg:flex-1" disabled={accepting} onClick={acceptAttendee}>
                {accepting ? <LoadingCircleSmall /> : t("drawer.approve")}
              </ButtonPrimary>
            </>
          )}
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
