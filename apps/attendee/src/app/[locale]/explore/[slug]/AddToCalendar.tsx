import { Event } from "@ticketwaze/typescript-config";
import { Google } from "iconsax-reactjs";
import { DateTime } from "luxon";

export default function AddToCalendar({ event }: { event: Event }) {
  const firstDay = event.eventDays.find((day) => day.dayNumber === 1);

  if (!firstDay) return null;

  // Build proper DateTime objects
  const start = DateTime.fromISO(
    `${firstDay.eventDate}T${firstDay.startTime}`,
    { zone: firstDay.timezone },
  );

  const end = DateTime.fromISO(`${firstDay.eventDate}T${firstDay.endTime}`, {
    zone: firstDay.timezone,
  });

  // Format for Google Calendar: YYYYMMDDTHHmmssZ (UTC)
  const formattedStart = start.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
  const formattedEnd = end.toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");

  const addLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.eventName,
  )}&dates=${formattedStart}/${formattedEnd}&details=${encodeURIComponent(
    event.eventDescription,
  )}&location=${encodeURIComponent(event.address)}`;

  return (
    <a
      href={addLink}
      target="_blank"
      rel="noopener noreferrer"
      className="w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
    >
      <Google size="20" color="#E45B00" variant="Bulk" />
    </a>
  );
}
