"use client";
import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { DateTime } from "luxon";
import { Order } from "@ticketwaze/typescript-config";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Stagger } from "@/components/shared/motion";
import formatDate from "@/lib/FormatDate";
import formatRaffleDate from "@/lib/formatRaffleDate";
import formatTime from "@/lib/formatTime";
import { formatMoney } from "@/lib/financeFigures";
import { StatusBadge } from "@/app/[locale]/events/show/[slug]/components/TransactionDetails";
import { classColour, orderPaid } from "./financeParts";

const KNOWN_METHODS = ["moncash", "natcash", "stripe", "wallet", "free"];

/**
 * Transaction Details for an ORDER (Figma 1752:37095, phone 2223:65303): the
 * buyer, the activity, each ticket of the order with its class and check-in
 * status, the total, and the payment. Same panel style as the event page's.
 */
export default function OrderDetails({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={order !== null}
      onOpenChange={(o) => !o && onClose()}
      direction="right"
    >
      <DrawerContent className="bg-white border-none outline-none my-6 mr-4 lg:mr-6 p-6 lg:p-12 rounded-[30px] data-[vaul-drawer-direction=right]:w-[calc(100vw-2rem)] data-[vaul-drawer-direction=right]:lg:w-[58rem]">
        {order && <Body order={order} onClose={onClose} />}
      </DrawerContent>
    </Drawer>
  );
}

function Body({ order, onClose }: { order: Order; onClose: () => void }) {
  const t = useTranslations("Finance.transactions.details");
  const tf = useTranslations("Finance");
  const te = useTranslations("Events.single_event.transaction");
  const locale = useLocale();
  const activity = order.activity;
  const currency = activity?.currency ?? "HTG";
  const tickets = order.tickets ?? [];
  const isRaffle = activity?.activityType === "raffle";
  const zone = activity?.timezone ?? "local";
  const buyer =
    [order.firstName, order.lastName].filter(Boolean).join(" ") ||
    tickets[0]?.fullName ||
    "—";
  const email = order.email || tickets[0]?.email || "—";
  const location = [activity?.address, activity?.city, activity?.country]
    .filter(Boolean)
    .join(", ");
  const method = order.provider
    ? KNOWN_METHODS.includes(order.provider)
      ? te(`methods.${order.provider}`)
      : order.provider
    : "—";
  const priceOf = (ticket: (typeof tickets)[number]) =>
    Number(currency === "USD" ? ticket.ticketUsdPrice : ticket.ticketPrice) ||
    0;

  return (
    <>
      <DrawerTitle className="font-primary font-medium text-center text-[2.2rem] lg:text-[2.6rem] leading-12 text-black pb-6 lg:pb-8 shrink-0">
        {t("title")}
      </DrawerTitle>
      <DrawerDescription className="sr-only">
        {order.orderName}
      </DrawerDescription>

      <div className="w-full flex flex-col overflow-y-auto pb-6 -mt-6 divide-y divide-neutral-200">
        <Stagger step={0.04}>
          <Group>
            <Row label={t("name")}>{buyer}</Row>
            <Row label={t("email")}>
              <span className="break-all">{email}</span>
            </Row>
          </Group>
          <Group>
            <Row label={t("event_name")}>{activity?.name}</Row>
            {isRaffle ? (
              activity?.drawAt && (
                <Row label={t("draw_date")}>
                  {formatRaffleDate(activity.drawAt, locale, activity.timezone)}
                </Row>
              )
            ) : (
              <>
                {activity?.eventDate && (
                  <Row label={t("date")}>
                    {formatDate(activity.eventDate, locale, zone)}
                  </Row>
                )}
                {activity?.startTime && activity?.endTime && (
                  <Row label={t("time")}>
                    {formatTime(activity.startTime, zone, locale)} -{" "}
                    {formatTime(activity.endTime, zone, locale)}
                  </Row>
                )}
                {location && <Row label={t("location")}>{location}</Row>}
              </>
            )}
          </Group>
          <Group>
            <p className="font-sans text-[1.4rem] leading-8 text-neutral-600">
              {t("tickets")} · {tickets.length}X
            </p>
            {tickets.map((ticket) => (
              <div
                key={ticket.ticketId}
                className="flex items-center justify-between gap-4 font-sans text-[1.4rem] leading-8"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="text-deep-100 font-medium truncate">
                    #{ticket.ticketName}
                  </span>
                  <span
                    className="inline-block px-2 py-[.3rem] rounded-[3rem] bg-[#f5f5f5] font-bold text-[1.1rem] leading-6 uppercase shrink-0"
                    style={{ color: classColour(ticket.ticketType) }}
                  >
                    {ticket.ticketType}
                  </span>
                  <StatusBadge status={ticket.status} />
                </span>
                <span className="text-deep-100 font-medium whitespace-nowrap">
                  {formatMoney(priceOf(ticket), locale)} {currency}
                </span>
              </div>
            ))}
            <Row label={t("total")}>
              {formatMoney(orderPaid(order), locale)} {currency}
            </Row>
          </Group>
          <Group>
            <Row label={t("transaction_id")}>
              <span className="break-all">{order.orderName}</span>
            </Row>
            <Row label={t("payment_method")}>{method}</Row>
            <Row label={t("payment_date")}>
              {DateTime.fromISO(String(order.createdAt))
                .setZone(zone)
                .setLocale(locale)
                .toLocaleString(DateTime.DATETIME_MED)}
            </Row>
            <Row label={t("transaction_status")}>
              {te(`statuses.${order.status}`)}
            </Row>
          </Group>
        </Stagger>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 mt-4 w-full h-[5rem] rounded-[10rem] border-2 border-primary-500 bg-primary-50 font-sans font-semibold text-[1.5rem] text-primary-500 cursor-pointer transition-colors hover:bg-primary-100"
      >
        {tf("close")}
      </button>
    </>
  );
}

export function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6 py-6">{children}</div>;
}

export function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 font-sans text-[1.4rem] leading-8">
      <span className="text-neutral-600 shrink-0">{label}</span>
      <span className="text-deep-100 font-medium text-right min-w-0">
        {children}
      </span>
    </div>
  );
}
