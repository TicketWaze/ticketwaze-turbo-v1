import { DateTime } from "luxon";
import { Event } from "@ticketwaze/typescript-config";

// True when the organiser set a ticket-sales cutoff and that instant has passed.
// The event stays listed/viewable; buying is simply blocked and the UI shows a
// "sales ended" state. Mirrors the API purchase guard on `ticketSalesEndAt`.
export default function isEventSalesEnded(event: Event): boolean {
  if (!event.ticketSalesEndAt) return false;
  const cutoff = DateTime.fromISO(event.ticketSalesEndAt);
  if (!cutoff.isValid) return false;
  return DateTime.now() > cutoff;
}
