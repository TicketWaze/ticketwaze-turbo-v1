import TrackActivityView from "@/components/activity/TrackActivityView";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Season, SeasonMatch } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import { notFound } from "next/navigation";
import AnimatedEventPage from "../../[slug]/AnimatedEventPage";
import Map from "../../[slug]/MapComponent";
import EventImageLightbox from "@/components/shared/EventImageLightbox";
import OrganisationSummary from "@/components/shared/OrganisationSummary";
import TeamCrest from "@/components/shared/TeamCrest";
import { Link } from "@/i18n/navigation";
import { extractIdFromSlug, slugify } from "@/lib/Slugify";
import { getActivityCardPrice } from "@/lib/activityCardPrice";
import { formatMoney } from "@ticketwaze/currency";
import { Cup, Location, RouteSquare } from "iconsax-reactjs";
import { DateTime } from "luxon";
import type { Metadata } from "next";
import { publicPageMetadata, snippet } from "@/lib/seoMetadata";

type PublicPass = {
  seasonPassTypeId: string;
  name: string;
  description: string | null;
  price: number;
  usdPrice: number;
  currency: "HTG" | "USD";
  remaining: number;
};

type PublicOrganisation = {
  organisationId: string;
  organisationName: string;
  profileImageUrl: string | null;
  isVerified: boolean;
};

