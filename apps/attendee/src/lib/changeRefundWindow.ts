import { Event } from "@ticketwaze/typescript-config";

/**
 * Must match CHANGE_REFUND_WINDOW_HOURS in the API
 * (services/event_change_notice.ts). The API is the authority — everything here
 * exists to show the option and explain it, not to decide eligibility.
 */
export const CHANGE_REFUND_WINDOW_HOURS = 48;

/** When the window shuts, or null if the event has not materially changed. */
export function changeWindowClosesAt(event: Event): Date | null {
  if (!event.materialChangeAt) return null;
  const changedAt = new Date(event.materialChangeAt);
  if (Number.isNaN(changedAt.getTime())) return null;
  return new Date(
    changedAt.getTime() + CHANGE_REFUND_WINDOW_HOURS * 60 * 60 * 1000,
  );
}

/**
 * The organiser moved this event under its buyers recently enough that they can
 * still walk away — regardless of the usual seven-day cutoff, and regardless of
 * the ticket type being marked non-refundable.
 *
 * Deliberately event-level rather than per ticket. The API checks each ticket's
 * purchase date (only those bought before the change qualify); this only decides
 * whether to offer the option at all.
 */
export function isChangeWindowOpen(event: Event): boolean {
  const closesAt = changeWindowClosesAt(event);
  return closesAt !== null && closesAt.getTime() > Date.now();
}
