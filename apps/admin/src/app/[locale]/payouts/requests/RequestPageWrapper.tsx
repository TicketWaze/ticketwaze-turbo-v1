/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { ReactNode, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Link, useRouter } from "@/i18n/navigation";
import PageLoader from "@/components/PageLoader";
import formatDate from "@/lib/FormatDate";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";
import {
  UserWithdrawalRequest,
  WithdrawalRequest,
} from "@ticketwaze/typescript-config";

type Tab = "organisation" | "user";

type Meta = {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
};

type Paginated = {
  data: (WithdrawalRequest | UserWithdrawalRequest)[];
  meta: Meta;
};

const badgeBase =
  "py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px]";

export default function RequestPageWrapper({
  scope,
  tab,
  requests,
  status,
}: {
  scope: "requests" | "history";
  tab: Tab;
  requests: Paginated;
  status: string;
}) {
  const t = useTranslations("Payouts");
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [tab, status, requests]);

  function nav(path: string) {
    setIsLoading(true);
    router.push(path);
  }
  function handleTabChange(value: string) {
    // Switching tab refetches just that tab (status resets, page 1).
    nav(`/payouts/requests?scope=${scope}&tab=${value}`);
  }
  function handleStatusChange(value: string) {
    nav(`/payouts/requests?scope=${scope}&tab=${tab}&status=${value}`);
  }
  const pageHref = (p: number) =>
    `/payouts/requests?scope=${scope}&tab=${tab}&status=${status}&page=${p}`;

  const { meta } = requests;
  const currentPage = meta.currentPage;
  const hasPrev = currentPage > meta.firstPage;
  const hasNext = currentPage < meta.lastPage;
  const getPageNumbers = () => {
    const range: number[] = [];
    const delta = 2;
    const left = Math.max(meta.firstPage, currentPage - delta);
    const right = Math.min(meta.lastPage, currentPage + delta);
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  };

  // Requests are all pending, so the filter only applies to History (processed
  // payouts). First entry is "all statuses"; the rest are tab-specific.
  const showFilter = scope === "history";
  const statusOptions: { value: string; label: string }[] = [
    { value: "ALL", label: t("filters.status") },
    ...(tab === "user"
      ? [
          { value: "ACCEPTED", label: t("payout_request.table.request_status.approved") },
          { value: "REJECTED", label: t("payout_request.table.request_status.rejected") },
        ]
      : [
          { value: "SUCCESSFUL", label: t("payout_request.table.request_status.approved") },
          { value: "FAILED", label: t("payout_request.table.request_status.failed") },
        ]),
  ];

  return (
    <div className="overflow-y-scroll flex flex-col gap-8">
      <PageLoader isLoading={isLoading} />
      <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
        {scope === "history"
          ? t("payout_history.title")
          : t("payout_request.title")}
      </h3>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <TabsList className="w-full lg:w-fit">
            <TabsTrigger value="organisation">
              {t("tabs.organisation")}
            </TabsTrigger>
            <TabsTrigger value="user">{t("tabs.user")}</TabsTrigger>
          </TabsList>
          {showFilter && (
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                <SelectGroup>
                  {statusOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      className={"text-[1.4rem] text-deep-100"}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </Tabs>

      <Table id="payouts-table">
        <TableHeader>
          <TableRow>
            <Th>{t("payout_request.table.name")}</Th>
            <Th className="hidden lg:table-cell">
              {t("payout_request.table.bank_name")}
            </Th>
            <Th className="hidden lg:table-cell">
              {t("payout_request.table.account_number")}
            </Th>
            <Th>{t("payout_request.table.amount")}</Th>
            <Th>{t("payout_request.table.request_status.title")}</Th>
            <Th className="hidden lg:table-cell">
              {t("payout_request.table.date")}
            </Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tab === "organisation"
            ? (requests.data as WithdrawalRequest[]).map((request) => (
                <TableRow
                  key={request.withdrawalRequestId}
                  onClick={() => nav(`/payouts/${request.withdrawalRequestId}`)}
                  className="cursor-pointer"
                >
                  <Td>{request.organisation.organisationName}</Td>
                  <Td className="hidden lg:table-cell">{request.bankName}</Td>
                  <Td className="hidden lg:table-cell">
                    {request.accountNumber}
                  </Td>
                  <Td className="font-medium">
                    {request.organisation.currency === "HTG"
                      ? request.amount
                      : request.usdAmount}{" "}
                    {request.organisation.currency}
                  </Td>
                  <Td>
                    <OrgStatusBadge status={request.status} t={t} />
                  </Td>
                  <Td className="hidden lg:table-cell">
                    {formatDate(request.createdAt, locale, "local")}
                  </Td>
                </TableRow>
              ))
            : (requests.data as UserWithdrawalRequest[]).map((request) => (
                <TableRow
                  key={request.userWithdrawalRequestId}
                  onClick={() =>
                    nav(`/user-withdrawals/${request.userWithdrawalRequestId}`)
                  }
                  className="cursor-pointer"
                >
                  <Td>
                    {request.user
                      ? `${request.user.firstName} ${request.user.lastName}`
                      : request.accountName}
                  </Td>
                  <Td className="hidden lg:table-cell">
                    {request.bankName ?? request.accountType}
                  </Td>
                  <Td className="hidden lg:table-cell">
                    {request.accountNumber}
                  </Td>
                  <Td className="font-medium">
                    {request.amount} {request.currency}
                  </Td>
                  <Td>
                    <UserStatusBadge status={request.status} t={t} />
                  </Td>
                  <Td className="hidden lg:table-cell">
                    {formatDate(request.createdAt, locale, "local")}
                  </Td>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {requests.data.length === 0 && (
        <div className="flex flex-col w-fit gap-12 items-center mt-8 self-center">
          <div className="rounded-full bg-neutral-100 p-6 w-fit">
            <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
              <Image src={MoneySend} alt="no requests" width={50} height={50} />
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
          {hasPrev ? (
            <Link
              href={pageHref(currentPage - 1)}
              className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
            </Link>
          ) : (
            <span className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full opacity-30 cursor-not-allowed">
              <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
            </span>
          )}

          {getPageNumbers()[0] > meta.firstPage && (
            <>
              <Link
                href={pageHref(meta.firstPage)}
                className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                {meta.firstPage}
              </Link>
              {getPageNumbers()[0] > meta.firstPage + 1 && (
                <span className="text-[1.3rem] text-neutral-400 px-1">…</span>
              )}
            </>
          )}

          {getPageNumbers().map((page) => (
            <Link
              key={page}
              href={pageHref(page)}
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

          {getPageNumbers().at(-1)! < meta.lastPage && (
            <>
              {getPageNumbers().at(-1)! < meta.lastPage - 1 && (
                <span className="text-[1.3rem] text-neutral-400 px-1">…</span>
              )}
              <Link
                href={pageHref(meta.lastPage)}
                className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                {meta.lastPage}
              </Link>
            </>
          )}

          {hasNext ? (
            <Link
              href={pageHref(currentPage + 1)}
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
  );
}

function Th({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableHead
      className={`font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase ${className}`}
    >
      {children}
    </TableHead>
  );
}

function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableCell
      className={`text-[1.5rem] py-6 leading-8 text-neutral-900 ${className}`}
    >
      {children}
    </TableCell>
  );
}

function OrgStatusBadge({
  status,
  t,
}: {
  status: WithdrawalRequest["status"];
  t: ReturnType<typeof useTranslations>;
}) {
  if (status === "SUCCESSFUL")
    return (
      <span className={`${badgeBase} text-[#349C2E] bg-[#f5f5f5]`}>
        {t("payout_request.table.request_status.approved")}
      </span>
    );
  if (status === "FAILED")
    return (
      <span className={`${badgeBase} text-failure bg-failure/20`}>
        {t("payout_request.table.request_status.failed")}
      </span>
    );
  return (
    <span className={`${badgeBase} text-[#EA961C] bg-[#f5f5f5]`}>
      {t("payout_request.table.request_status.pending")}
    </span>
  );
}

function UserStatusBadge({
  status,
  t,
}: {
  status: UserWithdrawalRequest["status"];
  t: ReturnType<typeof useTranslations>;
}) {
  if (status === "ACCEPTED")
    return (
      <span className={`${badgeBase} text-[#349C2E] bg-[#f5f5f5]`}>
        {t("payout_request.table.request_status.approved")}
      </span>
    );
  if (status === "REJECTED")
    return (
      <span className={`${badgeBase} text-failure bg-failure/20`}>
        {t("payout_request.table.request_status.rejected")}
      </span>
    );
  return (
    <span className={`${badgeBase} text-[#EA961C] bg-[#f5f5f5]`}>
      {t("payout_request.table.request_status.pending")}
    </span>
  );
}
