import { DateTime } from "luxon";

export default function formatDate(
  entry: DateTime | string,
  locale: string,
  timezone: string,
) {
  let date: DateTime;

  if (typeof entry === "string") {
    const parsed = DateTime.fromISO(entry, { zone: "utc" });
    date = parsed.setZone(timezone, { keepLocalTime: true });
  } else {
    date = entry.setZone(timezone, { keepLocalTime: true });
  }

  const localeMap: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
  };

  return date
    .setLocale(localeMap[locale])
    .toLocaleString({
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();
}
