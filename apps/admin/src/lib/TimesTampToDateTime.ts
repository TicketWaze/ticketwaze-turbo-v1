import { DateTime } from "luxon";

export default function TimesTampToDateTime(date: string) {
  return DateTime.fromISO(date);
}
