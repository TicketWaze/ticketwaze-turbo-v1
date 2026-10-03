"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ShieldSecurity } from "iconsax-reactjs";
import AdminLayout from "@/components/Layouts/AdminLayout";
import PageTitle, { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import PageLoader from "@/components/PageLoader";
import KycStatusPill from "@/components/kyc/KycStatusPill";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  // Pending while the server renders the next filter/page.
  const [isLoading, startTransition] = useTransition();

  function go(next: { status?: string; page?: number }) {
    const params = new URLSearchParams({ status: next.status ?? status });
    if (next.page && next.page > 1) params.set("page", String(next.page));
    startTransition(() => router.push(`/kyc?${params.toString()}`));
  }

  const head =
    "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase";

  return (
    <AdminLayout>
      <PageLoader isLoading={isLoading} />
      <div className={PAGE_SCROLLER}>
        <PageTitle>{t("title")}</PageTitle>
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
          <p className="text-[1.5rem] text-neutral-700">
            {t("pending_count", { count: pendingCount })}
          </p>
          <div className="flex gap-3 flex-wrap">
            {FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => go({ status: key })}
                className={cn(
                  "px-6 py-[0.8rem] rounded-[3rem] text-[1.4rem] leading-8 transition-colors cursor-pointer",
                  status === key
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                )}
              >
                {t(`filters.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={head}>{t("table.organisation")}</TableHead>
              <TableHead className={cn(head, "hidden lg:table-cell")}>
                {t("table.type")}
              </TableHead>
              <TableHead className={cn(head, "hidden lg:table-cell")}>
                {t("table.document")}
              </TableHead>
              <TableHead className={head}>{t("table.submitted")}</TableHead>
              <TableHead className={head}>{t("table.status")}</TableHead>
            </TableRow>
          </TableHeader>
          {rows.length > 0 && (
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.verificationId}
                  className="cursor-pointer"
                  onClick={() => router.push(`/kyc/${row.organisationId}`)}
                >
                  <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                    <span className="flex flex-col max-w-[16rem] lg:max-w-[28rem]">
                      <span className="truncate">
                        {row.organisation?.organisationName}
                      </span>
                      <span className="truncate text-[1.3rem] text-neutral-500">
                        {row.organisation?.organisationEmail}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-[1.5rem] hidden lg:table-cell text-neutral-900">
                    {t(`types.${row.organisationType}`)}
                  </TableCell>
                  <TableCell className="text-[1.5rem] hidden lg:table-cell text-neutral-900">
                    {t(`documents.${row.idDocumentType}`)}
                  </TableCell>
                  <TableCell className="text-[1.5rem] text-neutral-900">
                    {formatDate(row.createdAt, locale, "local")}
                  </TableCell>
                  <TableCell>
                    <KycStatusPill status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>

        {rows.length === 0 && (
          <div className="flex flex-col w-fit gap-12 items-center mt-8 self-center">
            <div className="rounded-full bg-neutral-100 p-6 w-fit">
              <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
                <ShieldSecurity size={50} variant="Bulk" color="#737C8A" />
              </div>
            </div>
            <p className="max-w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
              {t("empty")}
            </p>
          </div>
        )}

        {meta.lastPage > 1 && (
          <div className="flex items-center justify-center gap-4 pb-8">
            {Array.from({ length: meta.lastPage }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => go({ page: p })}
                className={cn(
                  "w-[3.6rem] h-[3.6rem] rounded-full text-[1.4rem] cursor-pointer",
                  p === meta.currentPage
                    ? "bg-primary-500 text-white"
                    : "bg-neutral-100 text-neutral-700",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
