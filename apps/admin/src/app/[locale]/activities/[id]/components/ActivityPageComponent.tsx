"use client";
import { useState } from "react";
import BackButton from "@/components/shared/BackButton";
import { ButtonBlack, ButtonNeutral } from "@/components/shared/buttons";
import EventImageLightbox from "@/components/shared/EventImageLightbox";
import { EventStatusDialog } from "./EventStatusDialog";
import GiveawayTicketsDialog from "./GiveawayTicketsDialog";
import RefundActivityDialog from "@/components/shared/RefundActivityDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar2,
  Location,
  Clock,
  Edit2,
  Gift,
  Trash,
  Status,
  ReceiptDiscount,
  Scanner as ScannerIcon,
  Star1,
} from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { SetEventSponsoredAction } from "@/actions/Activity";
import FeesHandlerDialog from "@/components/shared/FeesHandlerDialog";
import CheckingDialog, {
  canOfferChecking,
  getCheckingWindowStatus,
} from "@/components/shared/CheckingDialog";
import Separator from "@/components/shared/Separator";
import { useLocale, useTranslations } from "next-intl";
import ActivityActionsMenu from "@/components/shared/ActivityActionsMenu";
import useAdminCan from "@/lib/useAdminCan";
import { eventStartsAt, isEventInProgress, isEventPast } from "@/lib/eventTime";
import { ticketsOrganisationTotal } from "@/lib/ticketEarnings";
import Image from "next/image";
import Link from "next/link";
import { ActivityAttendances } from "./ActivityAttendances";
import { Event } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import { DateTime } from "luxon";

/**
 * Why the refund action is unavailable, or null when it is offered. Mirrors the
 * API's guards in services/activity_refund.ts — the API decides, this only
 * explains the answer without a round trip.
 *
 * `eventStart` is now the earliest day's start as a real instant, read in that
 * day's own timezone, which is exactly what the API compares against — so the
 * two agree. It used to be compared against the start of TODAY, which offered
 * the button for the rest of the day after an event had begun and handed the
 * admin an error from the server instead of an explanation.
 */
function eventRefundBlockedReason(
  event: Event,
  eventStart: DateTime | null,
): string | null {
  if (event.cancelledAt) return "This event has already been cancelled.";
  if (event.deletionStatus) return "This event is being deleted.";
  // Scheduled days only, exactly as the API has it: a teaser's `comingSoonDate`
  // is not a start time, and reading it as one would block a refund at midnight
  // on a date nothing is actually happening on.
  const hasDays = (event.eventDays?.length ?? 0) > 0;
  if (hasDays && eventStart && eventStart <= DateTime.now())
    return "This event has already started and cannot be refunded.";
  return null;
}

