"use client";

import { ReactNode, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import MoneySend from "@ticketwaze/ui/assets/icons/money-send.svg";
import ArrowRight from "@ticketwaze/ui/assets/icons/arrow-right.svg";
import formatDate from "@/lib/FormatDate";
import {
  UserWithdrawalRequest,
  WithdrawalRequest,
} from "@ticketwaze/typescript-config";
import { FetchLatestUserWithdrawals } from "@/actions/UserWithdrawal";

const badgeBase =
  "py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px]";

type Scope = "requests" | "history";

export default function PayoutSection({
  title,
  scope,
  orgRequests,
  orgTotal,
  goTo,
}: {
  title: string;
  scope: Scope;
  orgRequests: WithdrawalRequest[];
  orgTotal: number;
  goTo: (path: string) => void;
}) {
  const t = useTranslations("Payouts");
  const locale = useLocale();
  const { data: session } = useSession();

  const [tab, setTab] = useState<"organisation" | "user">("organisation");
  const [userRequests, setUserRequests] = useState<UserWithdrawalRequest[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userLoaded, setUserLoaded] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  async function handleTabChange(value: string) {
    setTab(value as "organisation" | "user");
    if (value === "user" && !userLoaded) {
      setUserLoading(true);
      const res = await FetchLatestUserWithdrawals(
        session?.user?.accessToken ?? "",
        scope,
      );
      if (res.status === "success") {
        setUserRequests(res.requests);
        setUserTotal(res.total);
      }
      setUserLoaded(true);
      setUserLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h4 className="font-medium font-primary text-[1.8rem] leading-10 text-black">
        {title}
      </h4>
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full lg:w-fit">
          <TabsTrigger value="organisation">
            {t("tabs.organisation")}
          </TabsTrigger>
          <TabsTrigger value="user">{t("tabs.user")}</TabsTrigger>
        </TabsList>

        {/* Organisation */}
        <TabsContent value="organisation" className="flex flex-col gap-8">
          {orgRequests.length > 0 ? (
            <>
              <PayoutTable header={<Header t={t} />}>
                {orgRequests.map((request) => (
                  <TableRow
                    key={request.withdrawalRequestId}
                    onClick={() =>
                      goTo(`/payouts/${request.withdrawalRequestId}`)
                    }
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
                ))}
              </PayoutTable>
              {orgTotal > 5 && (
                <ViewAll
                  href={`/payouts/requests?scope=${scope}&tab=organisation`}
                  label={t("view_all")}
                />
              )}
            </>
          ) : (
            <EmptyState text={emptyText(t, scope)} />
          )}
        </TabsContent>

        {/* Users (lazy) */}
        <TabsContent value="user" className="flex flex-col gap-8">
          {userLoading ? (
            <div className="flex justify-center py-20">
              <LoadingCircleSmall />
            </div>
          ) : userRequests.length > 0 ? (
            <>
              <PayoutTable header={<Header t={t} />}>
                {userRequests.map((request) => (
                  <TableRow
                    key={request.userWithdrawalRequestId}
                    onClick={() =>
                      goTo(
                        `/user-withdrawals/${request.userWithdrawalRequestId}`,
                      )
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
              </PayoutTable>
              {userTotal > 5 && (
                <ViewAll
                  href={`/payouts/requests?scope=${scope}&tab=user`}
                  label={t("view_all")}
                />
              )}
            </>
          ) : (
            <EmptyState text={emptyText(t, scope)} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function emptyText(t: ReturnType<typeof useTranslations>, scope: Scope) {
  return scope === "history"
    ? t("payout_history.no_history")
    : t("payout_request.no_request");
}

function Header({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
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
      <Th className="hidden lg:table-cell">{t("payout_request.table.date")}</Th>
    </TableRow>
  );
}

function PayoutTable({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <Table className="mt-4">
      <TableHeader>{header}</TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
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

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <div className="w-full flex justify-end">
      <Link
        href={href}
        className="flex gap-8 text-primary-500 text-[1.5rem] leading-8 items-center justify-end"
      >
        {label}
        <Image src={ArrowRight} alt="arrow right" width={20} height={20} />
      </Link>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col w-fit gap-12 items-center mt-8 self-center">
      <div className="rounded-full bg-neutral-100 p-6 w-fit">
        <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
          <Image src={MoneySend} alt="no requests" width={50} height={50} />
        </div>
      </div>
      <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
        {text}
      </p>
    </div>
  );
}
