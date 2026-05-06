import { DateTime } from "luxon";

export default function formatTime(
  time: string,
  timezone: string,
  locale: string = "en",
) {
  const localeMap: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
  };

  const date = DateTime.fromISO(`1970-01-01T${time}`, {
    zone: timezone,
  });

  return date.setLocale(localeMap[locale]).toLocaleString({
    hour: "numeric",
    minute: "2-digit",
    hour12: locale === "en", // AM/PM only for English
  });
}