/** Same request as the page below; Next dedupes it into one. */
async function fetchSeason(slug: string) {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/explore/seasons/${extractIdFromSlug(slug)}`,
    // Public and identical for every visitor; checkout re-checks availability.
    { next: { revalidate: 60 } },
  ).catch(() => null);
  if (!request?.ok) return null;
  const response = await request.json().catch(() => null);
  if (!response?.season) return null;
  return response as {
    season: Season;
    passTypes?: PublicPass[];
    organisation: PublicOrganisation;
    matches: SeasonMatch[];
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const data = await fetchSeason(slug);
  if (!data)
    return { title: { absolute: "Ticketwaze" }, robots: { index: false } };
  const { season } = data;
  return publicPageMetadata({
    locale,
    path: `/explore/season/${slugify(season.name, season.seasonId)}`,
    title: season.name,
    description: snippet(season.description, season.name),
    image: season.coverImageUrl,
  });
}

function Separator() {
  return <div className="bg-neutral-100 h-[0.2rem] w-full shrink-0"></div>;
}

/** Kick-off of a match in its own timezone, from its first day. */
function kickOff(match: SeasonMatch) {
  const day = [...(match.event.eventDays ?? [])].sort(
    (a, b) => a.dayNumber - b.dayNumber,
  )[0];
  if (!day) return null;
  return DateTime.fromISO(
    `${String(day.eventDate).slice(0, 10)}T${day.startTime}`,
    { zone: day.timezone },
  );
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchSeason(slug);
  if (!data) notFound();
  const { season, organisation, matches } = data;
  const passTypes = data.passTypes ?? [];
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("Season");

  // Per-user, so asked separately and never cached (as on the sale page).
  let isFollowing = false;
  if (session?.user?.accessToken) {
    try {
      const followReq = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisation.organisationId}/is-following`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        },
      );
      isFollowing = (await followReq.json())?.isFollowing === true;
    } catch {
      isFollowing = false;
    }
  }

  const upcoming = matches.filter((m) => !m.isOver);
  // Most recent first: the last result is the one people look for.
  const played = matches.filter((m) => m.isOver).reverse();
  const venue = [season.venueName, season.address, season.city]
    .filter(Boolean)
    .join(", ");
  const hasCoordinates =
    Number.isFinite(season.location?.lat) &&
    Number.isFinite(season.location?.lng);

  const matchRow = (match: SeasonMatch) => {
    const starts = kickOff(match)?.setLocale(locale);
    const event = match.event;
    const cancelled = Boolean(event.cancelledAt);
    const price = getActivityCardPrice(event);
    const ticketTypes = event.eventTicketTypes ?? [];
    const soldOut =
      ticketTypes.length > 0 &&
      ticketTypes.every(
        (tt) => tt.ticketTypeQuantity - tt.ticketTypeQuantitySold <= 0,
      );
    const status = cancelled
      ? t("page.cancelled")
      : match.isOver
        ? t("page.played")
        : soldOut
          ? t("page.soldOut")
          : price.kind === "priced"
            ? `${t("page.from")} ${price.amount.toLocaleString(locale)} ${price.currency}`
            : t("page.free");

    const row = (
      <div
        className={`flex items-center gap-4 lg:gap-6 rounded-[15px] border border-neutral-100 bg-white p-4 lg:p-6 transition-all duration-200 ${cancelled || match.isOver ? "opacity-70" : "hover:-translate-y-0.5 hover:shadow-lg"}`}
      >
        <div className="flex w-20 shrink-0 flex-col items-center text-center">
          {starts ? (
            <>
              <span className="text-[1.2rem] uppercase text-neutral-600">
                {starts.toFormat("ccc")}
              </span>
              <span className="font-primary font-medium text-[2.2rem] leading-10 text-deep-100">
                {starts.toFormat("d")}
              </span>
              <span className="text-[1.2rem] uppercase text-neutral-600">
                {starts.toFormat("LLL")}
              </span>
            </>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TeamCrest
              name={match.homeTeamName}
              logoUrl={match.homeTeamLogoUrl}
              size={24}
            />
            <span className="truncate text-[1.4rem] font-medium leading-8 text-deep-100">
              {match.homeTeamName}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <TeamCrest
              name={match.awayTeamName}
              logoUrl={match.awayTeamLogoUrl}
              size={24}
            />
            <span className="truncate text-[1.4rem] font-medium leading-8 text-deep-100">
              {match.awayTeamName}
            </span>
          </div>
          <span className="text-[1.2rem] leading-6 text-neutral-600 truncate">
            {[
              match.round,
              starts?.toFormat(locale === "fr" ? "HH:mm" : "h:mm a"),
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        <span
          className={`shrink-0 text-right text-[1.3rem] font-semibold leading-8 ${cancelled || soldOut ? "text-failure" : match.isOver ? "text-neutral-600" : "text-primary-500"}`}
        >
          {status}
        </span>
      </div>
    );

    // A cancelled match has no page to go to: the API stops serving it.
    return (
      <li key={match.eventId}>
        {cancelled ? (
          row
        ) : (
          <Link href={`/explore/${slugify(event.eventName, event.eventId)}`}>
            {row}
          </Link>
        )}
      </li>
    );
  };

  const details = (
    <div className="flex flex-col gap-8">
      <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
        {t("page.details")}
      </span>
      <OrganisationSummary
        organisation={organisation}
        isFollowing={isFollowing}
      />
      <div className="flex items-center gap-4">
        <span className="w-14 h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full">
          <Cup size="20" color="#737c8a" variant="Bulk" />
        </span>
        <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
          {t(`sports.${season.sport}`)} · {season.competition}
        </span>
      </div>
      {venue && (
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full">
            <Location size="20" color="#737c8a" variant="Bulk" />
          </span>
          <span className="flex flex-col">
            <span className="text-[1.2rem] leading-6 text-neutral-600">
              {t("page.homeVenue")}
            </span>
            <span className="font-normal text-[1.4rem] leading-8 text-deep-200">
              {venue}
            </span>
          </span>
        </div>
      )}
      {hasCoordinates && season.location && (
        <>
          <Separator />
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
                {t("page.direction")}
              </span>
              <Link
                href={`https://www.google.com/maps/search/?api=1&query=${season.location.lat},${season.location.lng}`}
                target="_blank"
                className="group flex items-center gap-4 text-[1.6rem] leading-8 text-primary-500"
              >
                {t("page.open")}{" "}
                <RouteSquare
                  variant="Bulk"
                  color="#E45B00"
                  size={20}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
            <Map location={season.location} />
          </div>
        </>
      )}
    </div>
  );

  return (
    <AttendeeLayout title={season.name}>
      <TrackActivityView activityId={season.seasonId} />
      <AnimatedEventPage>
        <BackButton text={t("page.back")} />
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {season.name}
        </span>
        <div className="flex flex-col gap-12 lg:min-h-0 lg:overflow-y-auto lg:h-full -mx-4 px-4">
          <main className="w-full gap-8 lg:gap-16 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:items-start">
            <div className="flex flex-col gap-8">
              <EventImageLightbox
                src={season.coverImageUrl}
                alt={season.name}
                width={580}
                height={298}
              />
              {/* Passes are on sale until the last match: nothing to sell once
                  no match is left to play. */}
              {passTypes.length > 0 && upcoming.length > 0 && (
                <section className="flex flex-col gap-6 rounded-[20px] bg-primary-50/50 border border-primary-500/15 p-6">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-[1.7rem] leading-8 text-deep-100">
                      {t("passes.title")}
                    </span>
                    <span className="text-[1.4rem] leading-8 text-neutral-700">
                      {t("passes.hint", { count: upcoming.length })}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-4">
                    {passTypes.map((pass) => {
                      const soldOut = pass.remaining <= 0;
                      return (
                        <li
                          key={pass.seasonPassTypeId}
                          className="flex flex-col lg:flex-row lg:items-center gap-4 rounded-[15px] bg-white border border-neutral-100 p-5"
                        >
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                              {pass.name}
                            </span>
                            {pass.description && (
                              <span className="text-[1.4rem] leading-7 text-neutral-600">
                                {pass.description}
                              </span>
                            )}
                            <span className="text-[1.3rem] leading-7 text-neutral-600">
                              {soldOut
                                ? t("page.soldOut")
                                : t("passes.left", { count: pass.remaining })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0">
                            <span className="font-primary font-medium text-[1.8rem] text-primary-500">
                              {formatMoney(
                                pass.currency === "USD"
                                  ? pass.usdPrice
                                  : pass.price,
                                pass.currency,
                                locale,
                              )}
                            </span>
                            {soldOut ? (
                              <span className="rounded-[30px] bg-neutral-100 px-6 py-3 text-[1.4rem] text-neutral-600">
                                {t("page.soldOut")}
                              </span>
                            ) : (
                              <Link
                                href={`/explore/season/${slug}/checkout?pass=${pass.seasonPassTypeId}`}
                                className="rounded-[30px] bg-primary-500 hover:bg-primary-600 transition-colors px-8 py-3 text-[1.4rem] font-medium text-white"
                              >
                                {t("passes.buy")}
                              </Link>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
              <section className="flex flex-col gap-6">
                <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                  {t("page.upcoming")}
                </span>
                {upcoming.length > 0 ? (
                  <ul className="flex flex-col gap-4">
                    {upcoming.map(matchRow)}
                  </ul>
                ) : (
                  <p className="text-[1.5rem] leading-9 text-neutral-600">
                    {t("page.noUpcoming")}
                  </p>
                )}
              </section>
              {played.length > 0 && (
                <section className="flex flex-col gap-6">
                  <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                    {t("page.played_title")}
                  </span>
                  <ul className="flex flex-col gap-4">
                    {played.map(matchRow)}
                  </ul>
                </section>
              )}
              <Separator />
              <div className="flex flex-col gap-4">
                <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                  {t("page.about")}
                </span>
                <div
                  className="rich-text text-[1.6rem] font-sans leading-10 text-neutral-700"
                  dangerouslySetInnerHTML={{ __html: season.description }}
                />
              </div>
              <div className="lg:hidden flex flex-col gap-8">
                <Separator />
                {details}
              </div>
            </div>
            <aside className="hidden lg:flex flex-col gap-8 lg:sticky lg:top-0">
              {details}
            </aside>
          </main>
        </div>
      </AnimatedEventPage>
    </AttendeeLayout>
  );
}
