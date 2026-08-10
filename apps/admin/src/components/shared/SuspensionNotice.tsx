"use client";

import { useLocale, useTranslations } from "next-intl";
import { AccountSuspension } from "@ticketwaze/typescript-config";
import formatDate from "@/lib/FormatDate";

/**
 * The active-suspension callout, shared by the attendee and organisation
 * profiles because a suspension reads the same either way.
 *
 * Red where the pending-deletion notice is amber: this is not a countdown to
 * something, it is a sanction already in force.
 *
 * It answers the three questions an admin picking up an appeal actually has —
 * why, when, and who decided — so the case can be reviewed without going to the
 * database. Accounts suspended before the audit columns existed have no date or
 * author to show, and those rows say nothing rather than guess.
 */
export default function SuspensionNotice({
  suspension,
}: {
  suspension: AccountSuspension;
}) {
  const t = useTranslations("Suspension.notice");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-2 rounded-[15px] border border-[#E53935]/30 bg-[#FDECEA] p-6">
      <span className="text-[1.4rem] font-medium text-[#B3261E]">
        {t("title")}
      </span>
      {suspension.suspendedAt && (
        <p className="text-[1.4rem] leading-8 text-neutral-700">
          <span className="text-neutral-600">{t("since")}: </span>
          {formatDate(suspension.suspendedAt, locale, "local")}
        </p>
      )}
      {suspension.suspendedByEmail && (
        <p className="text-[1.4rem] leading-8 text-neutral-700">
          <span className="text-neutral-600">{t("by")}: </span>
          {suspension.suspendedByEmail}
        </p>
      )}
      {suspension.reason && (
        <p className="text-[1.4rem] leading-8 text-neutral-700">
          <span className="text-neutral-600">{t("reason")}: </span>
          {suspension.reason}
        </p>
      )}
    </div>
  );
}
