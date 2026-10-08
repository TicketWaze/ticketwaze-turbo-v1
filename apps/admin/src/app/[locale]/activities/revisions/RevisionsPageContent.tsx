"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Image from "next/image";
import { ArrowRight2, Edit2 } from "iconsax-reactjs";
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
import { ButtonNeutral, ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHeader from "@/components/shared/SettingsHeader";
import FilterPill from "@/components/shared/FilterPill";
import { Reveal } from "@/components/shared/motion";
import {
  Badge,
  CARD,
  EmptyState,
  HEADER_PILL,
  PILL_TONE,
} from "@/components/shared/DataTable";
import {
  ReviewEventRevisionAction,
  ReviewRaffleRevisionAction,
} from "@/actions/Activity";
import { Link } from "@/i18n/navigation";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";

const MIN_REASON_LENGTH = 10;

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
    <div className="flex flex-col gap-3 py-6 border-b border-neutral-100 last:border-b-0">
      <span className="text-[1.1rem] font-bold uppercase leading-6 text-deep-100">
        {label}
      </span>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[1rem] bg-neutral-100 p-5 flex flex-col gap-2">
          <span className="text-[1.1rem] font-bold uppercase leading-6 text-neutral-600">
            {t("currently_live")}
          </span>
          <div className="text-[1.4rem] leading-8 text-deep-100 break-words">
            {before || "—"}
          </div>
        </div>
        <div className="rounded-[1rem] border border-primary-200 bg-primary-50 p-5 flex flex-col gap-2">
          <span className="text-[1.1rem] font-bold uppercase leading-6 text-primary-500">
            {t("proposed")}
          </span>
          <div className="text-[1.4rem] leading-8 text-deep-100 break-words">
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

function DiffImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={220}
      height={140}
      className="rounded-[1rem] object-cover border border-neutral-100"
    />
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
 * One pending edit: the activity, who submitted it and when, the changed
 * fields as badges, the diffs, then Reject / Approve.
 *
 * Module scope, not nested in the page component: a component declared inside
 * another is a new type on every render, so React unmounts and remounts it
 * instead of updating it.
 */
function RevisionCard({
  target,
  title,
  subtitle,
  href,
  typeLabel,
  changed,
  isLoading,
  onApprove,
  onReject,
  delay,
  children,
}: {
  target: RevisionRef;
  title?: string;
  subtitle: string;
  href: string;
  typeLabel: string;
  changed: string[];
  isLoading: boolean;
  onApprove: (target: RevisionRef) => void;
  onReject: (target: RevisionRef) => void;
  delay: number;
  children: React.ReactNode;
}) {
  const t = useTranslations("Activities.revisions");
  return (
    <Reveal delay={delay} className={cn(CARD, "flex flex-col gap-2")}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-2">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={href}
              className="group inline-flex items-center gap-2 font-primary font-medium text-[1.8rem] leading-10 text-black hover:text-primary-500 transition-colors min-w-0"
            >
              <span className="truncate">{title}</span>
              <ArrowRight2
                size="16"
                color="currentColor"
                className="shrink-0 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Badge tone="primary">{typeLabel}</Badge>
          </div>
          <span className="text-[1.4rem] leading-8 text-neutral-600">{subtitle}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end lg:max-w-[40%]">
          {changed.map((field) => (
            <Badge key={field} tone="warning">
              {t(`fields.${field}` as never)}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col">{children}</div>

      <div className="flex items-center gap-[1rem] pt-4 lg:justify-end">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onReject(target)}
          className={cn(HEADER_PILL, PILL_TONE.danger)}
        >
          {t("reject")}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onApprove(target)}
          className={cn(HEADER_PILL, PILL_TONE.primary)}
        >
          {t("approve")}
        </button>
      </div>
    </Reveal>
  );
}

/**
 * Settings → Pending Edits: changes organisers made to live events and
 * raffles, held until an admin approves them. Oldest first, as the API sends
 * them; the type pill narrows to one kind.
 */
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
  const [kind, setKind] = useState<"all" | "event" | "raffle">("all");

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

  const total = revisions.length + raffleRevisions.length;
  const showEvents = kind !== "raffle";
  const showRaffles = kind !== "event";
  const shown = (showEvents ? revisions.length : 0) + (showRaffles ? raffleRevisions.length : 0);
  let index = 0;
  const nextDelay = () => Math.min(index++ * 0.05, 0.3);

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")} aria-busy={isLoading}>
      <SettingsHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          total > 0 && (
            <FilterPill
              label={t("filter_label")}
              value={kind}
              defaultValue="all"
              placeholder={t("filter_all", { count: total })}
              options={[
                { value: "all", label: t("filter_all", { count: total }) },
                { value: "event", label: t("filter_events", { count: revisions.length }) },
                { value: "raffle", label: t("filter_raffles", { count: raffleRevisions.length }) },
              ]}
              onChange={(v) => setKind(v as typeof kind)}
            />
          )
        }
      />

      {shown === 0 && <EmptyState Icon={Edit2} text={t("empty")} />}

      <div className="flex flex-col gap-8 pb-10">
        {showEvents &&
          revisions.map((revision) => {
            const event = revision.event;
            const changed = revision.changedFields ?? [];
            const liveFirstDay = event?.eventDays?.find((d) => d.dayNumber === 1);
            const proposedFirstDay = revision.payload?.eventDays?.find(
              (d) => d.dayNumber === 1,
            );

            return (
              <RevisionCard
                key={revision.revisionId}
                target={{ kind: "event", revisionId: revision.revisionId }}
                title={event?.eventName}
                subtitle={`${event?.organisation?.organisationName ?? ""} · ${t("submitted")} ${formatDate(revision.createdAt, locale, "local")}`}
                href={`/activities/${revision.eventId}`}
                typeLabel={t("type_event")}
                changed={changed}
                isLoading={isLoading}
                onApprove={approve}
                onReject={setRejecting}
                delay={nextDelay()}
              >
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
                    before={<DiffImage src={event?.eventImageUrl} alt={t("currently_live")} />}
                    after={<DiffImage src={revision.imageUrl} alt={t("proposed")} />}
                  />
                )}
              </RevisionCard>
            );
          })}

        {showRaffles &&
          raffleRevisions.map((revision) => {
            const raffle = revision.raffle;
            const changed = revision.changedFields ?? [];

            return (
              <RevisionCard
                key={revision.revisionId}
                target={{ kind: "raffle", revisionId: revision.revisionId }}
                title={raffle?.title}
                subtitle={`${t("submitted")} ${formatDate(revision.createdAt, locale, "local")}`}
                href={`/activities/raffle/${revision.raffleId}`}
                typeLabel={t("type_raffle")}
                changed={changed}
                isLoading={isLoading}
                onApprove={approve}
                onReject={setRejecting}
                delay={nextDelay()}
              >
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
                    before={<DiffImage src={raffle?.coverImageUrl} alt={t("currently_live")} />}
                    after={
                      <DiffImage src={revision.payload?.coverImageUrl} alt={t("proposed")} />
                    }
                  />
                )}
              </RevisionCard>
            );
          })}
      </div>

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
