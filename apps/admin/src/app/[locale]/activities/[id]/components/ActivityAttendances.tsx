"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import Informations from "./Informations";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Event, Ticket } from "@ticketwaze/typescript-config";

function getTicketTypeColor(ticketType: string) {
  const upper = ticketType.toUpperCase();
  if (upper.includes("PREMIUM")) return "#2E3237";
  if (upper.includes("VIP")) return "#7A19C7";
  return "#EF1870";
}

function getStatusStyle(status: Ticket["status"]) {
  switch (status) {
    case "CHECKED":
      return { color: "#349C2E", label: "Check-in" };
    case "RETURNED":
      return { color: "#3F3F3F", label: "Returned" };
    default:
      return { color: "#EA961C", label: "Pending" };
  }
}

function formatPurchaseDate(dateInput: unknown) {
  return new Date(dateInput as string).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivityAttendances({ event }: { event: Event }) {
  const t = useTranslations("Activities");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all_period");

  const filteredTickets = event.tickets.filter((ticket) => {
    if (statusFilter === "Checked-In" && ticket.status !== "CHECKED")
      return false;
    if (statusFilter === "pending" && ticket.status !== "PENDING") return false;
    if (periodFilter === "last_week" || periodFilter === "last_month") {
      const ms =
        periodFilter === "last_week"
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;
      return (
        new Date(ticket.createdAt as unknown as string).getTime() >=
        Date.now() - ms
      );
    }
    return true;
  });

  return (
    <TabsContent value="attendance" className="flex flex-col gap-8">
      <div className="flex justify-end">
        <div className="flex gap-4">
          <Select defaultValue="all" onValueChange={(v) => setStatusFilter(v)}>
            <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-100 text-[1.4rem]">
              <SelectGroup>
                <SelectItem className="text-[1.4rem] text-deep-100" value="all">
                  {t("activity.resume.attendance.filters.status")}
                </SelectItem>
                <SelectItem
                  className="text-[1.4rem] text-deep-100"
                  value="Checked-In"
                >
                  Checked-In
                </SelectItem>
                <SelectItem
                  className="text-[1.4rem] text-deep-100"
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
            <SelectContent className="bg-neutral-100 text-[1.4rem]">
              <SelectGroup>
                <SelectItem
                  className="text-[1.4rem] text-deep-100"
                  value="all_period"
                >
                  {t("activity.resume.attendance.filters.period")}
                </SelectItem>
                <SelectItem
                  className="text-[1.4rem] text-deep-100"
                  value="last_week"
                >
                  Last week
                </SelectItem>
                <SelectItem
                  className="text-[1.4rem] text-deep-100"
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
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("activity.resume.attendance.table.name")}
            </TableHead>
            <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("activity.resume.attendance.table.class")}
            </TableHead>
            <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("activity.resume.attendance.table.amount")}
            </TableHead>
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("activity.resume.attendance.table.status")}
            </TableHead>
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("activity.resume.attendance.table.purchase")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTickets.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-[1.4rem] text-neutral-500 py-12"
              >
                No attendees found.
              </TableCell>
            </TableRow>
          )}
          {filteredTickets.map((ticket) => {
            const statusStyle = getStatusStyle(ticket.status);
            const ticketColor = getTicketTypeColor(ticket.ticketType);
            return (
              <Drawer key={ticket.ticketId} direction="right">
                <DrawerTrigger asChild>
                  <TableRow className="cursor-pointer">
                    <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                      {ticket.fullName}
                    </TableCell>
                    <TableCell className="py-6 hidden lg:table-cell">
                      <span
                        style={{ color: ticketColor }}
                        className="py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-[#f5f5f5]"
                      >
                        {ticket.ticketType}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900">
                      {event.currency === 'HTG' ? ticket.ticketPrice.toLocaleString() : ticket.ticketUsdPrice.toLocaleString()} {event.currency}
                    </TableCell>
                    <TableCell className="py-6">
                      <span
                        style={{ color: statusStyle.color }}
                        className="py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-[#f5f5f5]"
                      >
                        {statusStyle.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900">
                      {formatPurchaseDate(ticket.createdAt)}
                    </TableCell>
                  </TableRow>
                </DrawerTrigger>
                <Informations ticket={ticket} event={event} />
              </Drawer>
            );
          })}
        </TableBody>
      </Table>
    </TabsContent>
  );
}
