"use client";

import { ReactNode, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/shared/DataTable";
import { ButtonAccent } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import formatDate from "@/lib/FormatDate";
import { FetchFinanceActivity } from "@/actions/Finance";
import {
  formatAmount,
  type FinanceActivityDetail,
  type FinancePeriod,
  type Money,
} from "./types";


/**
 * One activity's books, loaded when the drawer opens. Keyed on the activity
 * and period so switching rows never shows the previous row's figures.
 */
export default function FinanceActivityDrawer({
  activityId,
  period,
  locale,
}: {
  activityId: string;
  period: FinancePeriod;
  locale: string;
}) {
  const t = useTranslations("Finance");
  const { data: session } = useSession();
  // Tagged with what it was fetched for, so a result for another row reads
  // as "still loading" rather than as this row's figures.
  const key = `${activityId}:${period}`;
  const [result, setResult] = useState<{
    key: string;
    detail: FinanceActivityDetail | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    FetchFinanceActivity(
      session?.user?.accessToken ?? "",
      activityId,
      period,
    ).then((res) => {
      if (cancelled) return;
      setResult({
        key: `${activityId}:${period}`,
        detail: res.status === "success" ? res.finance : null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [activityId, period, session?.user?.accessToken]);

  const current = result?.key === key ? result : null;
  const detail = current?.detail ?? null;
  const failed = current !== null && current.detail === null;

  return (
    <DrawerContent className="my-8 p-12 rounded-[30px] w-full">
      <div className="w-full flex flex-col items-center overflow-y-scroll">
        <DrawerTitle className="pb-12 text-center">
          <span className="font-primary font-medium text-center text-[2.6rem] leading-12 text-black">
            {detail?.activity.name ?? t("drawer.title")}
          </span>
        </DrawerTitle>
        <DrawerDescription asChild className="w-full">
          <div>
            {detail ? (
              <Details detail={detail} locale={locale} />
            ) : failed ? (
              <p className="text-[1.5rem] text-neutral-600 text-center py-20">
                {t("drawer.loading_error")}
              </p>
            ) : (
              <div className="flex justify-center py-20">
                <LoadingCircleSmall />
              </div>
            )}
          </div>
        </DrawerDescription>
      </div>

      <DrawerFooter>
        <DrawerClose asChild className="flex-1 cursor-pointer">
          <ButtonAccent className="w-full">{t("drawer.close")}</ButtonAccent>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  );
}

function Details({
  detail,
  locale,
}: {
  detail: FinanceActivityDetail;
  locale: string;
}) {
  const t = useTranslations("Finance");
  const { activity, counts, money } = detail;
  // Read in the activity's own currency, with the other one underneath.
  const cur = activity.currency === "USD" ? "USD" : "HTG";
  const date = (d: string | null) => (d ? formatDate(d, locale, "local") : "—");

  return (
    <>
      {/* Activity */}
      <Section>
        <Row label={t("drawer.organisation")}>{activity.organisationName}</Row>
        <Row label={t("drawer.type")}>
          <Badge tone="primary">{t(`types.${activity.activityType}`)}</Badge>
        </Row>
        <Row label={t("drawer.currency")}>{activity.currency}</Row>
        <Row label={t("drawer.period")}>{t(`periods.${detail.period}`)}</Row>
        <Row label={t("drawer.fee_mode")}>
          {activity.absorbFees
            ? t("drawer.fee_mode_absorb")
            : t("drawer.fee_mode_pass")}
        </Row>
        <Row label={t("drawer.fee_override")}>
          {activity.hasFeeOverride ? t("drawer.yes") : t("drawer.no")}
        </Row>
        {(activity.activityType === "event" ||
          activity.activityType === "raffle") && (
          <Row label={t("drawer.balance_released")}>
            {activity.balanceReleasedAt
              ? date(activity.balanceReleasedAt)
              : t("drawer.not_released")}
          </Row>
        )}
        {activity.cancelledAt && (
          <Row label={t("drawer.cancelled")}>{date(activity.cancelledAt)}</Row>
        )}
      </Section>
      <div className="h-[2px] w-full bg-neutral-100" />

      {/* Sales */}
      <Section title={t("drawer.sales.title")}>
        <Row label={t("drawer.sales.units_sold")}>{counts.unitsSold}</Row>
        <Row label={t("drawer.sales.orders")}>{counts.orders}</Row>
        {counts.returnedOrders > 0 && (
          <Row label={t("drawer.sales.returned_orders")}>
            {counts.returnedOrders}
          </Row>
        )}
        {counts.refundedTickets > 0 && (
          <Row label={t("drawer.sales.refunded_tickets")}>
            {counts.refundedTickets}
          </Row>
        )}
        {counts.giveawayTickets > 0 && (
          <Row label={t("drawer.sales.giveaway_tickets")}>
            {counts.giveawayTickets}
          </Row>
        )}
        {counts.rewardTickets > 0 && (
          <Row label={t("drawer.sales.reward_tickets")}>
            {counts.rewardTickets}
          </Row>
        )}
        <Row label={t("drawer.sales.first_sale")}>{date(counts.firstSaleAt)}</Row>
        <Row label={t("drawer.sales.last_sale")}>{date(counts.lastSaleAt)}</Row>
      </Section>
      <div className="h-[2px] w-full bg-neutral-100" />

      {/* Money */}
      <Section title={t("drawer.money.title")}>
        <Row label={t("drawer.money.collected")}>
          <Amount money={money.collected} currency={cur} />
        </Row>
        <Row label={t("drawer.money.organiser_credit")}>
          <Amount money={money.organiserCredit} currency={cur} />
        </Row>
        <Row label={t("drawer.money.fees")} strong>
          <Amount money={money.fees} currency={cur} />
        </Row>
        <Row label={t("drawer.money.processing")}>
          <Amount money={money.processing} currency={cur} negative />
        </Row>
        {(money.tokens.htg > 0 || money.tokens.usd > 0) && (
          <Row label={t("drawer.money.tokens")}>
            <Amount money={money.tokens} currency={cur} negative />
          </Row>
        )}
        {(money.giveaways.htg > 0 || money.giveaways.usd > 0) && (
          <Row label={t("drawer.money.giveaways")}>
            <Amount money={money.giveaways} currency={cur} negative />
          </Row>
        )}
        {(money.refundsPaid.htg !== 0 || money.refundsDebited.htg !== 0) && (
          <Row
            label={t("drawer.money.refunds")}
            hint={t("drawer.money.refunds_hint", {
              paid: amountText(money.refundsPaid, cur),
              debited: amountText(money.refundsDebited, cur),
            })}
          >
            <Amount money={money.refundCost} currency={cur} negative />
          </Row>
        )}
        <Row label={t("drawer.money.net")} strong>
          <Amount money={money.net} currency={cur} />
        </Row>
      </Section>
      <div className="h-[2px] w-full bg-neutral-100" />

      {/* By payment method */}
      <Section title={t("drawer.providers.title")}>
        <MiniTable
          headers={[
            t("drawer.providers.provider"),
            t("drawer.providers.orders"),
            t("drawer.providers.collected"),
            t("drawer.providers.fees"),
            t("drawer.providers.net"),
          ]}
          rows={detail.byProvider.map((p) => [
            <span key="p" className="capitalize">
              {p.provider}
            </span>,
            p.orders,
            amountText(p.collected, cur),
            amountText(p.fees, cur),
            amountText(p.net, cur),
          ])}
          empty={t("drawer.orders.empty")}
        />
      </Section>
      <div className="h-[2px] w-full bg-neutral-100" />

      {/* Registered pricing */}
      <Section title={t("drawer.pricing.title")}>
        {detail.pricing.length === 0 ? (
          <Empty>{t("drawer.pricing.empty")}</Empty>
        ) : (
          detail.pricing.map((p, i) => (
            <Row
              key={i}
              label={p.name}
              hint={
                p.sold === null
                  ? p.quantity === null
                    ? undefined
                    : t("drawer.pricing.sold_of", {
                        sold: "—",
                        quantity: p.quantity,
                      })
                  : p.quantity === null || p.quantity === 0
                    ? t("drawer.pricing.sold", { sold: p.sold })
                    : t("drawer.pricing.sold_of", {
                        sold: p.sold,
                        quantity: p.quantity,
                      })
              }
            >
              <Amount money={p.price} currency={p.currency === "USD" ? "USD" : "HTG"} />
            </Row>
          ))
        )}
      </Section>
      <div className="h-[2px] w-full bg-neutral-100" />

      {/* What actually sold, at the price it sold at */}
      <Section title={t("drawer.items.title")}>
        <MiniTable
          headers={["", "", ""]}
          rows={detail.itemsSold.map((item) => [
            item.name,
            `${item.quantity} × ${amountText(item.unitPrice, cur)}`,
            amountText(item.total, cur),
          ])}
          empty={t("drawer.items.empty")}
          hideHeader
        />
      </Section>
      <div className="h-[2px] w-full bg-neutral-100" />

      {/* Latest orders */}
      <Section title={t("drawer.orders.title")}>
        {detail.recentOrders.length === 0 ? (
          <Empty>{t("drawer.orders.empty")}</Empty>
        ) : (
          detail.recentOrders.map((order) => (
            <Row
              key={order.orderId}
              label={order.orderName}
              hint={`${order.provider} · ${date(order.createdAt)}${
                order.status === "RETURNED" ? ` · ${order.status}` : ""
              }${
                order.tokens.htg > 0 || order.tokens.usd > 0
                  ? ` · ${t("drawer.orders.tokens", {
                      amount: amountText(order.tokens, cur),
                    })}`
                  : ""
              }`}
            >
              <span className="flex flex-col items-end">
                <span>{amountText(order.collected, cur)}</span>
                <span className="text-[1.2rem] text-success font-normal">
                  +{amountText(order.fees, cur)}
                </span>
              </span>
            </Row>
          ))
        )}
      </Section>
    </>
  );
}

function amountText(money: Money, currency: "HTG" | "USD") {
  return currency === "USD"
    ? `${formatAmount(money.usd)} USD`
    : `${formatAmount(money.htg)} HTG`;
}

function Amount({
  money,
  currency,
  negative = false,
}: {
  money: Money;
  currency: "HTG" | "USD";
  negative?: boolean;
}) {
  const other = currency === "USD" ? "HTG" : "USD";
  const main = currency === "USD" ? money.usd : money.htg;
  const sign = negative && main !== 0 ? "−" : "";
  return (
    <span className="flex flex-col items-end">
      <span className={!negative && main < 0 ? "text-failure" : ""}>
        {sign}
        {amountText(money, currency)}
      </span>
      <span className="text-[1.2rem] text-neutral-500 font-normal leading-6">
        {sign}
        {amountText(money, other)}
      </span>
    </span>
  );
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="w-full flex flex-col gap-6 py-6">
      {title && (
        <p className="text-[1.1rem] font-bold uppercase text-deep-100 leading-6">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

function Row({
  label,
  hint,
  strong = false,
  children,
}: {
  label: string;
  hint?: string;
  strong?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-8 text-[1.4rem] leading-8 text-neutral-600">
      <span className="flex flex-col min-w-0">
        <span className={`truncate ${strong ? "text-deep-100 font-medium" : ""}`}>
          {label}
        </span>
        {hint && (
          <span className="text-[1.2rem] text-neutral-500 leading-6">
            {hint}
          </span>
        )}
      </span>
      <span
        className={`text-deep-100 leading-8 text-right shrink-0 ${strong ? "font-bold" : "font-medium"}`}
      >
        {children}
      </span>
    </div>
  );
}

function MiniTable({
  headers,
  rows,
  empty,
  hideHeader = false,
}: {
  headers: string[];
  rows: ReactNode[][];
  empty: string;
  hideHeader?: boolean;
}) {
  if (rows.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[1.3rem] leading-8">
        {!hideHeader && (
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`font-bold text-[1.1rem] uppercase text-neutral-600 pb-2 ${i === 0 ? "text-left" : "text-right"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((cells, r) => (
            <tr key={r} className="border-t border-neutral-100">
              {cells.map((cell, i) => (
                <td
                  key={i}
                  className={`py-2 ${i === 0 ? "text-left text-neutral-700" : "text-right text-deep-100 font-medium whitespace-nowrap pl-4"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[1.4rem] text-neutral-500">{children}</p>;
}
