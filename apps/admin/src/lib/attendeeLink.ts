import { slugify } from "@/lib/Slugify";

const ATTENDEE_URL =
  process.env.NEXT_PUBLIC_ATTENDEE_URL || "https://app.ticketwaze.com";

/**
 * An event's page on the attendee app, as the share dialog, its QR code and
 * the poster print it.
 *
 * Unlike the organisation dashboard's, it has no locale segment: the admin's
 * own UI language says nothing about who will scan it, and the attendee app
 * redirects a locale-less path to the visitor's language. The shorter URL also
 * makes a sparser, easier-to-scan QR code.
 */
export function attendeeEventLink(event: {
  eventName: string;
  eventId: string;
}): string {
  return `${ATTENDEE_URL}/explore/${slugify(event.eventName, event.eventId)}`;
}
