import { DateTime } from "luxon";
import { Event } from "@ticketwaze/typescript-config";

// An event is past when none of its days still end now or later. Each day's end
// is its local wall-clock end (eventDate's date + endTime) interpreted in the
// day's own timezone. Mirrors the API `List` upcoming/past filter so the two
// stay in sync.
export default function isEventPast(event: Event): boolean {
  const days = event.eventDays ?? [];
  if (days.length === 0) return false;
  const now = DateTime.now();
  return !days.some((day) => {
    const datePart = DateTime.fromISO(String(day.eventDate), {
      zone: "utc",
    }).toISODate();
    if (!datePart) return false;
    const end = DateTime.fromISO(`${datePart}T${day.endTime}`, {
      zone: day.timezone,
    });
    if (!end.isValid) return false;
    return end >= now;
  });
}
