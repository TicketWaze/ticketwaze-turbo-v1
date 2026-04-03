import { DateTime } from "luxon";

export default function formatDate(
  entry: DateTime | string,
  locale: string = "en",
) {
  const date = typeof entry === "string" ? DateTime.fromISO(entry) : entry;

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
