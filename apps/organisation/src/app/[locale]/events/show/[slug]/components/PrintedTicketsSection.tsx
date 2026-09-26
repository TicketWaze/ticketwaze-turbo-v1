"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale, useTranslations } from "next-intl";
import { Event, PhysicalTicketBatch } from "@ticketwaze/typescript-config";
import FormatDate from "@/lib/FormatDate";

/**
 * THE RECORD OF PRINTED TICKETS — print runs Ticketwaze made for this event,
 * to be sold by hand.
 *
 * A record only. They sit outside the online stock and are not sales on the
 * platform, so none of the figures above (tickets sold, revenue, the ticket
 * table) include them; the note under the title says so, because an organiser
 * adding up the two would otherwise count them twice or look for missing
 * money. What is tracked is how many were printed and how many got in.
 *
 * Renders nothing until something has been printed.
 */
export default function PrintedTicketsSection({
  event,
  batches,
}: {
  event: Event;
  batches: PhysicalTicketBatch[];
}) {
  const t = useTranslations("Events.single_event.printed_tickets");
  const locale = useLocale();

  if (batches.length === 0) return null;

  const printed = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const scanned = batches.reduce((sum, batch) => sum + batch.checked, 0);
  // Cancelled by Ticketwaze (lost or unsold): refused at the door.
  const cancelled = batches.reduce((sum, batch) => sum + batch.void, 0);
  const timezone = event.eventDays[0]?.timezone ?? "local";

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <h2 className="font-medium font-primary text-[2rem] leading-10 text-deep-100">
            {t("title")}
          </h2>
          <span className="px-4 py-[3px] rounded-[30px] bg-neutral-100 text-[1.2rem] font-medium leading-6 text-neutral-600">
            {t("summary", { printed, scanned })}
          </span>
          {cancelled > 0 && (
            <span className="px-4 py-[3px] rounded-[30px] bg-[#FDECEA] text-[1.2rem] font-medium leading-6 text-[#B3261E]">
              {t("cancelled", { count: cancelled })}
            </span>
          )}
        </div>
        <p className="text-[1.4rem] leading-8 text-neutral-600">{t("note")}</p>
      </div>

      <Table className="mt-2">
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("table.date")}
            </TableHead>
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("table.ticket_type")}
            </TableHead>
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("table.quantity")}
            </TableHead>
            <TableHead className="hidden lg:table-cell font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("table.face_value")}
            </TableHead>
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("table.scanned")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.batchId}>
              <TableCell className="text-[1.5rem] py-[15px] leading-8 text-neutral-900">
                {FormatDate(batch.createdAt, locale, timezone)}
              </TableCell>
              <TableCell>
                <span className="py-[3px] text-[1.1rem] font-bold leading-6 uppercase text-[#EF1870] px-[5px] rounded-[30px] bg-[#f5f5f5]">
                  {batch.ticketType}
                </span>
              </TableCell>
              <TableCell className="text-[1.5rem] font-medium leading-8 text-neutral-900">
                {batch.quantity}
                {batch.void > 0 && (
                  <span className="block text-[1.2rem] font-normal text-[#B3261E]">
                    {t("cancelled", { count: batch.void })}
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900">
                {event.currency === "USD"
                  ? batch.ticketUsdPrice
                  : batch.ticketPrice}{" "}
                {event.currency}
              </TableCell>
              <TableCell className="text-[1.5rem] leading-8 text-neutral-900">
                <span
                  className={
                    batch.checked > 0 ? "text-[#349C2E] font-medium" : ""
                  }
                >
                  {batch.checked}
                </span>
                <span className="text-neutral-500"> / {batch.quantity}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
