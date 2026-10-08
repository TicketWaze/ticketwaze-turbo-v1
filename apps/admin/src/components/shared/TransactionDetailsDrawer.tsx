"use client";
import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@ticketwaze/currency";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ButtonAccent } from "@/components/shared/buttons";
import { cn } from "@/lib/utils";
import { CHECK_BADGE, ticketClassColor } from "./ticketBadges";
import type { TicketDetailsData } from "./TicketDetailsDrawer";

/** One paid order as the Payments page receives it (services/admin_payments.ts). */
export type TransactionDetailsData = {
  orderId: string;
  orderName: string;
  provider: string;
  status: string;
  amount: { htg: number; usd: number };
  buyer: { name: string; email: string };
  createdAt: string;
  classes: string[];
  tickets: Omit<TicketDetailsData, "activity" | "order">[];
  activity: TicketDetailsData["activity"] & { activityId: string; type: string };
};

const PAYMENT_METHODS = ["moncash", "natcash", "stripe", "wallet", "free"] as const;
export const ORDER_BADGE: Record<string, string> = {
  SUCCESSFUL: "bg-success/10 text-success",
  PENDING: "bg-warning/15 text-[#C98A00]",
  FAILED: "bg-failure/10 text-failure",
  RETURNED: "bg-neutral-100 text-neutral-700",
};

/**
 * Figma "Transaction Details" (4373:73357): buyer, activity, ticket, payment
 * and check-in blocks, Close only. An order of several tickets repeats the
 * ticket and check-in rows per ticket; Total is what the order cost.
 * Render inside a <Drawer direction="right">.
 */
export default function TransactionDetailsDrawer({ tx }: { tx: TransactionDetailsData }) {
  const t = useTranslations("Activities");
  const tp = useTranslations("PaymentsList");
  const locale = useLocale();
  const { activity } = tx;
  const usd = activity.currency === "USD";

  const dateFormat = (iso: string, withTime: boolean) =>
    new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...(withTime && { hour: "numeric", minute: "2-digit" }),
      timeZone: "America/Port-au-Prince",
    }).format(new Date(iso));
  const date = activity.date
    ? activity.date.length === 10
      ? dateFormat(`${activity.date}T12:00:00Z`, false)
      : dateFormat(activity.date, true)
    : "-";
  const time =
    activity.startTime && activity.endTime
      ? `${activity.startTime.slice(0, 5)} - ${activity.endTime.slice(0, 5)}`
      : "-";
  const priceOf = (ticket: TransactionDetailsData["tickets"][number]) =>
    ticket.isGiveaway
      ? t("Ticket.details.comped")
      : ticket.source === "reward"
        ? t("Ticket.details.reward")
        : formatMoney(usd ? ticket.price.usd : ticket.price.htg, activity.currency, locale);
  const provider = tx.provider?.toLowerCase();
  const many = tx.tickets.length > 1;

  const row = (label: string, value: React.ReactNode, alignTop = false) => (
    <p
      className={cn(
        "flex justify-between gap-8 text-[1.4rem] leading-8 text-neutral-600",
        alignTop ? "items-start" : "items-center",
      )}
    >
      <span className="shrink-0">{label}</span>
      <span className="text-deep-100 font-medium text-right min-w-0 break-words">{value}</span>
    </p>
  );
  const divider = <div className="h-[2px] w-full bg-neutral-100" />;
  const badge = "py-[0.3rem] px-2 rounded-[30px] text-[1.1rem] font-bold leading-6 uppercase";

  return (
    <DrawerContent className="my-8 p-12 rounded-[30px] w-full">
      <div className="w-full flex flex-col items-center overflow-y-auto">
        <DrawerTitle className="pb-12">
          <span className="font-primary font-medium text-center text-[2.6rem] leading-12 text-black">
            {tp("drawer.title")}
          </span>
        </DrawerTitle>
        <DrawerDescription asChild className="w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              {row(tp("drawer.buyer"), tx.buyer.name || "-")}
              {row(t("Ticket.details.mail"), tx.buyer.email || "-")}
            </div>
            {divider}
            <div className="flex flex-col gap-6">
              {row(t("Ticket.details.activity"), activity.name)}
              {row(t("Ticket.details.date"), date)}
              {row(t("Ticket.details.time"), time)}
              {row(t("Ticket.details.location"), activity.location || "-", true)}
            </div>
            {divider}
            <div className="flex flex-col gap-6">
              {tx.tickets.map((ticket, i) => (
                <Fragment key={ticket.ticketId}>
                  {many && (
                    <span className="text-[1.3rem] font-semibold text-deep-100">
                      {tp("drawer.ticket", { n: i + 1 })}
                    </span>
                  )}
                  {row(
                    t("Ticket.details.class"),
                    <span className="inline-flex items-center gap-3">
                      1X
                      <span
                        style={{ color: ticketClassColor(ticket.ticketType) }}
                        className={cn(badge, "bg-neutral-100")}
                      >
                        {ticket.ticketType}
                      </span>
                    </span>,
                  )}
                  {row(t("Ticket.details.price"), priceOf(ticket))}
                  {row(t("Ticket.details.id"), `#${ticket.ticketName || ticket.ticketId}`)}
                </Fragment>
              ))}
              {row(
                tp("drawer.total"),
                formatMoney(usd ? tx.amount.usd : tx.amount.htg, activity.currency, locale),
              )}
            </div>
            {divider}
            <div className="flex flex-col gap-6">
              {row(t("Ticket.details.transaction_id"), tx.orderName || "-")}
              {row(
                t("Ticket.details.payment_method"),
                provider && (PAYMENT_METHODS as readonly string[]).includes(provider)
                  ? t(`Ticket.payment_methods.${provider}`)
                  : (tx.provider ?? "-"),
              )}
              {row(t("Ticket.details.payment_date"), dateFormat(tx.createdAt, true))}
              {row(
                t("Ticket.details.transaction_status"),
                <span className={cn(badge, ORDER_BADGE[tx.status] ?? ORDER_BADGE.PENDING)}>
                  {tp(`status.${tx.status}`)}
                </span>,
              )}
            </div>
            {tx.tickets.length > 0 && (
              <>
                {divider}
                <div className="flex flex-col gap-6 pb-4">
                  {tx.tickets.map((ticket) => (
                    <Fragment key={ticket.ticketId}>
                      {row(
                        many
                          ? `${t("Ticket.details.check_status")} · ${ticket.ticketName}`
                          : t("Ticket.details.check_status"),
                        <span className={cn(badge, CHECK_BADGE[ticket.status])}>
                          {t(`activity.resume.attendance.status.${ticket.status}`)}
                        </span>,
                      )}
                      {row(
                        t("Ticket.details.check_time"),
                        ticket.checkedInAt ? dateFormat(ticket.checkedInAt, true) : "-",
                      )}
                    </Fragment>
                  ))}
                </div>
              </>
            )}
          </div>
        </DrawerDescription>
      </div>

      <DrawerFooter>
        <DrawerClose asChild className="cursor-pointer">
          <ButtonAccent className="w-full">{t("Ticket.cta.close")}</ButtonAccent>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  );
}
