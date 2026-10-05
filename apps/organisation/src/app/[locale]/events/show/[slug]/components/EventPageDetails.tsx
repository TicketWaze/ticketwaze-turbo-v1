"use client";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { DateTime } from "luxon";
import { Send2 } from "iconsax-reactjs";
import { toast } from "sonner";
import {
  Event,
  EventPerformer,
  MembershipTier,
  Order,
  Ticket,
  TicketReturn,
  PhysicalTicketBatch,
} from "@ticketwaze/typescript-config";
import { ButtonPill } from "@/components/shared/buttons";
import { Reveal } from "@/components/shared/motion";
import { Metric, TrendBadge, Unit } from "@/app/[locale]/analytics/parts";
import { ticketsOrganisationTotal } from "@/lib/ticketEarnings";
import { eventStartsAt, isEventInProgress, isEventPast } from "@/lib/eventTime";
import { cn } from "@/lib/utils";
import MoreComponent from "./MoreComponent";
import CheckingDialog from "./CheckingDialog";
import StartMeetingButton from "./StartMeetingButton";
import DeletionBanner from "./DeletionBanner";
import EventArtist from "./EventArtist";
import TicketsTable from "./TicketsTable";
import ReturnedTicketsSection from "./ReturnedTicketsSection";
import PrintedTicketsSection from "./PrintedTicketsSection";
import { useRouter } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import MountOnOpen from "@/components/shared/MountOnOpen";

// Dialogs and drawers download on first open, not with the page: between
// them they carry QR and poster rendering, form validation and the exports.
const ShareEvent = dynamic(() => import("./ShareEvent"), { ssr: false });
const ExportDialog = dynamic(() => import("./ExportDialog"), { ssr: false });
const EventDrawerContent = dynamic(() => import("./EventDrawerContent"), {
  ssr: false,
});
const AddDiscountDrawer = dynamic(
  () => import("../discount-codes/AddDiscountDrawer"),
  { ssr: false },
);

/**
 * % change of `value` over the last 7 days against the 7 before; null when
 * there is nothing to compare (no sales in either week).
 */
function weekTrend(
  tickets: Ticket[],
  value: (tickets: Ticket[]) => number,
): number | null {
  const now = DateTime.now();
  const inWindow = (from: DateTime, to: DateTime) =>
    tickets.filter((tk) => {
      const at = DateTime.fromISO(String(tk.createdAt));
      return at >= from && at < to;
    });
  const current = value(inWindow(now.minus({ days: 7 }), now));
  const previous = value(
    inWindow(now.minus({ days: 14 }), now.minus({ days: 7 })),
  );
  if (previous === 0) return current > 0 ? 100 : null;
  const change = Math.round(((current - previous) / previous) * 100);
  return change === 0 ? null : change;
}

// 2×2 on mobile (dividers between columns and rows), one row of four on desktop.
const kpiTiles = [
  "max-lg:pr-6 max-lg:pb-8 max-lg:border-r lg:pr-[2.5rem] lg:pb-10",
  "max-lg:pl-6 max-lg:pb-8 lg:px-[2.5rem] lg:pb-10",
  "max-lg:pr-6 max-lg:pt-8 max-lg:border-r max-lg:border-t lg:px-[2.5rem] lg:pb-10",
  "max-lg:pl-6 max-lg:pt-8 max-lg:border-t lg:pl-[2.5rem] lg:pb-10",
].map((c) => cn(c, "border-neutral-100"));

/**
 * An event's page (Figma Events › 1651:57073 / 1712:34749, mobile 2217:51788):
 * title and actions, four KPIs, then its tickets. Once it has started
 * (ongoing 1626:52530, or over) the countdown gives way to the check-in count
 * and the table's last column to each ticket's check-in time. The post-design blocks
 * (performers, printed and returned tickets, deletion notices) follow.
 */
