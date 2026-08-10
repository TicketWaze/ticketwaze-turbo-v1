"use client";
import AdminLayout from "@/components/Layouts/AdminLayout";
import BackButton from "@/components/shared/BackButton";
import { SuspendDialog } from "./SuspendDialog";
import { ReactivateDialog } from "./ReactivateDialog";
import Separator from "@/components/shared/Separator";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import Informations from "./Informations";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/shared/Inputs";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminUser, Ticket, UserAnalytic } from "@ticketwaze/typescript-config";
import SuspensionNotice from "@/components/shared/SuspensionNotice";
import formatDate from "@/lib/FormatDate";
import { formatMoney } from "@ticketwaze/currency";
import { useState } from "react";

/**
 * A ticket's price in its own activity's currency. Tickets carry both columns,
 * so reading the HTG one and labelling it with the activity's currency (what
 * this used to do) misreported every ticket sold in USD. Read off the
 * normalized `activity` — `ticket.event` is null for a raffle entry, which
 * silently forced those rows to HTG.
 */
export function formatTicketPrice(ticket: Ticket, locale: string): string {
  const currency = ticket.activity?.currency ?? "HTG";
  return formatMoney(
    currency === "USD" ? ticket.ticketUsdPrice : ticket.ticketPrice,
    currency,
    locale,
  );
}

