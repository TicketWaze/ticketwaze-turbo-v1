import { DateTime } from "luxon";

export default function FormatDate(entry: DateTime | string) {
  const date =
    entry instanceof DateTime
      ? entry
      : DateTime.fromISO(entry.toString(), { zone: "utc" });

  return date.toLocaleString({
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