export default function ActivityPageComponent({ event }: { event: Event }) {
  const t = useTranslations("Activities");

  const orgInitial = event.organisation.organisationName
    .charAt(0)
    .toUpperCase();
  const followersCount =
    event.organisation.followersCount ??
    event.organisation.followers?.length ??
    0;
  const locale = useLocale();

  // A teaser has no eventDays and no ticket types, so nothing here may assume
  // a first day exists. Its date, when it has one, is the plain "YYYY-MM-DD"
  // comingSoonDate — parsed with an explicit T00:00:00 so it is not read as UTC
  // and rendered as the previous day west of Greenwich.
  const firstDay = event.eventDays?.find((day) => day.dayNumber === 1);
  const teaserDate = event.comingSoonDate
    ? new Date(`${event.comingSoonDate}T00:00:00`)
    : null;

  const formattedDate = firstDay
    ? formatDate(firstDay.eventDate, locale, firstDay.timezone)
    : teaserDate
      ? teaserDate
          .toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
          .toUpperCase()
      : (event.comingSoonHint ?? "-");
  const formattedTime = firstDay
    ? `${formatTime(
        firstDay.startTime,
        firstDay.timezone,
        locale,
      )} - ${formatTime(firstDay.endTime, firstDay.timezone, locale)}`
    : "-";

  // Online events are flagged by eventCategory ("meet"), not eventType
  // (which holds public/private); they have no address fields.
  const isMeetEvent = event.eventCategory === "meet";
  // A teaser may have no venue at all, and joining nulls prints a bare comma.
  const address = isMeetEvent
    ? "Google Meet"
    : [event.address, event.city, event.state, event.country]
        .filter(Boolean)
        .join(", ") || "-";

  const soldTickets = (event.tickets ?? []).filter(
    (o) => o.status !== "RETURNED",
  );
  /**
   * SALES, WHICH IS NARROWER THAN TICKETS.
   *
   * A bonus reward ticket is not a sale: nobody paid for it, the organisation
   * was credited nothing, and it takes no tier inventory — so counting it here
   * would push this figure above the tier counters in the tile below and add a
   * row that can never contribute to revenue. An admin giveaway stays counted:
   * the organisation WAS credited the face value and the seat does come out of
   * the tier, so on both counts it behaves like a sale.
   */
  const rewardTickets = soldTickets.filter((o) => o.source === "reward");
  const purchasedTickets = soldTickets.filter((o) => o.source !== "reward");
  /**
   * Revenue is what the ORGANISATION EARNED, not what buyers paid — the two
   * differ on a giveaway (price 0, face value credited) and on a fee-absorbing
   * activity (price higher than the earnings). See lib/ticketEarnings.
   */
  const totalRevenue = ticketsOrganisationTotal(
    purchasedTickets,
    event.currency,
  );

  const ticketTypes = event.eventTicketTypes ?? [];
  const totalSold = ticketTypes.reduce(
    (sum, t) => sum + t.ticketTypeQuantitySold,
    0,
  );
  const totalCapacity = ticketTypes.reduce(
    (sum, t) => sum + t.ticketTypeQuantity,
    0,
  );
  const ticketsLeft = totalCapacity - totalSold;

  /**
   * THE COUNTDOWN, WHICH USED TO CALL AN EVENT PASSED ON ITS OWN DAY.
   *
   * It read `DateTime.fromISO(firstDay.eventDate)` — the stored date in the
   * browser's zone, with the hours discarded — so from midnight onwards the
   * start was "in the past" and an event running that evening was announced as
   * over. An event is over when its LAST day's end time has gone by, read in
   * the day's own timezone, and while it is between those two it is happening
   * now rather than either.
   *
   * A teaser has no days, only a bare `comingSoonDate`, so it counts down to
   * that date and is only past once the whole day has gone.
   */
  const today = DateTime.now();
  const eventStart = firstDay
    ? eventStartsAt(event.eventDays)
    : teaserDate
      ? DateTime.fromJSDate(teaserDate)
      : null;
  const hasEnded = firstDay
    ? isEventPast(event.eventDays, today)
    : teaserDate
      ? DateTime.fromJSDate(teaserDate).endOf("day") < today
      : false;
  const inProgress = firstDay && isEventInProgress(event.eventDays, today);
  const daysLeft = eventStart
    ? Math.ceil(Math.max(eventStart.diff(today, "days").days, 0))
    : null;
  const countdownText = hasEnded
    ? "Event passed"
    : inProgress
      ? "Happening now"
      : daysLeft === null
        ? "-"
        : daysLeft <= 0
          ? "Starting today"
          : `${daysLeft} days to go`;

  const canManage = useAdminCan("activity.manage");

  /**
   * Which action dialog is open. Held here rather than inside each dialog
   * because the menu that opens them is a popover, and a dialog mounted inside
   * a popover is unmounted by the same click that opens it.
   */
  const [openDialog, setOpenDialog] = useState<
    null | "status" | "giveaway" | "fees" | "refund" | "checking"
  >(null);

  /**
   * THE SCANNER, WHICH HAS TO BE FINDABLE.
   *
   * Gated on `tickets.checking` and on the activity being scannable at all
   * (approved, in person, not cancelled, not being deleted) — but NOT on the
   * time window any more. Hiding it outside the window is what made it
   * disappear from finished events, leaving an admin unable to tell whether the
   * button had moved or they lacked the permission. Outside the window it is
   * drawn greyed out with the reason instead, which is also what the API
   * answers.
   *
   * Its two triggers — the desktop header and the mobile footer — drive ONE
   * dialog, so the camera is never mounted twice.
   */
  const canCheck = useAdminCan("tickets.checking") && canOfferChecking(event);
  const scanClosedReason =
    getCheckingWindowStatus(event).status === "closed"
      ? "This activity has ended — ticket checking is closed."
      : null;

  const editBlockedReason = event.cancelledAt
    ? "This activity has been cancelled and can no longer be edited."
    : event.deletionStatus
      ? "This activity is scheduled for deletion."
      : null;

  const refundBlockedReason = eventRefundBlockedReason(event, eventStart);

  /**
   * THE LANDING PAGE'S SPONSORED SECTION. Mirrors the API's `showableEvents`
   * so the reason is shown up front rather than as an error after the click;
   * the API still decides, including the three-at-once limit. Removing is
   * always allowed, so an event that has since ended can be cleared.
   */
  const { data: session } = useSession();
  const canSponsor = useAdminCan("activity.edit");
  const isSponsored = Boolean(event.sponsoredAt);
  const [isSponsoring, setIsSponsoring] = useState(false);
  const sponsorBlockedReason = isSponsored
    ? null
    : event.eventType === "private"
      ? "A private activity cannot be featured on the landing page."
      : event.adminStatus !== "approved"
        ? "Only an approved activity can be featured on the landing page."
        : event.cancelledAt || event.deletionStatus
          ? "This activity is cancelled or being deleted."
          : !firstDay
            ? "A teaser has no dates yet, so it cannot be featured."
            : hasEnded
              ? "This activity has ended."
              : null;

  async function toggleSponsored() {
    if (isSponsoring) return;
    setIsSponsoring(true);
    const result = await SetEventSponsoredAction(
      event.eventId,
      !isSponsored,
      session?.user.accessToken ?? "",
      locale,
    );
    setIsSponsoring(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(
      isSponsored ? t("activity.sponsor.removed") : t("activity.sponsor.added"),
    );
  }

  const actions = [
    canManage && {
      key: "edit",
      label: t("activity.edit"),
      href: `/activities/${event.eventId}/edit`,
      icon: <Edit2 size="20" variant="Bulk" color="#2E3237" />,
      disabledReason: editBlockedReason,
    },
    {
      key: "status",
      label: t("activity.actions.status"),
      onSelect: () => setOpenDialog("status"),
      icon: <Status size="20" variant="Bulk" color="#2E3237" />,
    },
    {
      key: "giveaway",
      label: t("activity.actions.giveaway"),
      onSelect: () => setOpenDialog("giveaway"),
      icon: <Gift size="20" variant="Bulk" color="#2E3237" />,
    },
    canManage && {
      key: "fees",
      label: t("activity.actions.fees"),
      onSelect: () => setOpenDialog("fees"),
      icon: <ReceiptDiscount size="20" variant="Bulk" color="#2E3237" />,
    },
    canSponsor && {
      key: "sponsor",
      label: isSponsored
        ? t("activity.actions.unsponsor")
        : t("activity.actions.sponsor"),
      onSelect: toggleSponsored,
      icon: (
        <Star1
          size="20"
          variant={isSponsored ? "Bold" : "Bulk"}
          color={isSponsored ? "#E45B00" : "#2E3237"}
        />
      ),
      disabledReason: isSponsoring
        ? t("activity.sponsor.saving")
        : sponsorBlockedReason,
    },
    {
      key: "refund",
      label: t("activity.actions.refund"),
      onSelect: () => setOpenDialog("refund"),
      icon: <Trash size="20" variant="Bulk" color="#DE0028" />,
      danger: true,
      disabledReason: refundBlockedReason,
    },
  ];

  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">
      <BackButton text={t("activity.back")}></BackButton>
      <div className="flex justify-between items-center gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <h2 className="items-center font-primary leading-12 font-medium text-[2.6rem] min-w-0">
            {event.eventName}
          </h2>
          {isSponsored && (
            <span
              title={t("activity.sponsor.badgeHint")}
              className="shrink-0 py-[0.3rem] px-3 rounded-[30px] bg-[#FFEFE2] text-primary-500 text-[1.1rem] font-bold uppercase leading-6"
            >
              {t("activity.sponsor.badge")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {/* Desktop: the scanner sits between the title and the actions menu,
              so it reads before it. On a phone the header row has no space for
              it, so it gets the pinned footer at the bottom of the page. */}
          {canCheck && (
            <ScanTriggerButton
              className="hidden lg:flex"
              label={t("activity.actions.scan")}
              disabledReason={scanClosedReason}
              onClick={() => setOpenDialog("checking")}
            />
          )}
          {/* One menu at every width — the four pills used to wrap onto a
              second line below a wide desktop. */}
          <ActivityActionsMenu
            actions={actions}
            label={t("activity.actions.title")}
          />
        </div>
      </div>
      <main className="w-full gap-16 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-[15fr_21fr]">
        <div className="flex flex-col gap-8 lg:overflow-y-auto lg:min-h-0">
          <EventImageLightbox
            src={event.eventImageUrl}
            width={400}
            height={298}
            alt={event.eventName}
          />
          <Separator />
          <div className="flex flex-col gap-4">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
              {t("activity.about.title")}
            </span>
            <div
              className="rich-text text-[1.5rem] leading-8 text-neutral-700"
              dangerouslySetInnerHTML={{ __html: event.eventDescription }}
            />
          </div>
          <Separator />
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-8">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
                {t("activity.details.title")}
              </span>
              {/* organizer */}
              <div className="flex items-center justify-between w-full">
                <Link
                  href={`/organisations/${event.organisationId}`}
                  className="flex items-center gap-4"
                >
                  {/* The initial is the FALLBACK, not the default — the raffle,
                      venue and product pages have shown the real logo all
                      along, and this was the one activity page that did not. */}
                  {event.organisation.profileImageUrl ? (
                    <Image
                      src={event.organisation.profileImageUrl}
                      width={56}
                      height={56}
                      alt={event.organisation.organisationName}
                      className="rounded-full w-14 h-14 object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex shrink-0 rounded-full w-14 h-14 bg-black justify-center items-center">
                      <p className="font-medium text-white leading-12 text-[2.2rem] font-primary">
                        {orgInitial}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
                      {event.organisation.organisationName}
                    </span>
                    <span className="font-normal text-[1.3rem] leading-8 text-neutral-600">
                      {followersCount} followers
                    </span>
                  </div>
                </Link>
                <Link href={`/organisations/${event.organisationId}`}>
                  <ButtonBlack className="w-fit">
                    {t("activity.details.button.view")}
                  </ButtonBlack>
                </Link>
              </div>
              <div className="flex justify-between">
                {/* date */}
                <div className="flex items-center gap-2">
                  <div className="w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full">
                    <Calendar2 size="20" color="#737c8a" variant="Bulk" />
                  </div>
                  <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
                    {formattedDate}
                  </span>
                </div>
                {/* time */}
                <div className="flex items-center gap-2">
                  <div className="w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full">
                    <Clock size="20" color="#737c8a" variant="Bulk" />
                  </div>
                  <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
                    {formattedTime}
                  </span>
                </div>
              </div>
              {/* address / Google Meet */}
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full">
                  {isMeetEvent ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  ) : (
                    <Location size="20" color="#737c8a" variant="Bulk" />
                  )}
                </div>
                <span className="font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[29.3rem]">
                  {address}
                </span>
              </div>
            </div>
          </div>
          <div></div>
        </div>

        <div className="lg:overflow-y-auto lg:min-h-0">
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="w-full lg:w-fit mx-auto lg:mx-0 mb-8">
              <TabsTrigger value="performance">
                {t("activity.resume.performance.title")}
              </TabsTrigger>
              <TabsTrigger value="attendance">
                {t("activity.resume.attendance.title")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="performance">
              <ul className="flex flex-col pt-4 gap-8 overflow-y-scroll">
                <li className="flex justify-between">
                  <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                    {t("activity.resume.performance.total")}
                  </span>
                  <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
                    {formatMoney(totalRevenue, event.currency, locale)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                    {t("activity.resume.performance.tickets.sold")}
                  </span>
                  <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
                    {totalSold.toLocaleString()}/
                    {totalCapacity.toLocaleString()}
                  </span>
                </li>
                {/* Only when there are any: it explains why the ticket list is
                    longer than the sold count, and is noise otherwise. */}
                {rewardTickets.length > 0 && (
                  <li className="flex justify-between">
                    <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                      {t("activity.resume.performance.tickets.reward")}
                    </span>
                    <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
                      {rewardTickets.length.toLocaleString()}
                    </span>
                  </li>
                )}
                <li className="flex justify-between">
                  <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                    {t("activity.resume.performance.tickets.left")}
                  </span>
                  <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
                    {ticketsLeft.toLocaleString()}/
                    {totalCapacity.toLocaleString()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                    {t("activity.resume.performance.counter")}
                  </span>
                  <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
                    {countdownText}
                  </span>
                </li>
              </ul>
            </TabsContent>
            <ActivityAttendances event={event} />
          </Tabs>
        </div>
      </main>

      {/*
        MOBILE: THE SCANNER PINNED TO THE BOTTOM OF THE PAGE.

        Outside `main` on purpose. Inside it, the button was the last thing in
        the scroller — reachable only after scrolling past the whole page, and
        flush against the card's edge (the layout card carries `pb-0`), so it
        read as cut off. As a sibling of the scroller it is a footer: it stays
        put while the page moves under it and is visible from the moment the
        page opens. Desktop keeps it in the header beside the actions menu.
      */}
      {canCheck && (
        <div className="lg:hidden shrink-0 bg-white pb-6">
          <ScanTriggerButton
            className="flex w-full"
            label={t("activity.actions.scan")}
            disabledReason={scanClosedReason}
            onClick={() => setOpenDialog("checking")}
          />
        </div>
      )}

      {/*
        Siblings of the menu, never children of it. `hideTrigger` drops each
        dialog's own button — the menu row is the trigger now.
      */}
      <CheckingDialog
        event={event}
        hideTrigger
        open={openDialog === "checking"}
        onOpenChange={(next) => setOpenDialog(next ? "checking" : null)}
      />
      <EventStatusDialog
        event={event}
        hideTrigger
        open={openDialog === "status"}
        onOpenChange={(next) => setOpenDialog(next ? "status" : null)}
      />
      <GiveawayTicketsDialog
        event={event}
        hideTrigger
        open={openDialog === "giveaway"}
        onOpenChange={(next) => setOpenDialog(next ? "giveaway" : null)}
      />
      <FeesHandlerDialog
        kind="event"
        activityId={event.eventId}
        hideTrigger
        open={openDialog === "fees"}
        onOpenChange={(next) => setOpenDialog(next ? "fees" : null)}
      />
      <RefundActivityDialog
        activityKind="event"
        activityId={event.eventId}
        activityName={event.eventName}
        ticketsSold={soldTickets.length}
        disabledReason={refundBlockedReason}
        hideTrigger
        open={openDialog === "refund"}
        onOpenChange={(next) => setOpenDialog(next ? "refund" : null)}
      />
    </div>
  );
}

/**
 * The scanner's button, drawn twice — inline in the header on desktop, as its
 * own full-width row under the title on a phone — and opening the one dialog
 * mounted at the bottom of the page.
 *
 * On desktop it is sized to the actions menu's circle (h-14) beside it rather
 * than to the app's full-height pill, which would stand a head taller than
 * everything else in that row.
 *
 * Neutral grey, the same `bg-neutral-100 / text-neutral-700` the organisation
 * dashboard's grey button uses. Black would read as the page's primary action,
 * which scanning is not — it is one of several things to do from here.
 */
function ScanTriggerButton({
  className,
  label,
  disabledReason,
  onClick,
}: {
  className?: string;
  label: string;
  /** Set outside the scanning window: the button stays, greyed, and says why. */
  disabledReason?: string | null;
  onClick: () => void;
}) {
  return (
    <ButtonNeutral
      disabled={Boolean(disabledReason)}
      title={disabledReason ?? undefined}
      className={`gap-3 lg:h-14 lg:w-fit lg:px-8 lg:py-0 ${
        disabledReason ? "opacity-50 cursor-not-allowed" : ""
      } ${className ?? ""}`}
      onClick={disabledReason ? undefined : onClick}
    >
      <ScannerIcon size="18" color="#737c8a" variant="Bulk" />
      {label}
    </ButtonNeutral>
  );
}
