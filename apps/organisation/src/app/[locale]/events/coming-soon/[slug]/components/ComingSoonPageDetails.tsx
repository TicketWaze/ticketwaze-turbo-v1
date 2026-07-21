"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DateTime } from "luxon";
import { Event } from "@ticketwaze/typescript-config";
import TopBar from "@/components/shared/TopBar";
import { LinkPrimary } from "@/components/shared/Links";
import { Calendar } from "iconsax-reactjs";
import ComingSoonMore from "./ComingSoonMore";
import DeletionBanner from "../../../show/[slug]/components/DeletionBanner";
import ReservationsList, { type EventReservation } from "./ReservationsList";

/**
 * The teaser's management screen.
 *
 * Built to read as the same product as `EventPageDetails`: the same top bar,
 * the same divided stat grid, the same overflow menu in the same corner. What
 * changes is what there is to count — a teaser has no revenue, no tickets sold
 * and no countdown, so the grid reports reservations, the expected date and
 * where it stands with review.
 *
 * The sales and attendee tables that sit at the bottom of a real event page
 * have no teaser equivalent yet; they arrive with the event itself, once this
 * row is published.
 */
export default function ComingSoonPageDetails({
  event,
  slug,
  reservations,
}: {
  event: Event;
  slug: string;
  reservations: EventReservation[];
}) {
  const t = useTranslations("Events.coming_soon");
  const locale = useLocale();

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

  // A day, not an instant. Parsing it as a plain ISO date keeps it on the day
  // the organiser typed regardless of the reader's timezone.
  const expectedDate = event.comingSoonDate
    ? DateTime.fromISO(event.comingSoonDate)
        .setLocale(locale)
        .toLocaleString(DateTime.DATE_MED)
    : null;
  // The date wins over the hint wherever both exist — same rule the teaser form
  // enforces by disabling the hint field once a date is set.
  const expected = expectedDate ?? event.comingSoonHint ?? null;

  const statusLabel = t(`stats.status_${event.adminStatus}` as never);

  // Publishing is what this screen is for, so the button stays prominent —
  // except when the row is on its way out, where it would be a dead end.
  const canPublish = !isPendingDeletion && !isDeleted;

  const publishButton = (
    <LinkPrimary
      href={`/events/coming-soon/${slug}/complete`}
      className="gap-4 whitespace-nowrap"
    >
      <Calendar variant="Bulk" color="#ffffff" size={20} />
      {t("publish.cta")}
    </LinkPrimary>
  );

  return (
    <div className={"flex flex-col gap-12 overflow-y-scroll"}>
      <TopBar title={event.eventName}>
        <div className="hidden lg:flex items-center gap-4">
          {canPublish && publishButton}
          <ComingSoonMore
            event={event}
            slug={slug}
            deletionStatus={deletionStatus}
            onDeletionScheduled={(scheduledAt, reason) => {
              setDeletionStatus("pending_deletion");
              setScheduledDeletionAt(scheduledAt);
              setDeletionReason(reason);
            }}
          />
        </div>
      </TopBar>

      {/* count details — same grid treatment as a real event's stat row */}
      <ul
        className={
          "grid grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <li className={"pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.reservations")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {reservations.length}
          </p>
        </li>
        <li className={"pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.expected")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {expected ?? (
              <span className={"font-normal text-[20px] text-neutral-500"}>
                {t("stats.date_unset")}
              </span>
            )}
          </p>
        </li>
        <li className={"pt-8 lg:pt-0 lg:pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("stats.status")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {statusLabel}
          </p>
        </li>
      </ul>

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
            {t("deletion.deleted_notice")}
          </p>
        </div>
      )}

      {/* Same controls, stacked, below the fold on a phone. */}
      <div className="flex lg:hidden items-center w-full gap-8 justify-between">
        {canPublish ? publishButton : <div />}
        <ComingSoonMore
          event={event}
          slug={slug}
          deletionStatus={deletionStatus}
          onDeletionScheduled={(scheduledAt, reason) => {
            setDeletionStatus("pending_deletion");
            setScheduledDeletionAt(scheduledAt);
            setDeletionReason(reason);
          }}
        />
      </div>

      {canPublish && (
        <div className="flex items-start gap-4 rounded-[15px] bg-neutral-100 p-6">
          <p className="text-[1.4rem] leading-7 text-neutral-700">
            {t("publish.explainer")}
          </p>
        </div>
      )}

      {!isDeleted && <ReservationsList reservations={reservations} />}
    </div>
  );
}
