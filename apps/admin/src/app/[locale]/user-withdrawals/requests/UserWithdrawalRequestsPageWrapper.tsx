"use client";
import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { UserWithdrawalRequest, UserWithdrawalRequestsPage } from "@ticketwaze/typescript-config";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import PageLoader from "@/components/PageLoader";
import formatDate from "@/lib/FormatDate";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

function StatusBadge({
  status,
  t,
}: {
  status: UserWithdrawalRequest["status"];
  t: ReturnType<typeof useTranslations>;
}) {
  if (status === "ACCEPTED") {
    return (
      <span className="py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E] px-2 rounded-[30px] bg-[#f5f5f5] whitespace-nowrap">
        {t("status_accepted")}
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C] px-2 rounded-[30px] bg-[#f5f5f5] whitespace-nowrap">
        {t("status_pending")}
      </span>
    );
  }
  return (
    <span className="py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-failure px-2 rounded-[30px] bg-failure/20 whitespace-nowrap">
      {t("status_rejected")}
    </span>
  );
}

export default function UserWithdrawalRequestsPageWrapper({
  requests,
  status,
}: {
  requests: UserWithdrawalRequestsPage;
  status: string;
}) {
  const t = useTranslations("UserWithdrawals.list");
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [status]);

  const { meta, data: requestList } = requests;
  const currentPage = meta.currentPage;
  const hasPrev = currentPage > meta.firstPage;
  const hasNext = currentPage < meta.lastPage;

  function getPageNumbers() {
    const range: number[] = [];
    const delta = 2;
    const left = Math.max(meta.firstPage, currentPage - delta);
    const right = Math.min(meta.lastPage, currentPage + delta);
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  }

  function handleStatusChange(value: string) {
    setIsLoading(true);
    router.push(`/user-withdrawals/requests?status=${value}`);
  }

  function goToRequest(id: string) {
    setIsLoading(true);
    router.push(`/user-withdrawals/${id}`);
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      <PageLoader isLoading={isLoading} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-primary font-medium text-[2rem] lg:text-[2.2rem] leading-10 text-black">
          {t("title")}
        </h1>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8 self-start sm:self-auto">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-100 text-[1.4rem]">
            <SelectGroup>
              <SelectItem className="text-[1.4rem] text-deep-100" value="PENDING">
                {t("filter.pending")}
              </SelectItem>
              <SelectItem className="text-[1.4rem] text-deep-100" value="ACCEPTED">
                {t("filter.accepted")}
              </SelectItem>
              <SelectItem className="text-[1.4rem] text-deep-100" value="REJECTED">
                {t("filter.rejected")}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[12px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase whitespace-nowrap">
                {t("table.name")}
              </TableHead>
              <TableHead className="font-bold hidden md:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase whitespace-nowrap">
                {t("table.reference")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase whitespace-nowrap">
                {t("table.method")}
              </TableHead>
              <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase whitespace-nowrap">
                {t("table.amount")}
              </TableHead>
              <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase whitespace-nowrap">
                {t("table.status")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase whitespace-nowrap">
                {t("table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requestList.map((req) => (
              <TableRow
                key={req.userWithdrawalRequestId}
                onClick={() => goToRequest(req.userWithdrawalRequestId)}
                className="cursor-pointer"
              >
                <TableCell className="text-[1.4rem] py-5 leading-8 text-neutral-900 font-medium">
                  {req.user ? `${req.user.firstName} ${req.user.lastName}` : "—"}
                  <div className="text-[1.2rem] text-neutral-400 leading-5 mt-[2px] md:hidden">
                    {(req.reference ?? req.userWithdrawalRequestId).slice(0, 16)}
                  </div>
                </TableCell>
                <TableCell className="text-[1.3rem] py-5 hidden md:table-cell leading-8 text-neutral-500 font-mono">
                  {(req.reference ?? req.userWithdrawalRequestId).slice(0, 16)}
                </TableCell>
                <TableCell className="text-[1.4rem] py-5 hidden lg:table-cell leading-8 text-neutral-900 capitalize">
                  {req.accountType === "bank" ? t("method_bank") : t("method_moncash")}
                </TableCell>
                <TableCell className="text-[1.4rem] py-5 font-medium leading-8 text-neutral-900 whitespace-nowrap">
                  {Number(req.amount).toLocaleString()} {req.currency ?? "HTG"}
                </TableCell>
                <TableCell className="py-5">
                  <StatusBadge status={req.status} t={t} />
                </TableCell>
                <TableCell className="hidden lg:table-cell text-[1.4rem] leading-8 text-neutral-500 whitespace-nowrap">
                  {formatDate(req.createdAt, locale, "local")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Empty state */}
      {requestList.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-neutral-400 text-[1.5rem]">
          {t("empty", { status: status.toLowerCase() })}
        </div>
      )}

      {/* Pagination */}
      {meta.lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 pb-4 flex-wrap">
          <button
            disabled={!hasPrev}
            onClick={() =>
              router.push(`/user-withdrawals/requests?status=${status}&page=${currentPage - 1}`)
            }
            className="p-2 rounded-full bg-neutral-100 disabled:opacity-30"
          >
            <ArrowLeft2 size="16" color="#0d0d0d" />
          </button>
          {getPageNumbers().map((p) => (
            <button
              key={p}
              onClick={() =>
                router.push(`/user-withdrawals/requests?status=${status}&page=${p}`)
              }
              className={`w-9 h-9 rounded-full text-[1.4rem] font-medium ${
                p === currentPage ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-700"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={!hasNext}
            onClick={() =>
              router.push(`/user-withdrawals/requests?status=${status}&page=${currentPage + 1}`)
            }
            className="p-2 rounded-full bg-neutral-100 disabled:opacity-30"
          >
            <ArrowRight2 size="16" color="#0d0d0d" />
          </button>
        </div>
      )}
    </div>
  );
}
