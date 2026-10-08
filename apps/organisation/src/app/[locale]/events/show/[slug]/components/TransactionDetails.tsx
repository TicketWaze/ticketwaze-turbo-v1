"use client";
import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import { Event, Order, Ticket } from "@ticketwaze/typescript-config";
import {
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Stagger } from "@/components/shared/motion";
import { usePermission } from "@/hooks/usePermission";
import { ResendTicketAction } from "@/actions/EventActions";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import { cn } from "@/lib/utils";

function formatDuration(totalMinutes: number) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
}

/**
 * Figma's "Transaction Details" panel (1754:38080 pending, 1754:38765 checked
 * in; phone 2220:58174 / 2220:59123): the attendee, the activity, the ticket,
 * its order and its attendance, with Close and Resend ticket. Resend mails the
 * ticket again to its holder and is off once the ticket is checked in or
 * returned. Attendance extras (presence, time inside, entries) follow the
 * check-in time when there is one.
 */
export default function TransactionDetails({
  event,
  ticket,
  order,
  status,
  checkTime,
  classColour,
  cooldownUntil,
  onCooldown,
  onClose,
}: {
  event: Event;
  ticket: Ticket;
  order?: Order;
  /** The row's status, including a check-in made from this page a moment ago. */
  status: Ticket["status"];
  checkTime: string | null;
  classColour: string;
  /** When this ticket can be resent again (ms), as last told by the API. */
  cooldownUntil?: number;
  onCooldown: (until: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("Finance.transactions.details");
  const te = useTranslations("Events.single_event");
  const locale = useLocale();
  const { can } = usePermission();
  const [sending, setSending] = useState(false);
  // Re-render every 30 s while a cooldown runs, so its minutes count down.
  const [now, setNow] = useState(() => Date.now());
  const cooling = cooldownUntil !== undefined && cooldownUntil > now;
  useEffect(() => {
    if (!cooling) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [cooling]);
  const minutesLeft = cooling
    ? Math.max(1, Math.ceil((cooldownUntil - now) / 60_000))
    : 0;
  const days = [...event.eventDays].sort((a, b) => a.dayNumber - b.dayNumber);
  const zone = days[0]?.timezone ?? "local";
  const at = (iso: string) =>
    DateTime.fromISO(iso)
      .setZone(zone)
      .setLocale(locale)
      .toLocaleString(DateTime.DATETIME_MED);
  const price =
    event.currency === "USD" ? ticket.ticketUsdPrice : ticket.ticketPrice;
  const money = `${Number(price ?? 0).toLocaleString(locale)} ${event.currency}`;
  const knownMethod = ["moncash", "natcash", "stripe", "wallet", "free"];
  const method = order?.provider
    ? knownMethod.includes(order.provider)
      ? te(`transaction.methods.${order.provider}`)
      : order.provider
    : "—";
  const canResend = status === "PENDING" && can("tickets.resend");
  const location =
    event.eventCategory === "meet"
      ? null
      : [event.address, event.city, event.country].filter(Boolean).join(", ");

  async function resend() {
    setSending(true);
    const result = await ResendTicketAction(
      event.eventId,
      ticket.ticketId,
      locale,
    );
    setSending(false);
    const wait = result.retryAfter ?? 0;
    if (wait > 0) {
      setNow(Date.now());
      onCooldown(Date.now() + wait * 1000);
    }
    if (result.status === "success") {
      toast.success(te("transaction.resend_done", { email: ticket.email }));
      return;
    }
    const minutes = Math.max(1, Math.ceil(wait / 60));
    const byCode: Record<string, string> = {
      TICKET_CHECKED_IN: te("transaction.resend_checked"),
      TICKET_RETURNED: te("transaction.resend_returned"),
      RATE_LIMITED: te("transaction.resend_limited"),
      RESEND_COOLDOWN: te("transaction.resend_wait", { minutes }),
      RESEND_TICKET_DAILY: te("transaction.resend_ticket_daily"),
      RESEND_ORG_DAILY: te("transaction.resend_org_daily", {
        hours: Math.max(1, Math.ceil(wait / 3600)),
      }),
    };
    toast.error(
      (result.code && byCode[result.code]) || te("transaction.resend_failed"),
    );
  }

  return (
    <DrawerContent className="bg-white border-none outline-none my-6 mr-4 lg:mr-6 p-6 lg:p-12 rounded-[30px] data-[vaul-drawer-direction=right]:w-[calc(100vw-2rem)] data-[vaul-drawer-direction=right]:lg:w-[58rem]">
      <DrawerTitle className="font-primary font-medium text-center text-[2.2rem] lg:text-[2.6rem] leading-12 text-black pb-6 lg:pb-8">
        {t("title")}
      </DrawerTitle>
      <DrawerDescription className="sr-only">
        {ticket.ticketName} · {ticket.fullName}
      </DrawerDescription>

      <div className="w-full flex flex-col overflow-y-auto pb-6 -mt-6 divide-y divide-neutral-200">
        <Stagger step={0.04}>
          <Group>
            <Row label={t("name")}>{ticket.fullName}</Row>
            <Row label={t("email")}>
              <span className="break-all">{ticket.email}</span>
            </Row>
          </Group>
          <Group>
            <Row label={t("event_name")}>{event.eventName}</Row>
            {days.map((day) => (
              <React.Fragment key={day.eventDayId}>
                <Row
                  label={
                    days.length > 1
                      ? `${t("date")} · ${te("transaction.day", { n: day.dayNumber })}`
                      : t("date")
                  }
                >
                  {formatDate(day.eventDate, locale, day.timezone)}
                </Row>
                <Row label={t("time")}>
                  {formatTime(day.startTime, day.timezone, locale)} -{" "}
                  {formatTime(day.endTime, day.timezone, locale)}
                </Row>
              </React.Fragment>
            ))}
            {location && <Row label={t("location")}>{location}</Row>}
          </Group>
          <Group>
            <Row label={t("ticket_class")}>
              <span className="inline-flex items-center gap-3">
                1X
                <Pill colour={classColour}>{ticket.ticketType}</Pill>
              </span>
            </Row>
            <Row label={t("price")}>{money}</Row>
            <Row label={t("ticket_id")}>#{ticket.ticketName}</Row>
            <Row label={t("total")}>{money}</Row>
          </Group>
          {order && (
            <Group>
              <Row label={t("transaction_id")}>
                <span className="break-all">
                  {order.orderName || order.orderId}
                </span>
              </Row>
              <Row label={t("payment_method")}>{method}</Row>
              <Row label={t("payment_date")}>{at(String(order.createdAt))}</Row>
              <Row label={t("transaction_status")}>
                {te(`transaction.statuses.${order.status}`)}
              </Row>
            </Group>
          )}
          <Group>
            <Row label={t("check_status")}>
              <StatusBadge status={status} />
            </Row>
            <Row label={t("check_time")}>{checkTime ? at(checkTime) : "-"}</Row>
            {status === "CHECKED" && !!ticket.entriesCount && (
              <>
                <Row label={t("presence")}>
                  <Pill
                    colour={
                      ticket.presence === "inside" ? "#349C2E" : "#737C8A"
                    }
                  >
                    {ticket.presence === "inside"
                      ? t("inside")
                      : t("checked_out")}
                  </Pill>
                </Row>
                <Row label={t("time_inside")}>
                  {formatDuration(ticket.totalMinutesInside ?? 0)}
                </Row>
                <Row label={t("entries")}>{ticket.entriesCount}</Row>
              </>
            )}
          </Group>
        </Stagger>
      </div>

      {/* Desktop: Close | Resend side by side. Phone: Resend on top (2220:58174). */}
      <div className="shrink-0 mt-4 flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
        <button
          type="button"
          onClick={onClose}
          className="w-full lg:flex-1 h-[5rem] shrink-0 rounded-[10rem] border-2 border-primary-500 bg-primary-50 font-sans font-semibold text-[1.5rem] text-primary-500 cursor-pointer transition-colors hover:bg-primary-100"
        >
          {t("close")}
        </button>
        <motion.button
          type="button"
          onClick={resend}
          disabled={!canResend || sending || cooling}
          whileTap={canResend ? { scale: 0.97 } : undefined}
          title={
            status === "CHECKED" ? te("transaction.resend_checked") : undefined
          }
          className={cn(
            "w-full lg:flex-1 h-[5rem] shrink-0 rounded-[10rem] bg-primary-500 font-sans font-semibold text-[1.5rem] text-white cursor-pointer transition-[background-color,opacity] hover:bg-primary-600",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-500",
          )}
        >
          {sending
            ? te("transaction.sending")
            : cooling
              ? te("transaction.sent_wait", { minutes: minutesLeft })
              : t("resend")}
        </motion.button>
      </div>
    </DrawerContent>
  );
}

export function StatusBadge({ status }: { status: Ticket["status"] }) {
  const t = useTranslations("Events.single_event");
  const styles: Record<string, { color: string; label: string }> = {
    CHECKED: { color: "#349C2E", label: t("filters.checked") },
    PENDING: { color: "#EA961C", label: t("filters.pending") },
    RETURNED: { color: "#737C8A", label: t("filters.returned") },
  };
  const s = styles[status];
  if (!s) return null;
  return (
    <motion.span
      key={status}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-block px-2 py-[.3rem] rounded-[3rem] bg-[#f5f5f5] font-bold text-[1.1rem] leading-6 uppercase"
      style={{ color: s.color }}
    >
      {s.label}
    </motion.span>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6 py-6">{children}</div>;
}

function Row({
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

function Pill({
  colour,
  children,
}: {
  colour: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-block px-2 py-[.3rem] rounded-[3rem] bg-[#f5f5f5] font-bold text-[1.1rem] leading-6 uppercase"
      style={{ color: colour }}
    >
      {children}
    </span>
  );
}