export default function UserPageContent({
  user,
  totalSpent,
}: {
  user: AdminUser | null;
  totalSpent: number;
}) {
  const t = useTranslations("Attendees.profile");

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-[1.6rem] text-neutral-600">Attendee not found.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 lg:h-full lg:overflow-hidden">
        <BackButton text={t("back")} />
        <div className="mb-6 flex justify-between items-center">
          <h2 className="items-center font-primary leading-12 font-medium text-[2.6rem]">
            {t("title")}
          </h2>
          <div className="hidden lg:flex gap-4 items-center h-fit">
            {user.isSuspended ? (
              <ReactivateDialog userId={user.userId} />
            ) : (
              <SuspendDialog userId={user.userId} />
            )}
          </div>
        </div>
        {/* An active suspension is the first thing that explains everything
            else on this page, so it sits above the record — and above the
            deletion notice, since it is the stronger state. */}
        {user.suspension && <SuspensionNotice suspension={user.suspension} />}
        {/* A pending deletion is time-boxed and irreversible once it runs, so it
            is called out above the record rather than only listed inside it. */}
        {user.deletion && <DeletionNotice deletion={user.deletion} />}

        <main className="w-full grid grid-cols-1 lg:grid-cols-[15fr_21fr] gap-8 lg:gap-16 lg:min-h-0">
          <div className="w-full flex flex-col gap-8 lg:overflow-y-auto lg:min-h-0">
            <form className="flex flex-col gap-12 w-full pb-4 overflow-x-hidden">
              <div className="w-full bg-primary-500 p-6 rounded-[20px] flex gap-10">
                <div className="w-40 h-40 rounded-[25px] bg-neutral-300 overflow-hidden">
                  {user.profileImageUrl && (
                    <Image
                      src={user.profileImageUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full object-cover"
                      width={100}
                      height={100}
                    />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[2.6rem] text-white font-medium leading-12 capitalize">
                    {user.firstName} <br /> {user.lastName}
                  </span>
                  {/* <div className="bg-deep-100 flex gap-2 p-4 rounded-[100px] text-center text-white font-semibold text-[1.4rem]">
                    <Image src={image} alt="image" width={15} height={12} />
                    <span>{t("change_profile")}</span>
                  </div> */}
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <h3 className="text-deep-100 font-primary font-medium text-[1.8rem] leading-10">
                  {t("information")}
                </h3>

                <div className={"flex gap-6"}>
                  <Input type="text" disabled readOnly>
                    {user.firstName}
                  </Input>
                  <Input type="text" disabled readOnly>
                    {user.lastName}
                  </Input>
                </div>

                <Input type="email" disabled readOnly>
                  {user.email}
                </Input>

                <Input type="text" disabled readOnly>
                  {user.referralCode}
                </Input>

                <div className={"flex gap-6"}>
                  <Select defaultValue={user.state ?? "unknown"} disabled>
                    <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] p-8 border-none w-full text-[1.4rem] text-neutral-700 leading-8">
                      <SelectValue placeholder={user.state ?? "—"} />
                    </SelectTrigger>
                    <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                      <SelectGroup>
                        <SelectItem
                          className={"text-[1.4rem] text-deep-100"}
                          value={user.state ?? "unknown"}
                        >
                          {user.state ?? "—"}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select defaultValue={user.city ?? "unknown"} disabled>
                    <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] p-8 border-none w-full text-[1.4rem] text-neutral-700 leading-8">
                      <SelectValue placeholder={user.city ?? "—"} />
                    </SelectTrigger>
                    <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                      <SelectGroup>
                        <SelectItem
                          className={"text-[1.4rem] text-deep-100"}
                          value={user.city ?? "unknown"}
                        >
                          {user.city ?? "—"}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {user.dateOfBirth && (
                  <Input
                    type="date"
                    disabled
                    readOnly
                    defaultValue={user.dateOfBirth.slice(0, 10)}
                    children={undefined}
                  />
                )}

                <Select defaultValue={user.gender ?? "unknown"} disabled>
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] p-8 border-none w-full text-[1.4rem] text-neutral-700 leading-8">
                    <SelectValue placeholder={user.gender ?? "—"} />
                  </SelectTrigger>
                  <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                    <SelectGroup>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value={user.gender ?? "unknown"}
                      >
                        {user.gender ?? "—"}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>

          <div className="lg:min-h-[75vh]">
            <Tabs defaultValue="summary" className="w-full h-full">
              <TabsList className={"w-full lg:w-fit mx-auto lg:mx-0 mb-8"}>
                <TabsTrigger value="summary">{t("summary.title")}</TabsTrigger>
                <TabsTrigger value="ticket_history">
                  {t("ticket_history.title")}
                </TabsTrigger>
              </TabsList>
              <TicketHistory tickets={user.tickets ?? []} />
              <ActivitySummary
                userAnalytic={user.userAnalytic}
                totalSpent={totalSpent}
                createdAt={user.createdAt}
                deletion={user.deletion}
              />
            </Tabs>
          </div>
        </main>

        <div className="lg:hidden flex pb-6">
          {user.isSuspended ? (
            <ReactivateDialog userId={user.userId} />
          ) : (
            <SuspendDialog userId={user.userId} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

type AccountDeletion = NonNullable<AdminUser["deletion"]>;

/**
 * The pending-deletion callout. Amber rather than red: nothing has been lost
 * yet, and logging in still cancels it — but the date is fixed and the outcome
 * is irreversible, so it states both plainly.
 */
function DeletionNotice({ deletion }: { deletion: AccountDeletion }) {
  const t = useTranslations("Attendees.profile.deletion");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-2 rounded-[15px] border border-[#EA961C]/30 bg-[#FEF6E7] p-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[1.4rem] font-medium text-warning">
          {t("title")}
        </span>
        <span className="text-[1.1rem] font-bold uppercase text-warning bg-white/70 rounded-[30px] py-[0.3rem] px-3">
          {t("countdown", { days: deletion.daysLeft })}
        </span>
      </div>
      <p className="text-[1.4rem] leading-8 text-neutral-700">
        {t("body", {
          date: formatDate(deletion.scheduledFor, locale, "local"),
        })}
      </p>
      {deletion.reason && (
        <p className="text-[1.4rem] leading-8 text-neutral-700">
          <span className="text-neutral-600">{t("reason")}: </span>
          {deletion.reason}
        </p>
      )}
    </div>
  );
}

function ActivitySummary({
  userAnalytic,
  totalSpent,
  createdAt,
  deletion,
}: {
  userAnalytic: UserAnalytic | null;
  /**
   * USD. A buyer's tickets can span events priced in different currencies, so a
   * single total has to settle on one — the same denominator the platform
   * analytics report in.
   */
  totalSpent: number;
  createdAt: string;
  deletion?: AccountDeletion | null;
}) {
  const t = useTranslations("Attendees.profile");
  const locale = useLocale();
  return (
    <TabsContent value="summary" className="">
      <ul className="flex flex-col pt-4 gap-8 overflow-y-scroll">
        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
            {t("summary.count")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
            {userAnalytic?.eventAttended ?? 0}
          </span>
        </li>

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
            {t("summary.total_ticket_bought")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
            {userAnalytic?.ticketPurchased ?? 0}
          </span>
        </li>

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
            {t("summary.missed")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
            {userAnalytic?.eventMissed ?? 0}
          </span>
        </li>

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
            {t("summary.total_spent")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
            {formatMoney(totalSpent, "USD", locale)}
          </span>
        </li>

        <Separator />

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
            {t("summary.joined_on")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
            {formatDate(createdAt, locale, "local")}
          </span>
        </li>

        {/* Repeated from the banner on purpose: the banner is the alert, these
            are the record — an operator reading the summary should not have to
            scroll back up to find when the account goes and why. */}
        {deletion && (
          <>
            <Separator />
            <li className="flex justify-between">
              <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                {t("deletion.requested_on")}
              </span>
              <span className="text-[1.6rem] text-deep-100 font-medium leading-8">
                {formatDate(deletion.requestedAt, locale, "local")}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-[1.6rem] text-neutral-600 leading-[22.5px]">
                {t("deletion.scheduled_for")}
              </span>
              <span className="text-[1.6rem] text-warning font-medium leading-8">
                {formatDate(deletion.scheduledFor, locale, "local")}
              </span>
            </li>
            <li className="flex justify-between gap-8">
              <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] shrink-0">
                {t("deletion.reason")}
              </span>
              <span className="text-[1.6rem] text-deep-100 font-medium leading-8 text-right">
                {deletion.reason || t("deletion.no_reason")}
              </span>
            </li>
          </>
        )}
      </ul>
    </TabsContent>
  );
}

function TicketHistory({ tickets }: { tickets: Ticket[] }) {
  const t = useTranslations("Attendees.profile.ticket_history");
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all_period");

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter === "Checked-In" && ticket.status !== "CHECKED")
      return false;
    if (statusFilter === "pending" && ticket.status !== "PENDING") return false;
    if (periodFilter === "last_week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(ticket.createdAt as unknown as string) >= oneWeekAgo;
    }
    if (periodFilter === "last_month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return new Date(ticket.createdAt as unknown as string) >= oneMonthAgo;
    }
    return true;
  });

  return (
    <TabsContent value="ticket_history" className="flex flex-col gap-8">
      <div className="flex justify-end">
        <div className="flex gap-4">
          <Select defaultValue="all" onValueChange={(v) => setStatusFilter(v)}>
            <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
              <SelectGroup>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="all"
                >
                  {t("filters.status")}
                </SelectItem>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="Checked-In"
                >
                  Checked-In
                </SelectItem>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="pending"
                >
                  Pending
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            defaultValue="all_period"
            onValueChange={(v) => setPeriodFilter(v)}
          >
            <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
              <SelectGroup>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="all_period"
                >
                  {t("filters.period")}
                </SelectItem>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="last_week"
                >
                  Last week
                </SelectItem>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="last_month"
                >
                  Last month
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.name")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.class")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.amount")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.status")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.purchase")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredTickets.map((ticket) => (
            <Drawer key={ticket.ticketId} direction="right">
              <DrawerTrigger asChild>
                <TableRow>
                  <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                    <span className="cursor-pointer">
                      {ticket.activity?.name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="py-6">
                    <span className="py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EF1870] px-2 rounded-[30px] bg-[#f5f5f5]">
                      {ticket.ticketType}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900">
                    {formatTicketPrice(ticket, locale)}
                  </TableCell>
                  <TableCell className="py-6">
                    <span
                      className={`py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-[#f5f5f5] ${
                        ticket.status === "CHECKED"
                          ? "text-[#349C2E]"
                          : ticket.status === "RETURNED"
                            ? "text-failure"
                            : "text-warning"
                      }`}
                    >
                      {ticket.status === "CHECKED"
                        ? t("status.check-in")
                        : ticket.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900">
                    {formatDate(
                      ticket.createdAt as unknown as string,
                      locale,
                      "local",
                    )}
                  </TableCell>
                </TableRow>
              </DrawerTrigger>
              <Informations ticket={ticket} />
            </Drawer>
          ))}
        </TableBody>
      </Table>
      {filteredTickets.length === 0 && (
        <p className="text-center text-[1.5rem] text-neutral-500 py-8">
          No tickets found.
        </p>
      )}
    </TabsContent>
  );
}
