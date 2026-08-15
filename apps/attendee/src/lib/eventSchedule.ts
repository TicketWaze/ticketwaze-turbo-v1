import { DateTime } from "luxon";
import type { EventDay } from "@ticketwaze/typescript-config";

/**
 * WHEN AN EVENT DAY ACTUALLY RUNS, IN THE EVENT'S OWN TIMEZONE.
 *
 * One implementation, shared by every screen that asks "is this live?" — the
 * upcoming card, the event detail page's Join button, and anything added later.
 * They each had their own copy and each copy had the same bug.
 *
 * **The bug: the browser's timezone was being used instead of the event's.**
 * The old code built `new Date("2026-08-14T11:00")` from a naive string, which
 * JavaScript parses as local time for whoever happens to be looking, while
 * `day.timezone` sat unused right beside it. So a buyer in Paris looking at an
 * 11:00 Port-au-Prince event had the window computed as 11:00 Paris — six hours
 * out. On an online event that decides when the Join button unlocks, which
 * means a paying attendee could be locked out of a call already in progress.
 *
 * `eventDate` is stored as a UTC midnight ("2026-08-14T00:00:00.000Z"), so the
 * calendar date is read in UTC and re-anchored in the event's zone before the
 * time of day is attached. Same two steps as the organiser dashboard's
 * `events/EventPageContent.tsx`, deliberately, because the two apps were
 * disagreeing about the same event.
 */
export function dayWindow(
  day: EventDay,
): { start: DateTime; end: DateTime } | null {
  const zone = day.timezone || "utc";
  const raw =
    typeof day.eventDate === "string"
      ? day.eventDate
      : new Date(day.eventDate).toISOString();

  const date = DateTime.fromISO(raw, { zone: "utc" })
    .setZone(zone, { keepLocalTime: true })
    .toISODate();
  if (!date) return null;

  const start = DateTime.fromISO(`${date}T${day.startTime}`, { zone });
  const end = DateTime.fromISO(`${date}T${day.endTime}`, { zone });
  return start.isValid && end.isValid ? { start, end } : null;
}

/** Every day of an event as real instants, malformed ones dropped. */
export function eventWindows(
  eventDays: EventDay[],
): { start: DateTime; end: DateTime }[] {
  return eventDays
    .map(dayWindow)
    .filter((w): w is { start: DateTime; end: DateTime } => w !== null);
}

/** Is `now` inside any of the event's days? */
export function isEventLiveAt(eventDays: EventDay[], now: DateTime): boolean {
  return eventWindows(eventDays).some(
    ({ start, end }) => now >= start && now <= end,
  );
}

/** The soonest day still to come, or null when they have all started. */
export function nextStartAfter(
  eventDays: EventDay[],
  now: DateTime,
): DateTime | null {
  return (
    eventWindows(eventDays)
      .map(({ start }) => start)
      .filter((start) => start > now)
      .sort((a, b) => a.toMillis() - b.toMillis())
      .at(0) ?? null
  );
}
