"use client";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShieldSecurity } from "iconsax-reactjs";
import { usePathname, useRouter } from "@/i18n/navigation";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHeader from "@/components/shared/SettingsHeader";
import FilterPill from "@/components/shared/FilterPill";
import TablePagination from "@/components/shared/TablePagination";
import { Reveal } from "@/components/shared/motion";
import {
  EmptyState,
  RowMore,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_ROW,
  TableFrame,
} from "@/components/shared/DataTable";
import KycStatusPill from "@/components/kyc/KycStatusPill";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";

export interface KycQueueRow {
  verificationId: string;
  organisationId: string;
  organisationType: string;
  idDocumentType: string;
  status: string;
  createdAt: string;
  organisation: { organisationName: string; organisationEmail: string };
}

const FILTERS = ["pending", "approved", "rejected", "all"] as const;

/**
 * Settings → KYC: the verification queue, pending first. Same list language
 * as the Figma pages (status pill, ruled table, row ⋯, numbered pages); a row
 * opens the review page.
 */
export default function KycPageContent({
  rows,
  meta,
  pendingCount,
  status,
}: {
  rows: KycQueueRow[];
  meta: { currentPage: number; lastPage: number; total: number };
  pendingCount: number;
  status: string;
}) {
  const t = useTranslations("Kyc");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function go(next: { status?: string; page?: number }) {
    const params = new URLSearchParams();
    const nextStatus = next.status ?? status;
    if (nextStatus !== "pending") params.set("status", nextStatus);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")} aria-busy={pending}>
      <SettingsHeader
        title={t("title")}
        description={t("pending_count", { count: pendingCount })}
        actions={
          <FilterPill
            label={t("filters.label")}
            value={status}
            defaultValue="pending"
            options={FILTERS.map((key) => ({ value: key, label: t(`filters.${key}`) }))}
            onChange={(v) => go({ status: v })}
            pending={pending}
          />
        }
      />

      <Reveal className="flex flex-col gap-6">
        <TableFrame minWidth="64rem" pending={pending}>
          <thead>
            <tr className="border-b border-neutral-100">
              <th className={TABLE_HEAD}>{t("table.organisation")}</th>
              <th className={TABLE_HEAD}>{t("table.type")}</th>
              <th className={TABLE_HEAD}>{t("table.document")}</th>
              <th className={TABLE_HEAD}>{t("table.submitted")}</th>
              <th className={TABLE_HEAD}>{t("table.status")}</th>
              <th className={TABLE_HEAD}>
                <span className="sr-only">{t("table.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.verificationId}
                className={TABLE_ROW}
                onClick={() => router.push(`/kyc/${row.organisationId}`)}
              >
                <td className={TABLE_CELL}>
                  <span className="flex flex-col max-w-[28rem]">
                    <span className="truncate font-medium">
                      {row.organisation?.organisationName}
                    </span>
                    <span className="truncate text-[1.3rem] text-neutral-600">
                      {row.organisation?.organisationEmail}
                    </span>
                  </span>
                </td>
                <td className={TABLE_CELL}>{t(`types.${row.organisationType}`)}</td>
                <td className={TABLE_CELL}>{t(`documents.${row.idDocumentType}`)}</td>
                <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                  {formatDate(row.createdAt, locale, "local")}
                </td>
                <td className="py-6 pr-4">
                  <KycStatusPill status={row.status} />
                </td>
                <td className="py-6 text-right">
                  <RowMore />
                </td>
              </tr>
            ))}
          </tbody>
        </TableFrame>

        {rows.length === 0 && (
          <EmptyState
            Icon={ShieldSecurity}
            text={status === "pending" ? t("empty_pending") : t("empty")}
          />
        )}

        {meta.lastPage > 1 && (
          <TablePagination
            page={meta.currentPage}
            count={meta.lastPage}
            onChange={(page) => go({ page })}
            prevLabel={t("prev")}
            nextLabel={t("next")}
          />
        )}
      </Reveal>
    </div>
  );
}
