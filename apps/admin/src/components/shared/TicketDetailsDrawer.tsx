"use client";
import { useEffect, useState } from "react";
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
import { ButtonAccent, ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { ResendTicketAction } from "@/actions/Activity";
import { cn } from "@/lib/utils";
import { CHECK_BADGE, ticketClassColor, type CheckStatus } from "./ticketBadges";

/**
 * Everything the drawer shows, in one plain shape: the Tickets page passes
 * the API's row as is (services/admin_tickets.ts), the activity page builds it
 * from the event it already holds.
 */
export type TicketDetailsData = {
  ticketId: string;
  ticketName: string;
  ticketType: string;
  fullName: string;
  email: string;
  status: CheckStatus;
  price: { htg: number; usd: number };
  isGiveaway: boolean;
  source: string;
  checkedInAt: string | null;
  activity: {
    name: string;
    currency: string;
    /** "YYYY-MM-DD" for an event day, an ISO instant for a raffle draw. */
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
  };
  order: { orderName: string; provider: string; paidAt: string | null; status: string } | null;
};

const PAYMENT_METHODS = ["moncash", "natcash", "stripe", "wallet", "free"] as const;
const TX_BADGE: Record<string, string> = {
  SUCCESSFUL: "text-success",
  FAILED: "text-failure",
  RETURNED: "text-neutral-700",
};

/** Resend cooldowns, kept per ticket across drawer openings. */
const cooldownUntil = new Map<string, number>();

/**
 * Figma "Ticket Details" (4329:88173 / 4353:92712): attendee, activity,
 * ticket, payment and check-in blocks, then Close / Resend ticket. Resending
 * is a paid email the API budgets (per-ticket cooldown + daily cap,
 * admin-wide daily cap); the button shows the wait instead of failing.
 * Render inside a <Drawer direction="right">.
 */
export default function TicketDetailsDrawer({ ticket }: { ticket: TicketDetailsData }) {
  const t = useTranslations("Activities");
  const locale = useLocale();
  const { data: session } = useSession();
  const [isResending, setIsResending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const waitMs = Math.max(0, (cooldownUntil.get(ticket.ticketId) ?? 0) - now);

  useEffect(() => {
    if (!waitMs) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [waitMs]);

  const dateFormat = (iso: string, withTime: boolean) =>
    new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...(withTime && { hour: "numeric", minute: "2-digit" }),
      timeZone: "America/Port-au-Prince",
    }).format(new Date(iso));

  async function handleResend() {
    if (isResending || waitMs) return;
    setIsResending(true);
    const result = await ResendTicketAction(ticket.ticketId, session?.user.accessToken ?? "", locale);
    setIsResending(false);
    if ("status" in result && result.status === "success") {
      cooldownUntil.set(ticket.ticketId, Date.now() + (result.cooldown ?? 0) * 1000);
      setNow(Date.now());
      toast.success(t("Ticket.resend.success", { email: ticket.email }));
      return;
    }
    const code = "code" in result ? result.code : undefined;
    const retryAfter = "retryAfter" in result ? (result.retryAfter ?? 0) : 0;
    if (code === "RESEND_COOLDOWN" || code === "RESEND_TICKET_DAILY" || code === "RESEND_ADMIN_DAILY") {
      cooldownUntil.set(ticket.ticketId, Date.now() + retryAfter * 1000);
      setNow(Date.now());
      toast.error(t(`Ticket.resend.${code}`, { minutes: Math.ceil(retryAfter / 60) }));
      return;
    }
    toast.error(t("Ticket.resend.error"));
  }

  const { activity, order } = ticket;
  const provider = order?.provider?.toLowerCase();
  const price = ticket.isGiveaway
    ? t("Ticket.details.comped")
    : ticket.source === "reward"
      ? t("Ticket.details.reward")
      : formatMoney(
          activity.currency === "USD" ? ticket.price.usd : ticket.price.htg,
          activity.currency,
          locale,
        );
  const date = activity.date
    ? activity.date.length === 10
      ? dateFormat(`${activity.date}T12:00:00Z`, false)
      : dateFormat(activity.date, true)
    : "-";
  const time =
    activity.startTime && activity.endTime
      ? `${activity.startTime.slice(0, 5)} - ${activity.endTime.slice(0, 5)}`
      : "-";

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
            {t("Ticket.details.title")}
          </span>
        </DrawerTitle>
        <DrawerDescription asChild className="w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6">
              {row(t("Ticket.details.attendee"), ticket.fullName)}
              {row(t("Ticket.details.mail"), ticket.email)}
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
              {row(
                t("Ticket.details.class"),
                <span className="inline-flex items-center gap-3">
                  1X
                  <span style={{ color: ticketClassColor(ticket.ticketType) }} className={cn(badge, "bg-neutral-100")}>
                    {ticket.ticketType}
                  </span>
                </span>,
              )}
              {row(t("Ticket.details.price"), price)}
              {row(t("Ticket.details.id"), `#${ticket.ticketName || ticket.ticketId}`)}
              {row(t("Ticket.details.total"), price)}
            </div>
            {divider}
            <div className="flex flex-col gap-6">
              {row(t("Ticket.details.transaction_id"), order?.orderName || "-")}
              {row(
                t("Ticket.details.payment_method"),
                provider && (PAYMENT_METHODS as readonly string[]).includes(provider)
                  ? t(`Ticket.payment_methods.${provider}`)
                  : (order?.provider ?? "-"),
              )}
              {row(t("Ticket.details.payment_date"), order?.paidAt ? dateFormat(order.paidAt, true) : "-")}
              {row(
                t("Ticket.details.transaction_status"),
                order ? (
                  <span className={cn(badge, "bg-neutral-100", TX_BADGE[order.status] ?? "text-[#C98A00]")}>
                    {order.status}
                  </span>
                ) : (
                  "-"
                ),
              )}
            </div>
            {divider}
            <div className="flex flex-col gap-6 pb-4">
              {row(
                t("Ticket.details.check_status"),
                <span className={cn(badge, CHECK_BADGE[ticket.status])}>
                  {t(`activity.resume.attendance.status.${ticket.status}`)}
                </span>,
              )}
              {row(t("Ticket.details.check_time"), ticket.checkedInAt ? dateFormat(ticket.checkedInAt, true) : "-")}
            </div>
          </div>
        </DrawerDescription>
      </div>

      <DrawerFooter>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <DrawerClose asChild className="lg:flex-1 cursor-pointer">
            <ButtonAccent className="w-full">{t("Ticket.cta.close")}</ButtonAccent>
          </DrawerClose>
          <ButtonPrimary
            className="w-full lg:flex-1"
            disabled={isResending || ticket.status === "RETURNED" || waitMs > 0}
            onClick={handleResend}
          >
            {isResending ? (
              <LoadingCircleSmall />
            ) : waitMs > 0 ? (
              t("Ticket.resend.cooldown", { minutes: Math.ceil(waitMs / 60_000) })
            ) : (
              t("Ticket.cta.resend")
            )}
          </ButtonPrimary>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
