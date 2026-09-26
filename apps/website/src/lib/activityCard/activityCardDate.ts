import { Event, EventDay } from "@ticketwaze/typescript-config";

/**
 * The day an activity card advertises, and the key the explore feed orders by.
 *
 * These two have to come from the same place. The card shows the next day that
 * has not gone yet; if the feed sorted by anything else — it used to sort by
 * `created_at` — the dates printed down the list ran in no order at all, which
 * is exactly what a reader scanning for "what is on this weekend" reads as
 * broken.
 */

/**
 * The event day a card shows: the first one still to come, falling back to the
 * last day for an event whose days are all behind us (the past-activities
 * section). A teaser has no days at all, so this is undefined for one.
 */
export function getActivityCardDay(
  event: Event,
  now: Date = new Date(),
): EventDay | undefined {
  const sortedDays = [...(event.eventDays ?? [])].sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
  );
  return (
    sortedDays.find((eventDay) => new Date(eventDay.eventDate) >= now) ??
    sortedDays[sortedDays.length - 1]
  );
}

/**
 * That same day as a timestamp, for sorting.
 *
 * A teaser falls back to `comingSoonDate`, so an announcement for the 22nd sits
 * between real events on the 21st and the 23rd rather than in a clump of its
 * own. A teaser carrying only a free-text hint ("Summer 2027") names no day to
 * sort on and goes last — `Infinity` rather than 0, which would float every
 * undated announcement to the top of the feed.
 */
export function getActivityCardTime(event: Event, now: Date = new Date()) {
  const day = getActivityCardDay(event, now);
  if (day) return new Date(day.eventDate).getTime();
  // A bare "YYYY-MM-DD" is read as UTC; the card appends T00:00:00 to force
  // local parsing, and the sort has to agree with it or a teaser can order
  // against the date printed on its own card.
  if (event.comingSoonDate)
    return new Date(`${event.comingSoonDate}T00:00:00`).getTime();
  return Number.POSITIVE_INFINITY;
}
