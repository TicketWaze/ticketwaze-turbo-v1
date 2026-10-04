"use client";
import { Calendar2, Global, Google, Location, Video } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { slugify } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import FormatDate from "@/lib/FormatDate";
import ActivityCard, { CardBadge, CardMeta, CardPrice } from "./ActivityCard";

const ICON = { size: "15", color: "#2e3237", variant: "Bulk" } as const;

/** The badge an event needs, if any: review states, deletion. Approved = none. */
export function eventBadge(
  event: Event,
  t: (key: string) => string,
): CardBadge | null {
  if (event.deletionStatus === "deleted")
    return { label: t("deleted"), tone: "muted" };
  if (event.adminStatus === "requested")
    return { label: t("badge.requested"), tone: "neutral" };
  if (event.adminStatus === "review")
    return { label: t("badge.review"), tone: "warning" };
  if (event.adminStatus === "rejected")
    return { label: t("badge.rejected"), tone: "failure" };
  // An edit to an approved event is reviewed after the fact: still live and
  // selling, with a look owed on it.
  if (event.adminStatus === "approved" && event.pendingReviewAt)
    return { label: t("edit_under_review"), tone: "warning" };
  return null;
}

/** Cheapest to dearest ticket, in the event's own currency. */
export function eventPriceRange(event: Event): [number, number] {
  const prices = (event.eventTicketTypes ?? []).map((tt) =>
    Number(event.currency === "USD" ? tt.usdPrice : tt.ticketTypePrice),
  );
  if (prices.length === 0) return [0, 0];
  return [Math.min(...prices), Math.max(...prices)];
}

function EventCard({ event, ongoing }: { event: Event; ongoing?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("Events");
  const isTeaser = event.isComingSoon === true;
  const slug = slugify(event.eventName, event.eventId);
  const firstDay = event.eventDays?.find((d) => d.dayNumber === 1);
  const [min, max] = eventPriceRange(event);
  const num = (n: number) => n.toLocaleString(locale);

  const date = firstDay
    ? FormatDate(firstDay.eventDate, locale, firstDay.timezone)
    : event.comingSoonDate
      ? // A bare "YYYY-MM-DD" parses as UTC; T00:00:00 keeps it local.
        new Date(`${event.comingSoonDate}T00:00:00`).toLocaleDateString(
          locale,
          { day: "numeric", month: "short", year: "numeric" },
        )
      : (event.comingSoonHint ?? t("coming_soon_label"));

  const place =
    event.eventCategory === "meet" ? (
      <CardMeta
        icon={
          event.onlineProvider === "zoom" ? (
            <Video {...ICON} />
          ) : event.onlineProvider === "custom" ? (
            <Global {...ICON} />
          ) : (
            <Google {...ICON} />
          )
        }
      >
        {event.onlineProvider === "zoom" ? (
          "Zoom"
        ) : event.onlineProvider === "custom" ? (
          t("online_link_label")
        ) : (
          <>
            Meet, <span className="font-normal text-neutral-700">Google</span>
          </>
        )}
      </CardMeta>
    ) : // A teaser may have no venue yet; "null, null" would print a bare comma.
    event.city ? (
      <CardMeta icon={<Location {...ICON} />}>
        {event.city},{" "}
        <span className="font-normal text-neutral-700">{event.country}</span>
      </CardMeta>
    ) : undefined;

  return (
    <ActivityCard
      href={isTeaser ? `/events/coming-soon/${slug}` : `/events/show/${slug}`}
      imageUrl={event.eventImageUrl}
      title={event.eventName}
      badge={eventBadge(event, t)}
      liveBadge={
        ongoing ? { label: t("ongoing"), tone: "success", pulse: true } : null
      }
      meta={[
        <CardMeta key="d" icon={<Calendar2 {...ICON} />}>
          {date}
        </CardMeta>,
        place,
      ]}
      price={
        // A teaser has no ticket types; "Free" would advertise a sale that
        // does not exist yet.
        isTeaser ? (
          <CardPrice amount={t("coming_soon_label")} />
        ) : max > 0 ? (
          <CardPrice
            amount={min === max ? num(min) : `${num(min)}–${num(max)}`}
            unit={event.currency}
          />
        ) : (
          <CardPrice amount={t("free")} />
        )
      }
    />
  );
}

export default EventCard;
