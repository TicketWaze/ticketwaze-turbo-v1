"use client";
import { Event } from "@ticketwaze/typescript-config";
import { useLocale, useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar2, Location, Ticket } from "iconsax-reactjs";
import formatDate from "@/lib/FormatDate";

export default function ActivityPerformanceList({
  events,
}: {
  events: Event[];
}) {
  const t = useTranslations("Payouts.activity");
  const locale = useLocale();

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col gap-12 items-center py-16">
        <div className="rounded-full bg-neutral-100 p-6 w-fit">
          <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
            <Ticket size={50} color="#A0A0A0" variant="Bulk" />
          </div>
        </div>
        <p className="text-[1.8rem] text-neutral-600 leading-10 text-center">
          {t("empty")}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
            {t("table.event")}
          </TableHead>
          <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase hidden lg:table-cell">
            {t("table.date")}
          </TableHead>
          <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase hidden lg:table-cell">
            {t("table.location")}
          </TableHead>
          <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
            {t("table.sold")}
          </TableHead>
          <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
            {t("table.scanned")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const firstDay = event.eventDays.find((d) => d.dayNumber === 1);
          const soldTickets = event.eventTicketTypes.reduce(
            (sum, tt) => sum + tt.ticketTypeQuantitySold,
            0,
          );
          const totalTickets = event.eventTicketTypes.reduce(
            (sum, tt) => sum + tt.ticketTypeQuantity,
            0,
          );
          const scannedTickets = event.eventAttendees.length;

          return (
            <TableRow key={event.eventId}>
              <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900 font-medium max-w-[20rem] truncate">
                {event.eventName}
              </TableCell>
              <TableCell className="text-[1.4rem] py-6 leading-8 text-neutral-700 hidden lg:table-cell">
                <div className="flex items-center gap-2">
                  <Calendar2 size={14} color="#737c8a" variant="Bulk" />
                  {firstDay
                    ? formatDate(firstDay.eventDate, locale, firstDay.timezone)
                    : "—"}
                </div>
              </TableCell>
              <TableCell className="text-[1.4rem] py-6 leading-8 text-neutral-700 hidden lg:table-cell">
                <div className="flex items-center gap-2">
                  <Location size={14} color="#737c8a" variant="Bulk" />
                  {event.city}, {event.country}
                </div>
              </TableCell>
              <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                <span className="font-medium">{soldTickets}</span>
                {totalTickets > 0 && (
                  <span className="text-neutral-500 text-[1.3rem]">
                    {" "}
                    / {totalTickets}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                {scannedTickets}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
