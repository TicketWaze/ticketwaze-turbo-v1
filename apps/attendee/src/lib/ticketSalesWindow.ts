import { DateTime } from "luxon";
import { Event, EventTicketType } from "@ticketwaze/typescript-config";

export type SalesState = "on_sale" | "not_started" | "ended";

/**
 * Where one ticket class stands right now. Mirrors the API's
 * services/ticket_sales_window.ts: a class sells from its own start (or
 * always) until the EARLIER of its own end and the event's overall cutoff.
 */
export function ticketSalesState(
  ticketType: Pick<EventTicketType, "salesStartAt" | "salesEndAt">,
  event: Pick<Event, "ticketSalesEndAt">,
  now = DateTime.now(),
): SalesState {
  const start = ticketType.salesStartAt
    ? DateTime.fromISO(ticketType.salesStartAt)
    : null;
  if (start?.isValid && now < start) return "not_started";
  const ends = [ticketType.salesEndAt, event.ticketSalesEndAt]
    .filter((value): value is string => Boolean(value))
    .map((value) => DateTime.fromISO(value))
    .filter((d) => d.isValid);
  if (ends.some((end) => now >= end)) return "ended";
  return "on_sale";
}
