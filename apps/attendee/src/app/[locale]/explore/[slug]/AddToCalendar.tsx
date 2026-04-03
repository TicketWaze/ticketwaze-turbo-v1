import { Event } from "@ticketwaze/typescript-config";
import { Google } from "iconsax-reactjs";
import { DateTime } from "luxon";

export default function AddToCalendar({ event }: { event: Event }) {
  const firstDay = event.eventDays.find((day) => day.dayNumber === 1);
  if (!firstDay) return null;

  const [year, month, day] = firstDay.eventDate
    .split("T")[0]
    .split("-")
    .map(Number);
  const [startHour, startMinute] = firstDay.startTime.split(":").map(Number);
  const [endHour, endMinute] = firstDay.endTime.split(":").map(Number);

  const start = DateTime.fromObject(
    { year, month, day, hour: startHour, minute: startMinute },
    { zone: firstDay.timezone },
  );

  const end = DateTime.fromObject(
    { year, month, day, hour: endHour, minute: endMinute },
    { zone: firstDay.timezone },
  );

  if (!start.isValid || !end.isValid) return null;

  const formattedStart = start.toFormat("yyyyLLdd'T'HHmmss");
  const formattedEnd = end.toFormat("yyyyLLdd'T'HHmmss");

  const addLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.eventName,
  )}&dates=${formattedStart}/${formattedEnd}&ctz=${encodeURIComponent(
    firstDay.timezone,
  )}&details=${encodeURIComponent(
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
