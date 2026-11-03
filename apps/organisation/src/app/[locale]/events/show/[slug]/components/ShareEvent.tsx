"use client";
import { slugify } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import { ShareDialog } from "@ticketwaze/ui/share";
import { useLocale } from "next-intl";

/**
 * Figma's "Share Event" modal (1626:49207, mobile 2220:56118) — the shared
 * one from @ticketwaze/ui, used by every app. Controlled, so the header
 * button, the empty table's "Promote" button and the phone layout all open
 * the same one.
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
      link={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/${slugify(event.eventName, event.eventId)}`}
      title={event.eventName}
      description={event.eventDescription}
      locale={locale}
      event={event}
    />
  );
}
