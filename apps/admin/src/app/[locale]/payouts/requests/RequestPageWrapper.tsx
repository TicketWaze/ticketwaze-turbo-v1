/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useState } from "react";
import PayoutsPageTopbar from "../PayoutsPageTopbar";
import { useLocale, useTranslations } from "next-intl";
import { OrganisationWithdrawalRequest } from "@ticketwaze/typescript-config";
import Image from "next/image";
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
import MoneySend from "@ticketwaze/ui/assets/icons/money-send.svg";
import ArrowUp from "@ticketwaze/ui/assets/icons/arrow-up.svg";
import ArrowRight from "@ticketwaze/ui/assets/icons/arrow-right.svg";
import { Link, useRouter } from "@/i18n/navigation";
import PageLoader from "@/components/PageLoader";
import formatDate from "@/lib/FormatDate";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

export default function RequestPageWrapper({
  requests,
  status,
}: {
  requests: OrganisationWithdrawalRequest;
  status: string;
}) {
  const t = useTranslations("Payouts");
  const locale = useLocale();
  const router = useRouter();
  const payoutRequests = requests.data;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [status]);

  function goToPayoutPage(id: string) {
    setIsLoading(true);
    router.push(`/payouts/${id}`);
  }
  function handleStatusChange(value: string) {
    setIsLoading(true);
    router.push(`/payouts/requests?status=${value}`);
  }
  const { meta } = requests;
  const currentPage = requests.meta.currentPage;
  const hasPrev = currentPage > meta.firstPage;
  const hasNext = currentPage < meta.lastPage;

  // Build page number buttons (show up to 5 around current page)
  const getPageNumbers = () => {
    const range: number[] = [];
    const delta = 2;
    const left = Math.max(meta.firstPage, currentPage - delta);
    const right = Math.min(meta.lastPage, currentPage + delta);
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  };
  return (
    <div className="overflow-y-scroll flex flex-col gap-8">
      <PageLoader isLoading={isLoading} />
      <PayoutsPageTopbar
        title={t("payout_request.title")}
        filter={t("filters.period.actual")}
      />
      <div className="flex flex-col gap-8">
        <div className="flex justify-between">
          <div></div>
          <div className="flex gap-4">
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                <SelectGroup>
                  <SelectItem
                    className={"text-[1.4rem] text-deep-100"}
                    value="PENDING"
                  >
                    {t("payout_request.table.request_status.pending")}
                  </SelectItem>
                  <SelectItem
                    className={"text-[1.4rem] text-deep-100"}
                    value="FAILED"
                  >
                    {t("payout_request.table.request_status.failed")}
                  </SelectItem>
                  {/* <SelectItem
                      className={"text-[1.4rem] text-deep-100"}
                      value="SUCCESSFUL"
                    >
                      {t("payout_request.table.request_status.approved")}
                    </SelectItem> */}
                </SelectGroup>
              </SelectContent>
            </Select>
            {/* search */}
            {/* .......... */}
          </div>
        </div>
        <Table id="payouts-table">
          <TableHeader>
            <TableRow>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("payout_request.table.withdrawal_id")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("payout_request.table.bank_name")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("payout_request.table.account_number")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("payout_request.table.amount")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("payout_request.table.request_status.title")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("payout_request.table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {payoutRequests.map((request) => {
              return (
                <TableRow
                  key={request.withdrawalRequestId}
                  onClick={() => goToPayoutPage(request.withdrawalRequestId)}
                  className="cursor-pointer"
                >
                  <TableCell
                    className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                  >
                    <span className={"cursor-pointer"}>
                      {request.organisation.organisationName}
                    </span>
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                    }
                  >
                    <span className={"cursor-pointer"}>{request.bankName}</span>
                  </TableCell>
                  <TableCell
                    className={
                      "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                    }
                  >
                    {request.accountNumber}
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] font-medium leading-8 text-neutral-900"
                    }
                  >
                    <span className={"cursor-pointer py-6"}>
                      {request.organisation.currency === "HTG"
                        ? request.amount
                        : request.usdAmount}{" "}
                      {request.organisation.currency}
                    </span>
                  </TableCell>
                  <TableCell className="py-6">
                    {request.status === "SUCCESSFUL" && (
                      <span
                        className={
                          "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                        }
                      >
                        {t("payout_request.table.request_status.approved")}
                      </span>
                    )}

                    {request.status === "PENDING" && (
                      <span
                        className={
                          "py-[.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EA961C]  px-2 rounded-[30px] bg-[#f5f5f5]"
                        }
                      >
                        {t("payout_request.table.request_status.pending")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                    }
                  >
                    {formatDate(request.createdAt, locale, "local")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {payoutRequests.length === 0 && (
          <div className="flex flex-col w-fit  gap-12 items-center mt-8 self-center">
            <div className="rounded-full bg-neutral-100 p-6 w-fit">
              <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
                <Image
                  src={MoneySend}
                  alt="no payout requests"
                  width={50}
                  height={50}
                />
              </div>
            </div>
            <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
              {t("payout_request.no_request")}
            </p>
          </div>
        )}
        {/* Pagination */}
        {meta.lastPage > 1 && (
          <div className="flex items-center gap-2 pb-4">
            {/* Prev */}
            {hasPrev ? (
              <Link
                href={`/payouts/requests?page=${currentPage - 1}`}
                className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
              </Link>
            ) : (
              <span className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full opacity-30 cursor-not-allowed">
                <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
              </span>
            )}

            {/* First page + ellipsis */}
            {getPageNumbers()[0] > meta.firstPage && (
              <>
                <Link
                  href={`/payouts/requests?page=${meta.firstPage}#payouts-table`}
                  className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  {meta.firstPage}
                </Link>
                {getPageNumbers()[0] > meta.firstPage + 1 && (
                  <span className="text-[1.3rem] text-neutral-400 px-1">…</span>
                )}
              </>
            )}

            {/* Page number links */}
            {getPageNumbers().map((page) => (
              <Link
                key={page}
                href={`/payouts/requests?page=${page}#payouts-table`}
                className={`w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium transition-colors
          ${
            page === currentPage
              ? "text-primary-500 pointer-events-none"
              : "text-neutral-600 hover:text-primary-500"
          }`}
              >
                {page}
              </Link>
            ))}

            {/* Last page + ellipsis */}
            {getPageNumbers().at(-1)! < meta.lastPage && (
              <>
                {getPageNumbers().at(-1)! < meta.lastPage - 1 && (
                  <span className="text-[1.3rem] text-neutral-400 px-1">…</span>
                )}
                <Link
                  href={`/payouts/requests?page=${meta.lastPage}#payouts-table`}
                  className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  {meta.lastPage}
                </Link>
              </>
            )}

            {/* Next */}
            {hasNext ? (
              <Link
                href={`/payouts/requests?page=${currentPage + 1}#payouts-table`}
                className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
              </Link>
            ) : (
              <span className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full opacity-30 cursor-not-allowed">
                <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
