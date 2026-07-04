import { DateTime } from "luxon";
import { Event, Organisation } from "@ticketwaze/typescript-config";
import StripHtml from "./StripHtml";
import Capitalize from "./Capitalize";

const BASE_URL = process.env.NEXT_PUBLIC_ATTENDEE_URL ?? "";
// Must match the @id declared by the marketing site (apps/website) so Google
// links both properties to the same organisation entity.
const ORGANIZATION_ID = "https://ticketwaze.com/#organization";

/**
 * Renders a JSON-LD script tag. Safe to use with API data: JSON.stringify
 * output is further escaped so `</script>` can never break out of the tag.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

// Local wall-clock date + time in the event day's own timezone, as ISO 8601
// with the timezone offset Google requires. Mirrors isEventPast's parsing.
function toIsoWithOffset(
  eventDate: string,
  time: string,
  timezone: string,
): string | undefined {
  const datePart = DateTime.fromISO(String(eventDate), {
    zone: "utc",
  }).toISODate();
  if (!datePart) return undefined;
  const dt = DateTime.fromISO(`${datePart}T${time}`, { zone: timezone });
  return dt.isValid ? (dt.toISO({ suppressMilliseconds: true }) ?? undefined) : undefined;
}

/** Google Event rich result — for public event detail pages. */
export function buildEventJsonLd({
  event,
  organisation,
  url,
}: {
  event: Event;
  organisation: Organisation;
  url: string;
}) {
  const sortedDays = [...event.eventDays].sort(
    (a, b) => a.dayNumber - b.dayNumber,
  );
  const firstDay = sortedDays[0];
  const lastDay = sortedDays[sortedDays.length - 1];

  const isOnline = event.eventCategory === "meet";
  const hasGeo =
    typeof event.location?.lat === "number" &&
    typeof event.location?.lng === "number";

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.eventName,
    description: StripHtml(event.eventDescription ?? "").slice(0, 500),
    ...(firstDay && {
      startDate: toIsoWithOffset(
        firstDay.eventDate,
        firstDay.startTime,
        firstDay.timezone,
      ),
    }),
    ...(lastDay && {
      endDate: toIsoWithOffset(
        lastDay.eventDate,
        lastDay.endTime,
        lastDay.timezone,
      ),
    }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: isOnline
      ? { "@type": "VirtualLocation", url }
      : {
          "@type": "Place",
          name: event.address,
          address: {
            "@type": "PostalAddress",
            streetAddress: event.address,
            addressLocality: event.city,
            addressRegion: Capitalize(event.state ?? ""),
            addressCountry: event.country,
          },
          ...(hasGeo && {
            geo: {
              "@type": "GeoCoordinates",
              latitude: event.location.lat,
              longitude: event.location.lng,
            },
          }),
        },
    ...(event.eventImageUrl && { image: [event.eventImageUrl] }),
    ...(event.eventPerformers?.length > 0 && {
      performer: event.eventPerformers.map((performer) => ({
        "@type": "Person",
        name: performer.performerName,
        ...(performer.performerLink && { sameAs: [performer.performerLink] }),
      })),
    }),
    organizer: {
      "@type": "Organization",
      name: organisation.organisationName,
      url: `${BASE_URL}/organisations/${organisation.organisationId}`,
    },
    offers: event.eventTicketTypes.map((ticketType) => ({
      "@type": "Offer",
      name: Capitalize(ticketType.ticketTypeName),
      price:
        event.currency === "USD"
          ? ticketType.usdPrice
          : ticketType.ticketTypePrice,
      priceCurrency: event.currency,
      availability:
        ticketType.ticketTypeQuantitySold >= ticketType.ticketTypeQuantity
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      url,
    })),
  };
}

/** Breadcrumb trail for inner pages. Last crumb should omit `path`. */
export function buildBreadcrumbJsonLd(
  crumbs: { name: string; path?: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.path && { item: `${BASE_URL}${crumb.path}` }),
    })),
  };
}

/** Site-wide WebSite + Organization graph, mounted once in the root layout. */
export function buildSiteJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "Ticketwaze",
        description:
          "Easily explore, share, and enjoy the best events your country has to offer.",
        inLanguage: locale,
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "Ticketwaze",
        url: "https://ticketwaze.com",
        logo: {
          "@type": "ImageObject",
          url: "https://ticketwaze.com/opengraph-image.png",
        },
        sameAs: ["https://twitter.com/ticketwaze"],
      },
    ],
  };
}
