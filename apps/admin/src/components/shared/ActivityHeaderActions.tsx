"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import useAdminCan from "@/lib/useAdminCan";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";
import SuspendActivityDialog, { type ActivityKind } from "./SuspendActivityDialog";

// Figma 4330:88714 / 88715: 35px pills, red-tinted Suspend, solid orange Edit.
const pill =
  "h-[3.5rem] px-4 sm:px-8 rounded-[10rem] inline-flex items-center justify-center whitespace-nowrap font-medium cursor-pointer transition-colors flex-1 lg:flex-none min-w-0";

/**
 * The activity page header's right side, shared by the event, raffle, sale
 * and restaurant pages: Figma's "Suspend" (or "Reactivate") and "Edit", then
 * whatever the page adds after them (`children`: the scanner, the ⋯ menu).
 *
 * Suspend needs activity.edit; Edit needs activity.manage, like the old menu
 * row. An activity hidden only because its ORGANISATION is suspended gets no
 * Reactivate — that is lifted from the organisation's page.
 */
export default function ActivityHeaderActions({
  kind,
  activityId,
  editHref,
  editLabel,
  editDisabledReason,
  suspendedAt,
  children,
}: {
  kind: ActivityKind;
  activityId: string;
  editHref: string;
  editLabel: string;
  editDisabledReason?: string | null;
  suspendedAt: string | null | undefined;
  children?: React.ReactNode;
}) {
  const t = useTranslations("ActivitiesList");
  const canSuspend = useAdminCan("activity.edit");
  const canManage = useAdminCan("activity.manage");
  const [open, setOpen] = useState(false);
  const suspended = Boolean(suspendedAt);

  return (
    // On a phone: one full-width row, the pills share it and the page's extras
    // (scanner on desktop, ⋯) come after them, as in Figma.
    <div className="flex items-center gap-[1rem] w-full lg:w-auto justify-end shrink-0">
      {canSuspend &&
        (suspended ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(pill, "bg-success/10 border-[1.5px] border-success text-success text-[1.3rem] sm:text-[1.5rem] hover:bg-success/15")}
          >
            {t("reactivate.trigger")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(pill, "bg-[#FCE5EA] border-[1.5px] border-failure text-failure text-[1.3rem] sm:text-[1.5rem] hover:bg-[#F9D3DC]")}
          >
            {t("suspend.trigger")}
          </button>
        ))}
      {canManage &&
        (editDisabledReason ? (
          <span
            title={editDisabledReason}
            className={cn(pill, "bg-primary-500 border-2 border-primary-500 text-white text-[1.4rem] opacity-50 cursor-not-allowed")}
          >
            {editLabel}
          </span>
        ) : (
          <Link
            href={editHref}
            className={cn(pill, "bg-primary-500 border-2 border-primary-500 text-white text-[1.4rem] hover:bg-primary-600")}
          >
            {editLabel}
          </Link>
        ))}
      {children}
      {canSuspend && (
        <SuspendActivityDialog
          kind={kind}
          activityId={activityId}
          suspended={suspended}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </div>
  );
}

/**
 * Why the activity is off the platform: its own suspension (with the reason
 * and date) or its organisation's. Nothing when neither applies.
 */
export function ActivitySuspensionNotice({
  suspendedAt,
  reason,
  organisationSuspended,
}: {
  suspendedAt: string | null | undefined;
  reason: string | null | undefined;
  organisationSuspended?: boolean;
}) {
  const t = useTranslations("ActivitiesList.notice");
  const locale = useLocale();
  if (!suspendedAt && !organisationSuspended) return null;
  return (
    <div className="flex flex-col gap-2 rounded-[15px] border border-failure/30 bg-failure/5 p-6">
      <span className="text-[1.4rem] font-medium text-failure">
        {suspendedAt
          ? t("title", { date: formatDate(suspendedAt, locale, "local") })
          : t("organisation")}
      </span>
      {suspendedAt && reason && (
        <p className="text-[1.4rem] leading-8 text-neutral-700">
          <span className="text-neutral-600">{t("reason")}: </span>
          {reason}
        </p>
      )}
      <p className="text-[1.3rem] leading-7 text-neutral-600">{t("body")}</p>
    </div>
  );
}
