"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Image from "next/image";
import {
  EventRevision,
  RaffleRevision,
} from "@ticketwaze/typescript-config";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ButtonNeutral,
  ButtonPrimary,
  ButtonRed,
} from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  ReviewEventRevisionAction,
  ReviewRaffleRevisionAction,
} from "@/actions/Activity";
import formatDate from "@/lib/FormatDate";
import PageLoader from "@/components/PageLoader";

const MIN_REASON_LENGTH = 10;

/** Matches the status badge on the activities list. */
function ChangedFieldBadge({ label }: { label: string }) {
  return (
    <span className="py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-[#f5f5f5] text-warning">
      {label}
    </span>
  );
}

/**
 * One before/after pair. Reviewing a diff is the whole point of this screen —
 * an admin re-reading a full event description to spot what moved is how a
 * changed lineup gets waved through.
 */
function FieldDiff({
  label,
  before,
  after,
}: {
  label: string;
  before: React.ReactNode;
  after: React.ReactNode;
}) {
  const t = useTranslations("Activities.revisions");
  return (
    <div className="flex flex-col gap-2 py-4 border-b border-neutral-100 last:border-b-0">
      <span className="text-[1.1rem] font-bold uppercase leading-6 text-neutral-600">
        {label}
      </span>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[15px] bg-[#f5f5f5] p-4 flex flex-col gap-1">
          <span className="text-[1.1rem] uppercase text-neutral-600">
            {t("currently_live")}
          </span>
          <div className="text-[1.4rem] leading-8 text-neutral-900 break-words">
            {before || "—"}
          </div>
        </div>
        <div className="rounded-[15px] border border-warning bg-warning/10 p-4 flex flex-col gap-1">
          <span className="text-[1.1rem] uppercase text-warning">
            {t("proposed")}
          </span>
          <div className="text-[1.4rem] leading-8 text-neutral-900 break-words">
            {after || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Prizes ranked in order, because rank is what an entrant was playing for —
 * the same set reordered is a different draw.
 */
function PrizeList({
  prizes,
}: {
  prizes?: { title: string; description?: string | null }[] | null;
}) {
  if (!prizes?.length) return null;
  return (
    <ol className="flex flex-col gap-1">
      {prizes.map((prize, index) => (
        <li key={`${prize.title}-${index}`}>
          {index + 1}. {prize.title}
        </li>
      ))}
    </ol>
  );
}

/** Rich text is stored as HTML; strip it so the diff stays readable. */
function toPlainText(value: string | undefined) {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Which queue a pending edit belongs to. The two have different endpoints. */
type RevisionRef = { kind: "event" | "raffle"; revisionId: string };

/**
 * The approve / reject pair, identical for both kinds.
 *
 * Module scope, not nested in the page component: a component declared inside
 * another is a new type on every render, so React unmounts and remounts it
 * instead of updating it.
 */
function DecisionButtons({
  target,
  isLoading,
  onApprove,
  onReject,
}: {
  target: RevisionRef;
  isLoading: boolean;
  onApprove: (target: RevisionRef) => void;
  onReject: (target: RevisionRef) => void;
}) {
  const t = useTranslations("Activities.revisions");
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ButtonPrimary disabled={isLoading} onClick={() => onApprove(target)}>
        {t("approve")}
      </ButtonPrimary>
      <ButtonNeutral disabled={isLoading} onClick={() => onReject(target)}>
        {t("reject")}
      </ButtonNeutral>
    </div>
  );
}

export default function RevisionsPageContent({
  revisions,
  raffleRevisions = [],
}: {
  revisions: EventRevision[];
  raffleRevisions?: RaffleRevision[];
}) {
  const t = useTranslations("Activities.revisions");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [rejecting, setRejecting] = useState<RevisionRef | null>(null);
  const [reason, setReason] = useState("");

  function handleRejectOpenChange(open: boolean) {
    if (!open) {
      setRejecting(null);
      setReason("");
    }
  }

  async function decide(
    ref: RevisionRef,
    decision: "approve" | "reject",
    rejectionReason?: string,
  ) {
    setIsLoading(true);
    const review =
      ref.kind === "event"
        ? ReviewEventRevisionAction
        : ReviewRaffleRevisionAction;
    const result = await review(
      ref.revisionId,
      decision,
      session?.user.accessToken ?? "",
      locale,
      rejectionReason,
    );
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      decision === "approve" ? t("approved_toast") : t("rejected_toast"),
    );
    // Only the event endpoint reports this; raffles have no calendar entry.
    if ("calendarSyncFailed" in result && result.calendarSyncFailed) {
      toast.warning(t("calendar_warning"));
    }

    handleRejectOpenChange(false);
    router.refresh();
  }

  function approve(target: RevisionRef) {
    decide(target, "approve");
  }

  return (
    <div className="overflow-y-scroll flex flex-col gap-8">
      <PageLoader isLoading={isLoading} />

      <div className="flex flex-col gap-2">
        <h4 className="font-medium font-primary text-[1.8rem] leading-10 text-black">
          {t("title")}
        </h4>
        <p className="text-[1.4rem] leading-8 text-neutral-600 max-w-216">
          {t("subtitle")}
        </p>
      </div>

      {revisions.length === 0 && raffleRevisions.length === 0 && (
        <p className="text-[1.6rem] leading-8 text-neutral-600">{t("empty")}</p>
      )}

      {revisions.length > 0 && raffleRevisions.length > 0 && (
        <h5 className="font-medium font-primary text-[1.5rem] leading-8 text-neutral-900">
          {t("events_heading")}
        </h5>
      )}

      {revisions.map((revision) => {
        const event = revision.event;
        const changed = revision.changedFields ?? [];
        const liveFirstDay = event?.eventDays?.find((d) => d.dayNumber === 1);
        const proposedFirstDay = revision.payload?.eventDays?.find(
          (d) => d.dayNumber === 1,
        );

        return (
          <div
            key={revision.revisionId}
            className="flex flex-col gap-4 rounded-[15px] border border-neutral-100 p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[1.6rem] font-medium leading-8 text-neutral-900">
                  {event?.eventName}
                </span>
                <span className="text-[1.3rem] leading-6 text-neutral-600">
                  {event?.organisation?.organisationName} · {t("submitted")}{" "}
                  {formatDate(revision.createdAt, locale, "local")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {changed.map((field) => (
                  <ChangedFieldBadge
                    key={field}
                    label={t(`fields.${field}` as never)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              {changed.includes("name") && (
                <FieldDiff
                  label={t("fields.name")}
                  before={event?.eventName}
                  after={revision.payload?.eventName}
                />
              )}
              {changed.includes("description") && (
                <FieldDiff
                  label={t("fields.description")}
                  before={toPlainText(event?.eventDescription)}
                  after={toPlainText(revision.payload?.eventDescription)}
                />
              )}
              {changed.includes("venue") && (
                <FieldDiff
                  label={t("fields.venue")}
                  before={event?.address}
                  after={revision.payload?.address}
                />
              )}
              {changed.includes("date") && (
                <FieldDiff
                  label={t("fields.date")}
                  before={
                    liveFirstDay &&
                    `${formatDate(liveFirstDay.eventDate, locale, "local")} · ${liveFirstDay.startTime}`
                  }
                  after={
                    proposedFirstDay &&
                    `${formatDate(proposedFirstDay.eventDate, locale, "local")} · ${proposedFirstDay.startTime}`
                  }
                />
              )}
              {changed.includes("image") && (
                <FieldDiff
                  label={t("fields.image")}
                  before={
                    event?.eventImageUrl && (
                      <Image
                        src={event.eventImageUrl}
                        alt={t("currently_live")}
                        width={220}
                        height={140}
                        className="rounded-[15px] object-cover mt-2"
                      />
                    )
                  }
                  after={
                    revision.imageUrl && (
                      <Image
                        src={revision.imageUrl}
                        alt={t("proposed")}
                        width={220}
                        height={140}
                        className="rounded-[15px] object-cover mt-2"
                      />
                    )
                  }
                />
              )}
            </div>

            <DecisionButtons
              target={{ kind: "event", revisionId: revision.revisionId }}
              isLoading={isLoading}
              onApprove={approve}
              onReject={setRejecting}
            />
          </div>
        );
      })}

      {raffleRevisions.length > 0 && revisions.length > 0 && (
        <h5 className="font-medium font-primary text-[1.5rem] leading-8 text-neutral-900">
          {t("raffles_heading")}
        </h5>
      )}

      {raffleRevisions.map((revision) => {
        const raffle = revision.raffle;
        const changed = revision.changedFields ?? [];

        return (
          <div
            key={revision.revisionId}
            className="flex flex-col gap-4 rounded-[15px] border border-neutral-100 p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[1.6rem] font-medium leading-8 text-neutral-900">
                  {raffle?.title}
                </span>
                <span className="text-[1.3rem] leading-6 text-neutral-600">
                  {t("submitted")}{" "}
                  {formatDate(revision.createdAt, locale, "local")}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {changed.map((field) => (
                  <ChangedFieldBadge
                    key={field}
                    label={t(`fields.${field}` as never)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              {changed.includes("name") && (
                <FieldDiff
                  label={t("fields.name")}
                  before={raffle?.title}
                  after={revision.payload?.title}
                />
              )}
              {changed.includes("description") && (
                <FieldDiff
                  label={t("fields.description")}
                  before={toPlainText(raffle?.description)}
                  after={toPlainText(revision.payload?.description)}
                />
              )}
              {changed.includes("prizes") && (
                <FieldDiff
                  label={t("fields.prizes")}
                  before={<PrizeList prizes={raffle?.prizes} />}
                  after={<PrizeList prizes={revision.payload?.prizes} />}
                />
              )}
              {changed.includes("date") && (
                <FieldDiff
                  label={t("fields.draw_date")}
                  before={raffle?.drawAt && formatDate(raffle.drawAt, locale, "local")}
                  after={
                    revision.payload?.drawAt &&
                    formatDate(revision.payload.drawAt, locale, "local")
                  }
                />
              )}
              {changed.includes("sales_window") && (
                <FieldDiff
                  label={t("fields.sales_close")}
                  before={
                    raffle?.salesEndAt && formatDate(raffle.salesEndAt, locale, "local")
                  }
                  after={
                    revision.payload?.salesEndAt &&
                    formatDate(revision.payload.salesEndAt, locale, "local")
                  }
                />
              )}
              {changed.includes("image") && (
                <FieldDiff
                  label={t("fields.image")}
                  before={
                    raffle?.coverImageUrl && (
                      <Image
                        src={raffle.coverImageUrl}
                        alt={t("currently_live")}
                        width={220}
                        height={140}
                        className="rounded-[15px] object-cover mt-2"
                      />
                    )
                  }
                  after={
                    revision.payload?.coverImageUrl && (
                      <Image
                        src={revision.payload.coverImageUrl}
                        alt={t("proposed")}
                        width={220}
                        height={140}
                        className="rounded-[15px] object-cover mt-2"
                      />
                    )
                  }
                />
              )}
            </div>

            <DecisionButtons
              target={{ kind: "raffle", revisionId: revision.revisionId }}
              isLoading={isLoading}
              onApprove={approve}
              onReject={setRejecting}
            />
          </div>
        );
      })}

      {/* Rejection takes a reason, the same way every other consequential admin
          decision does — see RefundActivityDialog and EventStatusDialog. */}
      <Dialog open={rejecting !== null} onOpenChange={handleRejectOpenChange}>
        <DialogContent className="flex flex-col gap-6">
          <DialogTitle className="text-[1.8rem] leading-10 text-deep-100">
            {t("reject_title")}
          </DialogTitle>
          <p className="text-[1.4rem] leading-8 text-neutral-600">
            {t("reject_description")}
          </p>
          {/* Same markup as RefundActivityDialog's reason field — the other
              place an admin has to justify a decision. */}
          <div className="flex flex-col gap-2">
            <label className="text-[1.4rem] font-medium text-black">
              {t("reason_label")} <span className="text-[#E53935]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reason_placeholder")}
              rows={4}
              autoFocus
              className="w-full resize-none rounded-2xl border-2 border-neutral-200 px-4 py-3 text-[1.4rem] leading-7 text-black placeholder:text-neutral-400 focus:border-[#E53935] focus:outline-none transition-colors"
            />
          </div>
          <DialogFooter className="flex items-center gap-4">
            <ButtonNeutral
              disabled={isLoading}
              onClick={() => handleRejectOpenChange(false)}
            >
              {t("cancel")}
            </ButtonNeutral>
            <ButtonRed
              disabled={isLoading || reason.trim().length < MIN_REASON_LENGTH}
              onClick={() =>
                rejecting && decide(rejecting, "reject", reason.trim())
              }
            >
              {isLoading ? <LoadingCircleSmall /> : t("confirm_rejection")}
            </ButtonRed>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
