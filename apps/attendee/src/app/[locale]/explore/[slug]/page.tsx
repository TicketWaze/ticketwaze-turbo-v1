/* eslint-disable @typescript-eslint/no-explicit-any */
import TrackActivityView from "@/components/activity/TrackActivityView";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import Image from "next/image";
import EventActions from "./EventActions";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Calendar2,
  Call,
  Clock,
  Global,
  Google,
  Location,
  People,
  RouteSquare,
  SecurityUser,
  Sms,
  Video,
} from "iconsax-reactjs";
import RecommendedActivities from "@/components/activity/RecommendedActivities";
import { pickRecommendations } from "@/lib/recommendations";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import FollowButton from "./FollowButton";
import { auth } from "@/lib/auth";
import Map from "./MapComponent";
import { Link, redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import AddToCalendar from "./AddToCalendar";
import { Metadata } from "next";
import { Event } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import Capitalize from "@/lib/Capitalize";
import { extractIdFromSlug, slugify } from "@/lib/Slugify";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import AnimatedEventPage from "./AnimatedEventPage";
import EventImageLightbox from "@/components/shared/EventImageLightbox";
import isEventPast from "@/lib/isEventPast";
import isEventSalesEnded from "@/lib/isEventSalesEnded";
import { DateTime } from "luxon";
import { publicPageMetadata, snippet } from "@/lib/seoMetadata";
import {
  JsonLd,
  buildEventJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/structuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const eventId = extractIdFromSlug(slug);
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
    // Cached: this view is public and identical for every visitor, so an
    // uncached fetch bills a Vercel function AND a Railway request per page
    // view. Checkout re-checks availability server-side, so a minute-stale
    // sold-out badge cannot oversell anything.
    { next: { revalidate: 60 } },
  );
  const eventResponse = await eventRequest.json().catch(() => null);
  const event: Event | undefined = eventResponse?.event;

  // Metadata must not throw. The API omits `event` for an event that is
  // deleted, cancelled or unapproved, and the page below answers that with
  // notFound() — but generateMetadata runs first, so it needs its own answer.
  if (!event)
    return { title: { absolute: "Ticketwaze" }, robots: { index: false } };

  const t = await getTranslations({ locale, namespace: "Metadata" });
  // Where and when, the two things people scan a search result for. A teaser
  // has neither yet, so both are optional.
  const firstDay = [...(event.eventDays ?? [])].sort(
    (a, b) => a.dayNumber - b.dayNumber,
  )[0];
  const date = firstDay
    ? DateTime.fromISO(String(firstDay.eventDate), { zone: "utc" })
        .setLocale(locale)
        .toFormat("d LLL yyyy")
    : null;
  const where = [event.city, date].filter(Boolean).join(", ");
  const title = `${event.eventName} – ${t("event.tickets")}${where ? ` · ${where}` : ""}`;
  const body = snippet(
    event.eventDescription,
    t("event.fallbackDescription", { name: event.eventName }),
  );
  const description = where ? `${where}. ${body}` : body;

  return {
    ...publicPageMetadata({
      locale,
      // The canonical slug, whatever spelling the visitor arrived on.
      path: `/explore/${slugify(event.eventName, event.eventId)}`,
      title,
      description,
      image: event.eventImageUrl,
    }),
    // Private events are reachable by link only; keep them out of search.
    ...(event.isPrivate && { robots: { index: false, follow: false } }),
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const session = await auth();
  const locale = await getLocale();
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
    // Cached: this view is public and identical for every visitor, so an
    // uncached fetch bills a Vercel function AND a Railway request per page
    // view. Checkout re-checks availability server-side, so a minute-stale
    // sold-out badge cannot oversell anything.
    { next: { revalidate: 60 } },
  );
  const eventResponse = await eventRequest.json().catch(() => null);

  // Same guard as the checkout page: the API omits `event` entirely when it is
  // unavailable, and every line below assumes it exists.
  if (!eventRequest.ok || !eventResponse?.event) notFound();

  const event: Event = eventResponse.event;
  const organisation = eventResponse.organisation;
  const eventPerformers = event.eventPerformers;

  /**
   * A teaser has no venue yet — address, city, state and country are all null —
   * so the parts are filtered before joining. Rendering them raw printed ", , ,"
   * for a teaser, and the state in particular crashed the page outright.
   * Empty means there is nothing to show, so the row is skipped entirely.
   */
  const locationLabel = [
    event.address,
    event.city,
    Capitalize(event.state),
    event.country,
  ]
    .filter(Boolean)
    .join(", ");

  /**
   * `location` is null on a teaser too, so the map and the "get directions"
   * link have to be gated on real coordinates rather than on the event merely
   * not being online. Checked for finite numbers, not just presence: a
   * half-populated location object would render a map pointed at NaN.
   */
  const hasCoordinates =
    typeof event.location?.lat === "number" &&
    typeof event.location?.lng === "number" &&
    Number.isFinite(event.location.lat) &&
    Number.isFinite(event.location.lng);
  const t = await getTranslations("Event");

  if (event.eventType === "private") {
    return (
      <AttendeeLayout title={event.eventName}>
        <TrackActivityView activityId={event.eventId} />
        <AnimatedEventPage>
          <BackButton text={t("back")} />
          <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
            {event.eventName}
          </span>
          <div
            className={
              "w-132 lg:w-184 mx-auto h-full justify-center flex flex-col items-center gap-20"
            }
          >
            <div
              className={
                "w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100"
              }
            >
              <div
                className={
                  "w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200"
                }
              >
                <SecurityUser size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <div className={"flex flex-col gap-12 items-center text-center"}>
              <p
                className={
                  "text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]"
                }
              >
                {t("notInvited")}
              </p>
            </div>
          </div>
        </AnimatedEventPage>
      </AttendeeLayout>
    );
  }

  /*
   * Favourite state, for signed-in visitors only.
   *
   * GUARDED ON THE TOKEN, matching the raffle, sale and restaurant pages.
   * Without the guard the header was built as `Bearer ${session?.user...}`,
   * which stringifies to the literal "Bearer undefined" when nobody is signed
   * in: a guaranteed 401 on every anonymous view of every event page, and one
   * "Authentication Failed" alert in #logs for each.
   *
   * Nobody signed out has favourites, so there is nothing to ask for.
   */
  let isFavorite = false;
  if (session?.user?.accessToken) {
    try {
      const favoriteRequest = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/favorite`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
            "Content-Type": "application/json",
          },
          // Explicit, not merely Next's default: this response is per-user, and
          // the public fetches on this page ARE cached. Anything that caches it
          // would serve one visitor's favourite state to everyone.
          cache: "no-store",
        },
      );
      const favoriteResponse = await favoriteRequest.json();
      isFavorite = favoriteResponse?.isFavorite === true;
    } catch {
      isFavorite = false;
    }
  }

  /**
   * Reservation state for a teaser. The count rides along on the cached public
   * payload because it is identical for everyone; whether *this* viewer holds a
   * place is per-user, so it is fetched separately and never cached — the same
   * split the favourite state uses just above.
   */
  const reservationCount: number = eventResponse.reservationCount ?? 0;
  let hasReserved = false;
  if (event.isComingSoon && session?.user?.accessToken) {
    try {
      const reservationRequest = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/reservation`,
        {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );
      const reservationResponse = await reservationRequest.json();
      hasReserved = reservationResponse?.hasReserved === true;
    } catch {
      hasReserved = false;
    }
  }

  const isFollowing = organisation.followers.filter(
    (follower: any) => follower.userId === session?.user.userId,
  );

  // "500+ sold": rounded down to a milestone, and hidden below 10 so a quiet
  // start isn't advertised.
  const sold = (event.eventTicketTypes ?? []).reduce(
    (total, type) => total + (type.ticketTypeQuantitySold ?? 0),
    0,
  );
  const soldMilestone = [10000, 5000, 1000, 500, 250, 100, 50, 10].find(
    (step) => sold >= step,
  );
  const soldText = soldMilestone
    ? t("soldCount", {
        count:
          soldMilestone >= 1000 ? `${soldMilestone / 1000}k` : soldMilestone,
      })
    : null;
  const isOnline = event.eventCategory === "meet";

  // Other activities for the bottom row (same cached list explore uses).
  let recommendations: Event[] = [];
  try {
    const listRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events`,
      {
        next: { revalidate: 60 },
      },
    );
    const list = await listRequest.json();
    recommendations = pickRecommendations(event, [
      ...(list?.events ?? []),
      ...(list?.comingSoon ?? []),
    ]);
  } catch {
    recommendations = [];
  }

  const layoutT = await getTranslations("Layout");
  const eventUrl = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/${slug}`;
  const eventJsonLd = buildEventJsonLd({
    event,
    organisation,
    url: eventUrl,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: layoutT("sidebar.links.explore"), path: `/${locale}/explore` },
    { name: event.eventName },
  ]);

  const details = (
    <div className="flex flex-col gap-8">
      <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
        {t("details")}
      </span>
      <div className="flex items-center justify-between w-full gap-4">
        <Link
          href={`/organisations/${slugify(organisation.organisationName, organisation.organisationId)}`}
          className="flex items-center gap-4 min-w-0"
        >
          {organisation?.profileImageUrl ? (
            <Image
              src={organisation.profileImageUrl}
              width={35}
              height={35}
              alt={organisation.organisationName}
              className="rounded-full size-14 object-cover"
            />
          ) : (
            <span className="w-14 h-14 shrink-0 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-12 font-primary">
              {organisation?.organisationName.slice()[0]?.toUpperCase()}
            </span>
          )}
          <span className="flex flex-col min-w-0">
            <span className="font-normal text-[1.4rem] leading-8 text-deep-200 truncate">
              {organisation.organisationName}{" "}
              {organisation.isVerified && <VerifiedOrganisationCheckMark />}
            </span>
            <span className="font-normal text-[1.3rem] leading-8 text-neutral-600">
              {organisation.followers.length} {t("followers")}
            </span>
          </span>
        </Link>
        <FollowButton
          organisationId={event.organisationId}
          initialIsFollowing={isFollowing.length > 0}
        />
      </div>
      <ul className="flex flex-col gap-8">
        {event.eventDays.map((eventDate) => (
          <li key={eventDate.eventDayId} className="flex flex-col w-full gap-6">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full">
                <Calendar2 size="20" color="#737c8a" variant="Bulk" />
              </span>
              <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
                {formatDate(eventDate.eventDate, locale, eventDate.timezone)}
              </span>
              {!isOnline && <AddToCalendar event={event} />}
            </div>
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full">
                <Clock size="20" color="#737c8a" variant="Bulk" />
              </span>
              <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
                {formatTime(eventDate.startTime, eventDate.timezone, locale)} -{" "}
                {formatTime(eventDate.endTime, eventDate.timezone, locale)}{" "}
                <span className="text-neutral-600">
                  (
                  {timezoneAbbreviation(
                    eventDate.timezone,
                    String(eventDate.eventDate),
                    locale,
                  )}
                  )
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      {isOnline && <OnlinePlatform provider={event.onlineProvider} />}
      {!isOnline && locationLabel && (
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full">
            <Location size="20" color="#737c8a" variant="Bulk" />
          </span>
          <span className="font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[29.3rem]">
            {locationLabel}
          </span>
        </div>
      )}
      {soldText && (
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full">
            <People size="20" color="#737c8a" variant="Bulk" />
          </span>
          <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
            {soldText}
          </span>
        </div>
      )}
    </div>
  );

  // Under the details: the map for an in-person activity, or Figma's "Note"
  // for an online one (the link arrives with the ticket).
  const whereBlock = isOnline ? (
    <>
      <Separator />
      <div className="flex flex-col gap-4">
        <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
          {t("note")}
        </span>
        <p className="text-[1.5rem] leading-9 text-neutral-700">
          {t("onlineNote")}
        </p>
      </div>
    </>
  ) : hasCoordinates ? (
    <>
      <Separator />
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
            {t("direction")}
          </span>
          <Link
            href={`https://www.google.com/maps/search/?api=1&query=${event.location.lat},${event.location.lng}`}
            target="_blank"
            className="group flex items-center gap-4 text-[1.6rem] leading-8 text-primary-500"
          >
            {t("open")}{" "}
            <RouteSquare
              variant="Bulk"
              color="#E45B00"
              size={20}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
        <Map location={event.location} />
      </div>
    </>
  ) : null;

  const website = organisation.organisationWebsite as string | undefined;
  const contact =
    organisation.organisationEmail ||
    organisation.organisationPhoneNumber ||
    website ? (
      <>
        <Separator />
        <div className="flex flex-col gap-6">
          <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
            {t("contact")}
          </span>
          <div className="flex flex-col gap-4">
            {organisation.organisationEmail && (
              <a
                href={`mailto:${organisation.organisationEmail}`}
                className="flex items-center gap-4 text-[1.5rem] leading-8 text-neutral-700 hover:text-primary-500 transition-colors w-fit"
              >
                <Sms size="20" color="#737c8a" variant="Bulk" />
                {organisation.organisationEmail}
              </a>
            )}
            {organisation.organisationPhoneNumber && (
              <a
                href={`tel:${String(organisation.organisationPhoneNumber).replace(/\s+/g, "")}`}
                className="flex items-center gap-4 text-[1.5rem] leading-8 text-neutral-700 hover:text-primary-500 transition-colors w-fit"
              >
                <Call size="20" color="#737c8a" variant="Bulk" />
                {organisation.organisationPhoneNumber}
              </a>
            )}
            {website && (
              <a
                href={
                  /^https?:\/\//.test(website) ? website : `https://${website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-[1.5rem] leading-8 text-neutral-700 underline underline-offset-4 hover:text-primary-500 transition-colors w-fit"
              >
                <Global size="20" color="#737c8a" variant="Bulk" />
                {website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </>
    ) : null;

  return (
    <AttendeeLayout title={event.eventName}>
      <TrackActivityView activityId={event.eventId} />
      <JsonLd data={eventJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <AnimatedEventPage>
        <BackButton text={t("back")} />
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {event.eventName}
        </span>
        {/* One scroll area: the two columns, then the full-width row of
            recommendations under both (Figma "Event summary + more"). */}
        <div className="flex flex-col gap-12 lg:min-h-0 lg:overflow-y-auto lg:h-full -mx-4 px-4">
          <main className="w-full gap-8 lg:gap-16 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:items-start">
            <div className="flex flex-col gap-8">
              <EventImageLightbox
                src={event.eventImageUrl}
                alt={event.eventName}
                width={580}
                height={298}
              />
              <EventActions
                event={event}
                isFavorite={isFavorite}
                isPast={isEventPast(event)}
                salesEnded={isEventSalesEnded(event)}
                hasReserved={hasReserved}
                reservationCount={reservationCount}
              />
              <Separator />
              <div className="flex flex-col gap-4">
                <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                  {t("about")}
                </span>
                <div
                  className="rich-text text-[1.6rem] font-sans leading-10 text-neutral-700"
                  dangerouslySetInnerHTML={{ __html: event.eventDescription }}
                />
              </div>
              {eventPerformers.length > 0 && (
                <>
                  <Separator />
                  <ul className=" grid grid-cols-[repeat(auto-fill,12rem)] justify-center lg:justify-start items-start gap-8 w-full shrink-0">
                    {eventPerformers.map((eventPerformer) => (
                      <li
                        key={eventPerformer.eventPerformerId}
                        className="shrink-0"
                      >
                        <Link
                          href={eventPerformer.performerLink}
                          target="_blank"
                          className="group flex flex-col items-center gap-3 w-48"
                        >
                          <span className="flex items-center justify-center w-48 h-48 overflow-hidden rounded-full">
                            <Image
                              src={eventPerformer.performerProfileUrl}
                              width={120}
                              height={120}
                              loading="eager"
                              alt={eventPerformer.performerName}
                            />
                          </span>
                          {/* Circle-wide and cut with an ellipsis, so a long name
                              cannot push the row apart; the full name on hover. */}
                          <span
                            title={eventPerformer.performerName}
                            className="block w-full truncate text-center text-[1.4rem] font-medium leading-8 text-deep-100 group-hover:text-primary-500 transition-colors"
                          >
                            {eventPerformer.performerName}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {contact}
              <div className="lg:hidden flex flex-col gap-8">
                <Separator />
                {details}
                {whereBlock}
              </div>
            </div>
            <aside className="hidden lg:flex flex-col gap-8 lg:sticky lg:top-0">
              {details}
              {whereBlock}
            </aside>
          </main>
          <RecommendedActivities
            title={t("recommended")}
            events={recommendations}
          />
        </div>
      </AnimatedEventPage>
    </AttendeeLayout>
  );
}

function Separator() {
  return <div className="bg-neutral-100 h-[0.2rem] w-full shrink-0"></div>;
}

/**
 * The "where" line for an online event.
 *
 * `eventCategory === "meet"` only says the event is online — Zoom was added as
 * a provider on that same category, so it is true of Zoom events too and does
 * not tell you which platform to name. That is `onlineProvider`. Anything other
 * than Zoom is Google Meet, which is what an online event meant before Zoom.
 */
function OnlinePlatform({ provider }: { provider: string | null | undefined }) {
  const isZoom = provider === "zoom";
  // An organiser's own link: we only know it is online, not which tool.
  const isCustom = provider === "custom";
  return (
    <div className={"flex items-center gap-2 "}>
      <div
        className={
          "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
        }
      >
        {isZoom ? (
          <Video size="20" color="#737c8a" variant="Bulk" />
        ) : isCustom ? (
          <Global size="20" color="#737c8a" variant="Bulk" />
        ) : (
          <Google size="20" color="#737c8a" variant="Bulk" />
        )}
      </div>
      <span
        className={
          "font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[29.3rem]"
        }
      >
        {isZoom ? "Zoom" : isCustom ? "Online" : "Meet, Google"}
      </span>
    </div>
  );
}

/**
 * "EDT", "GMT-5", … for the activity's own timezone on that day — shorter than
 * the IANA name the times used to end with, and still enough for a visitor
 * abroad to know which clock the times are on.
 */
function timezoneAbbreviation(timezone: string, day: string, locale: string) {
  try {
    const date = new Date(`${day.slice(0, 10)}T12:00:00Z`);
    return (
      new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        timeZoneName: "short",
      })
        .formatToParts(date)
        .find((part) => part.type === "timeZoneName")?.value ?? timezone
    );
  } catch {
    return timezone;
  }
}
