import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { extractIdFromSlug } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import type { EventReservation } from "./components/ReservationsList";

/**
 * Load a teaser and, optionally, who has reserved a place on it.
 *
 * Shared by the teaser's page, its edit form and its publish wizard, all three
 * of which need the same row and the same "is this actually a teaser?" guard.
 * `event` is null for anything that fails — a malformed slug, a row belonging
 * to another organisation, an id that has already been published — so callers
 * render the same error view without caring which it was.
 */
export async function getTeaser(
  slug: string,
  { withReservations = false }: { withReservations?: boolean } = {},
) {
  const locale = await getLocale();
  const session = await auth();
  const organisationId = session?.activeOrganisation.organisationId ?? "";
  const accessToken = session?.user.accessToken;

  const empty = {
    event: null,
    reservations: [] as EventReservation[],
    organisationId,
    locale,
  };

  let eventId: string;
  try {
    eventId = extractIdFromSlug(slug);
  } catch {
    return empty;
  }

  const headers = {
    "Content-Type": "application/json",
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
    Authorization: `Bearer ${accessToken}`,
  };

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/events/${eventId}`,
    { method: "GET", headers, cache: "no-store" },
  );

  // The API omits its data keys on error, so guard before reading.
  const response = await request.json().catch(() => null);
  const event: Event | undefined = response?.event;

  // A published event has its own, richer screens. Sending it back as "not
  // found" keeps this route from rendering a teaser UI over a live event.
  if (!request.ok || !event || !event.isComingSoon) {
    return empty;
  }

  if (!withReservations) {
    return { ...empty, event };
  }

  /**
   * Non-fatal: the teaser itself is the point of these screens, so a failure
   * here degrades to an empty list rather than erroring out the whole page.
   */
  let reservations: EventReservation[] = [];
  try {
    const reservationsRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/events/${eventId}/reservations`,
      { method: "GET", headers, cache: "no-store" },
    );
    const reservationsResponse = await reservationsRequest
      .json()
      .catch(() => null);
    reservations = reservationsResponse?.reservations ?? [];
  } catch {
    reservations = [];
  }

  return { ...empty, event, reservations };
}
