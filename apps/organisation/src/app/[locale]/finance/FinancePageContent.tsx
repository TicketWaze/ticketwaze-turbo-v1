"use client";
import { useLocale, useTranslations } from "next-intl";
import {
  Order,
  Organisation,
  WithdrawalRequest,
} from "@ticketwaze/typescript-config";
import { Reveal } from "@/components/shared/motion";
import { Metric, Unit } from "@/app/[locale]/analytics/parts";
import { financeFigures, formatMoney } from "@/lib/financeFigures";
import { cn } from "@/lib/utils";
import InitiateWithdrawalButton from "./InitiateWithdrawalButton";
import {
  TransactionsTable,
  WithdrawalsTable,
} from "./components/FinanceTables";

/**
 * Finance (Figma 1733:35824 empty, 1749:34639 data, 1760:45206 after a
 * withdrawal; phone 2223:62822): title + Initiate withdrawal, Total Revenue /
 * Total Profit / Balance (with what is still pending under it), then the
 * latest transactions and withdrawals with their filters.
 */
export default function FinancePageContent({
  transactions,
  canWithdraw,
}: {
  transactions: {
    allOrders: Order[];
    organisation: Organisation;
    withdrawalRequests: WithdrawalRequest[];
    hasPendingPayout?: boolean;
  };
  canWithdraw: boolean;
}) {
  const t = useTranslations("Finance");
  const locale = useLocale();
  const organisation = transactions.organisation;
  const currency = organisation.currency ?? "HTG";
  // The API attaches `activity` to every order; one without it would crash a
  // row, so it is left out rather than rendered half-empty.
  const orders = transactions.allOrders.filter((order) =>
    Boolean(order.activity),
  );
  const figures = financeFigures(orders, organisation, currency);
  const money = (value: number) => (
    <>
      {formatMoney(value, locale)} <Unit>{currency}</Unit>
    </>
  );
  const button = canWithdraw && (
    <InitiateWithdrawalButton
      balance={figures.balance}
      hasPendingPayout={Boolean(transactions.hasPendingPayout)}
    />
  );

  const tile = "border-neutral-100";
  return (
    <div className="flex flex-col gap-12 lg:gap-16 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <Reveal y={-12} className="flex items-center justify-between gap-6">
        <h1 className="font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-[1.2] text-black">
          {t("title")}
        </h1>
        <div className="hidden lg:block">{button}</div>
      </Reveal>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 border-b border-neutral-100 lg:divide-x divide-neutral-100">
          <Reveal
            className={cn(
              tile,
              "pb-8 lg:pb-10 pr-6 lg:pr-[2.5rem] max-lg:border-r",
            )}
            delay={0.06}
          >
            <Metric label={t("amounts.revenue")} size="responsive">
              {money(figures.revenue)}
            </Metric>
          </Reveal>
          <Reveal
            className={cn(tile, "pb-8 lg:pb-10 pl-6 lg:px-[2.5rem]")}
            delay={0.11}
          >
            <Metric label={t("amounts.profit")} size="responsive">
              {money(figures.profit)}
            </Metric>
          </Reveal>
          <Reveal
            className={cn(
              tile,
              "py-8 lg:pt-0 lg:pb-10 lg:pl-[2.5rem] max-lg:border-t max-lg:col-span-2",
            )}
            delay={0.16}
          >
            <Metric label={t("amounts.balance")} size="responsive">
              {money(figures.balance)}
            </Metric>
            {figures.pending > 0 && (
              <p className="mt-1 font-sans text-[1.2rem] leading-6 text-neutral-500">
                {t("pending_line", {
                  amount: `${formatMoney(figures.pending, locale)} ${currency}`,
                })}
              </p>
            )}
          </Reveal>
        </div>
        {button && (
          <Reveal delay={0.2} className="lg:hidden">
            {button}
          </Reveal>
        )}
      </div>

      <Reveal delay={0.22}>
        <TransactionsTable orders={orders} limit={5} />
      </Reveal>
      <Reveal delay={0.28}>
        <WithdrawalsTable
          requests={transactions.withdrawalRequests}
          currency={currency}
          limit={5}
        />
      </Reveal>
    </div>
  );
}