export default function EventPageDetails({
  event,
  tickets,
  orders,
  slug,
  eventPerformers,
  membershipTier,
  ticketReturns,
  physicalTicketBatches = [],
}: {
  event: Event;
  tickets: Ticket[];
  orders: Order[];
  slug: string;
  eventPerformers: EventPerformer[];
  membershipTier: MembershipTier;
  ticketReturns: TicketReturn[];
  physicalTicketBatches?: PhysicalTicketBatch[];
}) {
  const t = useTranslations("Events.single_event");
  const locale = useLocale();
  const isFree = event.eventTicketTypes.every((c) => c.ticketTypePrice == 0);
  const today = DateTime.now();
  /**
   * Start, end, and the countdown between them — all through the shared helper
   * so that this screen, the drawer beside it and the admin dashboard cannot
   * answer "has it started?" and "is it over?" differently. The start is the
   * EARLIEST day's, not day 1's, and the end is the LAST day's end time read in
   * that day's own timezone.
   */
  const eventStart = eventStartsAt(event.eventDays);
  const daysLeft = eventStart ? eventStart.diff(today, "days").days : null;
  const roundedDays = Math.ceil(daysLeft && daysLeft > 0 ? daysLeft : 0);
  const isUpcoming = eventStart !== null && today < eventStart;
  const isPast = isEventPast(event.eventDays, today);
  const isOngoing = isEventInProgress(event.eventDays, today);
  /** Once doors open (ongoing or over) the page reports attendance instead of the countdown (Figma 1626:52530). */
  const started = eventStart !== null && !isUpcoming;

  const [deletionStatus, setDeletionStatus] = useState(
    event.deletionStatus ?? null,
  );
  const [deletionReason, setDeletionReason] = useState(
    event.deletionReason ?? null,
  );
  const [scheduledDeletionAt, setScheduledDeletionAt] = useState(
    event.scheduledDeletionAt ?? null,
  );
  const isPendingDeletion = deletionStatus === "pending_deletion";
  const isDeleted = deletionStatus === "deleted";
  const live =
    event.adminStatus === "approved" && !isPendingDeletion && !isDeleted;

  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const router = useRouter();

  /** Discount success › Share: the code goes to the clipboard, then Share opens. */
  function shareDiscount(code: string) {
    // Not awaited: Share opens at once, the toast confirms the copy.
    navigator.clipboard
      ?.writeText(code)
      .then(() => toast.success(t("discount.code_copied", { code })))
      .catch(() => {});
    setDiscountOpen(false);
    setShareOpen(true);
  }

  const canShare = (isUpcoming || isOngoing) && live;
  const canCheckIn = live && event.eventCategory !== "meet" && !isPast;
  const canMeet = live && event.eventCategory === "meet" && !isPast;
  // New ticket classes (Create Ticket): in-person events until they end.
  const canCreateTicket =
    !isPast &&
    !isPendingDeletion &&
    !isDeleted &&
    event.eventCategory === "physical";

  /* ── KPIs ── */
  const fmt = (n: number) => n.toLocaleString(locale);
  const sold = (list: Ticket[]) =>
    list.filter((tk) => tk.status !== "RETURNED").length;
  const soldCount = sold(tickets);
  const capacity = event.eventTicketTypes.reduce(
    (sum, c) => sum + Number(c.ticketTypeQuantity || 0),
    0,
  );
  const left = Math.max(0, capacity - soldCount);
  const checkedIn = tickets.filter((tk) => tk.status === "CHECKED").length;
  const revenue = ticketsOrganisationTotal(tickets, event.currency);
  const revenueTrend = isFree
    ? null
    : weekTrend(tickets, (list) =>
        ticketsOrganisationTotal(list, event.currency),
      );
  const soldTrend = weekTrend(tickets, sold);
  // Tickets left a week ago were today's plus what sold since.
  const soldThisWeek = tickets.filter(
    (tk) =>
      tk.status !== "RETURNED" &&
      DateTime.fromISO(String(tk.createdAt)) >= today.minus({ days: 7 }),
  ).length;
  const leftTrend =
    soldThisWeek > 0 && left + soldThisWeek > 0
      ? -Math.round((soldThisWeek / (left + soldThisWeek)) * 100)
      : null;
  const trendLabel = (value: number | null) =>
    value === null
      ? ""
      : t(value < 0 ? "trend.down" : "trend.up", { value: Math.abs(value) });
  const trend = (value: number | null, inverse = false) => (
    <span className="hidden lg:inline-flex">
      <TrendBadge value={value} label={trendLabel(value)} inverse={inverse} />
    </span>
  );

  const more = (
    <MoreComponent
      daysLeft={daysLeft}
      event={event}
      isFree={isFree}
      slug={slug}
      membershipTier={membershipTier}
      deletionStatus={deletionStatus}
      onDeletionScheduled={(scheduledAt, reason) => {
        setDeletionStatus("pending_deletion");
        setScheduledDeletionAt(scheduledAt);
        setDeletionReason(reason);
      }}
      onShowDetails={() => setDetailsOpen(true)}
      onExport={() => setExportOpen(true)}
      onAddDiscount={() => setDiscountOpen(true)}
    />
  );
  const createTicket = canCreateTicket && (
    <ButtonPill
      tone="primary"
      onClick={() =>
        membershipTier.customTicketTypes
          ? router.push(`/events/show/${slug}/tickets/new`)
          : toast.info(t("create_ticket_upgrade"))
      }
    >
      {t("create_ticket")}
    </ButtonPill>
  );

  return (
    <div className="flex flex-col gap-12 lg:gap-16 pb-16 overflow-y-auto">
      {/* Title + actions */}
      <Reveal
        y={-12}
        className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"
      >
        <h1 className="font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-[1.2] text-black break-words min-w-0">
          {event.eventName}
        </h1>
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {canCheckIn && <CheckingDialog event={event} tickets={tickets} />}
          {canMeet && <StartMeetingButton event={event} />}
          {canShare && (
            <ButtonPill onClick={() => setShareOpen(true)}>
              <Send2 variant="Bulk" color="#737C8A" size={20} aria-hidden />
              {t("share")}
            </ButtonPill>
          )}
          {createTicket}
          {more}
        </div>
      </Reveal>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-neutral-100 divide-neutral-100 lg:divide-x pb-8 lg:pb-0">
        <Reveal className={kpiTiles[0]} delay={0.06}>
          <Metric
            label={t("revenue")}
            size="responsive"
            trend={trend(revenueTrend)}
          >
            {fmt(revenue)} <Unit>{event.currency}</Unit>
          </Metric>
        </Reveal>
        <Reveal className={kpiTiles[1]} delay={0.11}>
          <Metric label={t("sold")} size="responsive" trend={trend(soldTrend)}>
            {fmt(soldCount)} <Unit>/ {fmt(capacity)}</Unit>
          </Metric>
        </Reveal>
        <Reveal className={kpiTiles[2]} delay={0.16}>
          <Metric
            label={t("left")}
            size="responsive"
            trend={trend(leftTrend, true)}
          >
            {fmt(left)} <Unit>/ {fmt(capacity)}</Unit>
          </Metric>
        </Reveal>
        <Reveal className={kpiTiles[3]} delay={0.21}>
          {started ? (
            <Metric label={t("checked_in_kpi")} size="responsive">
              {fmt(checkedIn)}
            </Metric>
          ) : (
            <Metric label={t("count_down")} size="responsive">
              {roundedDays} <Unit>{t("day")}</Unit>
            </Metric>
          )}
        </Reveal>
      </div>

      {/* Phone actions (Figma 2217:51788) */}
      <Reveal delay={0.2} className="flex lg:hidden items-center gap-4">
        {createTicket}
        {canCheckIn && <CheckingDialog event={event} tickets={tickets} />}
        {canMeet && <StartMeetingButton event={event} />}
        <div className="ml-auto flex items-center gap-4">
          {canShare && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label={t("share")}
              className="w-[3.5rem] h-[3.5rem] rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer"
            >
              <Send2 variant="Bulk" color="#737C8A" size={20} aria-hidden />
            </button>
          )}
          {more}
        </div>
      </Reveal>

      {isPendingDeletion && scheduledDeletionAt && (
        <DeletionBanner
          eventId={event.eventId}
          scheduledDeletionAt={scheduledDeletionAt}
          deletionReason={deletionReason}
          onCancelled={() => {
            setDeletionStatus(null);
            setScheduledDeletionAt(null);
            setDeletionReason(null);
          }}
        />
      )}
      {isDeleted && (
        <div className="flex items-start gap-4 rounded-[15px] border border-neutral-200 bg-neutral-50 p-6">
          <div className="w-[0.8rem] h-[0.8rem] rounded-full bg-neutral-400 mt-[0.6rem] shrink-0" />
          <p className="text-[1.5rem] leading-8 text-neutral-600">
            {t("deleted_notice")}
          </p>
        </div>
      )}

      {!isDeleted && (
        <TicketsTable
          event={event}
          tickets={tickets}
          orders={orders}
          canCheckIn={canCheckIn}
          showCheckTime={started}
          onPromote={canShare ? () => setShareOpen(true) : undefined}
        />
      )}

      {isUpcoming && !isDeleted && (
        <Reveal delay={0.3}>
          <EventArtist event={event} eventPerformers={eventPerformers} />
        </Reveal>
      )}
      <PrintedTicketsSection event={event} batches={physicalTicketBatches} />
      <ReturnedTicketsSection event={event} ticketReturns={ticketReturns} />

      <MountOnOpen open={shareOpen}>
        <ShareEvent
          event={event}
          open={shareOpen}
          onOpenChange={setShareOpen}
        />
      </MountOnOpen>
      <MountOnOpen open={exportOpen}>
        <ExportDialog
          event={event}
          tickets={tickets}
          membershipTier={membershipTier}
          open={exportOpen}
          onOpenChange={setExportOpen}
        />
      </MountOnOpen>
      <MountOnOpen open={detailsOpen}>
        <EventDrawerContent
          event={event}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </MountOnOpen>
      <MountOnOpen open={discountOpen}>
        <AddDiscountDrawer
          event={event}
          open={discountOpen}
          onOpenChange={setDiscountOpen}
          onShare={shareDiscount}
        />
      </MountOnOpen>
    </div>
  );
}
