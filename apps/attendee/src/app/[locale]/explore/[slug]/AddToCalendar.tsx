import { Event } from "@ticketwaze/typescript-config";
import { Google } from "iconsax-reactjs";

export default function AddToCalendar({ event }: { event: Event }) {
  const startDateTime = event.eventDays[0].dateTime;
  // const endDateTime = startDateTime.getTime() + 3 * 60 * 60 * 1000

  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGoogleCalendarDate = (dateString: string) => {
    return dateString.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const formattedStart = formatGoogleCalendarDate(startDateTime);
  // const formattedEnd = formatGoogleCalendarDate(endDateTime);

  const addLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.eventName)}&dates=${formattedStart}&details=${encodeURIComponent(event.eventDescription)}&location=${encodeURIComponent(event.address)}`;

  return (
    <a
      href={addLink}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
      }
    >
      <Google size="20" color="#E45B00" variant="Bulk" />
    </a>
  );
}
