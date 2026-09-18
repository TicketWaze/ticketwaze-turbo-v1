import { DateTime } from "luxon";
import type { EventDay } from "@ticketwaze/typescript-config";

/**
 * WHEN AN EVENT STARTS AND WHEN IT IS OVER.
 *
 * An event day carries a local wall-clock DATE, a local start/end TIME and its
 * own TIMEZONE, and all three are needed to get a real instant out of it.
 * Anything less has been a bug on this dashboard:
 *
 *   `DateTime.fromISO(day.eventDate)` reads the date in the BROWSER's zone and
 *   throws the time away, so the countdown compared midnight-somewhere against
 *   now and announced "Event passed" at the start of the very day the event was
 *   happening on.
 *
 * `eventDate` arrives as a timestamp string ("2026-09-18T00:00:00.000+00:00"),
 * so only its date part is used — the clock in it is an artefact of storage,
 * never the event's time.
 */

type DayLike = Pick<
  EventDay,
  "eventDate" | "startTime" | "endTime" | "timezone"
>;

function dayMoment(day: DayLike, time: string): DateTime {
  return DateTime.fromISO(`${String(day.eventDate).slice(0, 10)}T${time}`, {
    zone: day.timezone,
  });
}

/** One day's local start, as an absolute instant. */
export function dayStartsAt(day: DayLike): DateTime {
  return dayMoment(day, day.startTime);
}

/** One day's local end, as an absolute instant. */
export function dayEndsAt(day: DayLike): DateTime {
  return dayMoment(day, day.endTime);
}

/**
 * The EARLIEST day's start. Day numbers are an ordering the organiser typed and
 * are not guaranteed to be chronological, so the earliest instant is what "it
 * starts" actually means. Null when there are no days (a coming-soon teaser).
 */
export function eventStartsAt(days: DayLike[] | undefined): DateTime | null {
  const valid = (days ?? []).map(dayStartsAt).filter((d) => d.isValid);
  if (valid.length === 0) return null;
  return valid.reduce((earliest, d) => (d < earliest ? d : earliest));
}

/** The LATEST day's end — when the event is genuinely over. */
export function eventEndsAt(days: DayLike[] | undefined): DateTime | null {
  const valid = (days ?? []).map(dayEndsAt).filter((d) => d.isValid);
  if (valid.length === 0) return null;
  return valid.reduce((latest, d) => (d > latest ? d : latest));
}

/**
 * Fully over: it HAS days and the last one's end time has gone by.
 *
 * No days means "never scheduled", which is not the same as "already ended" —
 * a teaser must not read as past, or it would be frozen as unapprovable.
 */
export function isEventPast(
  days: DayLike[] | undefined,
  now = DateTime.now(),
): boolean {
  const end = eventEndsAt(days);
  return end !== null && end < now;
}

/** Started, but not finished: the event is happening right now. */
export function isEventInProgress(
  days: DayLike[] | undefined,
  now = DateTime.now(),
): boolean {
  const start = eventStartsAt(days);
  const end = eventEndsAt(days);
  return start !== null && end !== null && start <= now && now <= end;
}
