"use client";
import { attendeeEventLink } from "@/lib/attendeeLink";
import { Event } from "@ticketwaze/typescript-config";
import { ShareDialog } from "@ticketwaze/ui/share";
import { useLocale } from "next-intl";

/**
 * The shared share modal (@ticketwaze/ui, the organisation dashboard's "Share
 * Event"), for an admin acting on the organiser's behalf — e.g. handing a QR
 * code to an organiser who cannot reach their own dashboard. Only the link
 * differs (see lib/attendeeLink). Opened from the activity's ⋯ menu.
 */
export default function ShareEvent({
  event,
  open,
  onOpenChange,
}: {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const locale = useLocale();
  return (
    <ShareDialog
      open={open}
      onOpenChange={onOpenChange}
      link={attendeeEventLink(event)}
      title={event.eventName}
      description={event.eventDescription}
      locale={locale}
      event={event}
    />
  );
}
