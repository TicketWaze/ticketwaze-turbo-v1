"use client";
import { useLocale, useTranslations } from "next-intl";
import { DateTime } from "luxon";
import { WithdrawalRequest } from "@ticketwaze/typescript-config";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Stagger } from "@/components/shared/motion";
import { formatMoney } from "@/lib/financeFigures";
import { StatusPill, WITHDRAWAL_COLOURS } from "./financeParts";
import { Group, Row } from "./OrderDetails";

/**
 * Withdrawal Details (Figma 1760:49181): amount, when and by whom it was
 * requested, its status, where the money goes and when it was processed — plus
 * the reason when a payout failed.
 */
export default function WithdrawalDetails({
  request,
  currency,
  statusLabel,
  onClose,
}: {
  request: WithdrawalRequest | null;
  currency: string;
  statusLabel: string;
  onClose: () => void;
}) {
  const t = useTranslations("Finance.withdrawal.details");
  const tf = useTranslations("Finance");
  const locale = useLocale();
  const at = (value: unknown) =>
    value
      ? DateTime.fromISO(String(value))
          .setLocale(locale)
          .toLocaleString(DateTime.DATETIME_MED)
      : "—";
  const methodLabel: Record<string, string> = {
    bank: tf("bank"),
    moncash: tf("moncash"),
    natcash: tf("natcash"),
    cash: tf("cash"),
    wise: tf("wise"),
  };

  return (
    <Drawer
      open={request !== null}
      onOpenChange={(o) => !o && onClose()}
      direction="right"
    >
      <DrawerContent className="bg-white border-none outline-none my-6 mr-4 lg:mr-6 p-6 lg:p-12 rounded-[30px] data-[vaul-drawer-direction=right]:w-[calc(100vw-2rem)] data-[vaul-drawer-direction=right]:lg:w-[58rem]">
        {request && (
          <>
            <DrawerTitle className="font-primary font-medium text-center text-[2.2rem] lg:text-[2.6rem] leading-12 text-black pb-6 lg:pb-8 shrink-0">
              {t("title")}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {request.withdrawalRequestId}
            </DrawerDescription>
            <div className="w-full flex-1 flex flex-col overflow-y-auto pb-6 -mt-6 divide-y divide-neutral-200">
              <Stagger step={0.04}>
                <Group>
                  <Row label={t("amount")}>
                    {formatMoney(
                      Number(
                        currency === "USD" ? request.usdAmount : request.amount,
                      ) || 0,
                      locale,
                    )}{" "}
                    {currency}
                  </Row>
                  <Row label={t("request_date")}>{at(request.createdAt)}</Row>
                  <Row label={t("requested_by")}>
                    {request.requestedBy
                      ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}`
                      : "—"}
                  </Row>
                  <Row label={t("status")}>
                    <StatusPill colour={WITHDRAWAL_COLOURS[request.status]}>
                      {statusLabel}
                    </StatusPill>
                  </Row>
                  {request.status === "FAILED" && request.reason && (
                    <Row label={t("reason")}>{request.reason}</Row>
                  )}
                </Group>
                <Group>
                  <Row label={t("method")}>
                    {methodLabel[request.accountType] ?? request.accountType}
                  </Row>
                  {request.accountType === "bank" && (
                    <Row label={t("bank_name")}>{request.bankName}</Row>
                  )}
                  <Row label={t("account_name")}>{request.accountName}</Row>
                  <Row label={t("account_number")}>
                    <span className="break-all">{request.accountNumber}</span>
                  </Row>
                  <Row label={t("processed_date")}>
                    {at(request.processedAt)}
                  </Row>
                </Group>
              </Stagger>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 mt-4 w-full h-[5rem] rounded-[10rem] border-2 border-primary-500 bg-primary-50 font-sans font-semibold text-[1.5rem] text-primary-500 cursor-pointer transition-colors hover:bg-primary-100"
            >
              {t("close")}
            </button>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
