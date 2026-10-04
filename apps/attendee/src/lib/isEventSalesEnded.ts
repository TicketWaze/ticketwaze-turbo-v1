import { DateTime } from "luxon";
import { Event } from "@ticketwaze/typescript-config";
import { ticketSalesState } from "./ticketSalesWindow";

/**
 * True when nothing can be bought any more: the organiser's event-wide cutoff
 * has passed, or every ticket class's own sales window has closed. The event
 * stays listed and viewable; buying is blocked and the UI shows "sales ended".
 * Mirrors the API's purchase guards.
 */
export default function isEventSalesEnded(event: Event): boolean {
  if (event.ticketSalesEndAt) {
    const cutoff = DateTime.fromISO(event.ticketSalesEndAt);
    if (cutoff.isValid && DateTime.now() > cutoff) return true;
  }
  const types = event.eventTicketTypes ?? [];
  return (
    types.length > 0 &&
    types.every((type) => ticketSalesState(type, event) === "ended")
  );
}
