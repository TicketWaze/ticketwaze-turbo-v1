/**
 * Figma's table date, "Jan 16, 2025 12:21 PM" ("16 janv. 2025 12:21" in
 * French), read in Haiti time — the platform's zone, like the analytics.
 * `formatDate` gives the date alone.
 */
export default function formatDateTime(iso: string, locale: string): string {
  const parts = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Port-au-Prince",
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const time = `${get("hour")}:${get("minute")}${get("dayPeriod") ? ` ${get("dayPeriod")}` : ""}`;
  return locale === "fr"
    ? `${get("day")} ${get("month")} ${get("year")} ${time}`
    : `${get("month")} ${get("day")}, ${get("year")} ${time}`;
}
