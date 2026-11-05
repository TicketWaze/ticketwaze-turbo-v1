import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { DateTime } from "luxon";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { Link, redirect } from "@/i18n/navigation";
import {
  HeldSeasonPass,
  Season,
  SeasonMatch,
} from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import OrganisationSummary from "@/components/shared/OrganisationSummary";
import TeamCrest from "@/components/shared/TeamCrest";
import { extractIdFromSlug, slugify } from "@/lib/Slugify";
import AnimatedEventPage from "../../../explore/[slug]/AnimatedEventPage";
import PassViewer from "./PassViewer";

function Separator() {
  return <div className="bg-neutral-100 h-[0.2rem] w-full shrink-0"></div>;
}

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

/**
 * The holder's own page for a season they have a pass to: the pass QR, and
 * the matches it gets them into. The buyer's counterpart of the public season
 * page, as /upcoming/raffle is to the public raffle page.
 */
export default async function MySeasonPassPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  if (!session) redirect({ href: "/auth/login", locale });

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/season-passes/mine/${extractIdFromSlug(slug)}`,
    {
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  ).catch(() => null);
  // 404 when the caller holds no pass here: "not yours" reads as not found.
  if (!request?.ok) notFound();
  const response = await request.json().catch(() => null);
  if (!response?.season) notFound();

  const season: Season = response.season;
  const passes: HeldSeasonPass[] = response.passes ?? [];
  const matches: SeasonMatch[] = response.matches ?? [];
  const t = await getTranslations("Season");

  // Per-user, so asked separately and never cached (as on the season page).
  let isFollowing = false;
  try {
    const followReq = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${response.organisation.organisationId}/is-following`,
      {
        headers: { Authorization: `Bearer ${session?.user.accessToken}` },
        cache: "no-store",
      },
    );
    isFollowing = (await followReq.json())?.isFollowing === true;
  } catch {
    isFollowing = false;
  }

  const upcoming = matches.filter((m) => !m.isOver && !m.event.cancelledAt);

  const matchesBlock = (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
          {t("mine.validFor")}
        </span>
        <span className="text-[1.3rem] leading-8 text-neutral-600">
          {t("mine.laterMatches")}
        </span>
      </div>
      {upcoming.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {upcoming.map((match) => {
            const starts = kickOff(match)?.setLocale(locale);
            return (
              <li key={match.eventId}>
                <Link
                  href={`/explore/${slugify(match.event.eventName, match.eventId)}`}
                  className="flex items-center gap-4 rounded-[15px] border border-neutral-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex w-20 shrink-0 flex-col items-center text-center">
                    {starts && (
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
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {[
                      [match.homeTeamName, match.homeTeamLogoUrl],
                      [match.awayTeamName, match.awayTeamLogoUrl],
                    ].map(([name, logo]) => (
                      <div
                        key={name}
                        className="flex items-center gap-2 min-w-0"
                      >
                        <TeamCrest name={name!} logoUrl={logo} size={22} />
                        <span className="truncate text-[1.4rem] font-medium leading-8 text-deep-100">
                          {name}
                        </span>
                      </div>
                    ))}
                    <span className="text-[1.2rem] leading-6 text-neutral-600 truncate">
                      {[
                        match.round,
                        starts?.toFormat(locale === "fr" ? "HH:mm" : "h:mm a"),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[1.5rem] leading-9 text-neutral-600">
          {t("mine.noUpcoming")}
        </p>
      )}
    </section>
  );

  return (
    <AttendeeLayout title={season.name}>
      <AnimatedEventPage>
        <BackButton text={t("page.back")} />
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {season.name}
        </span>
        <div className="flex flex-col gap-12 lg:min-h-0 lg:overflow-y-auto lg:h-full -mx-4 px-4">
          <main className="w-full gap-8 lg:gap-16 flex flex-col lg:grid lg:grid-cols-[23fr_29fr] lg:items-start">
            <div className="flex flex-col gap-8 lg:sticky lg:top-0">
              <PassViewer
                passes={passes}
                seasonName={season.name}
              />
            </div>
            <div className="flex flex-col gap-8">
              {matchesBlock}
              <Separator />
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
                {t("page.details")}
              </span>
              <OrganisationSummary
                organisation={response.organisation}
                isFollowing={isFollowing}
              />
              <Link
                href={`/explore/season/${slugify(season.name, season.seasonId)}`}
                className="text-[1.5rem] leading-8 text-primary-500"
              >
                {t("mine.seasonPage")}
              </Link>
            </div>
          </main>
        </div>
      </AnimatedEventPage>
    </AttendeeLayout>
  );
}
