import { DateTime } from "luxon";

const localeMap: Record<string, string> = { en: "en-US", fr: "fr-FR" };

/**
 * Raffle datetimes are stored as correct UTC instants (interpreted at creation
 * in the organiser's zone), so display them by CONVERTING into the raffle's own
 * timezone — not keepLocalTime like events, which store naive wall-clock dates.
 * Falls back to the viewer's local zone for legacy raffles without a timezone.
 */
export default function formatRaffleDate(
  iso: string,
  locale: string,
  timezone: string | null,
  // A deadline needs its time of day: sales usually close on the same date as
  // the draw, and "27 JUL 2026" for both reads as if entries stay open all day.
  options: { withTime?: boolean } = {},
) {
  const dt = DateTime.fromISO(iso).setZone(timezone || "local");
  if (!dt.isValid) return "";
  return dt
    .setLocale(localeMap[locale] ?? "en-US")
    .toLocaleString({
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(options.withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    })
    .toUpperCase();
}
