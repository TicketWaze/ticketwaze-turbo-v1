"use client";
import { Award, Calendar } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { DateTime } from "luxon";
import { Season } from "@ticketwaze/typescript-config";
import { slugify } from "@/lib/Slugify";
import ActivityCard, { CardBadge, CardMeta, CardPrice } from "./ActivityCard";

const ICON = { size: "15", color: "#2e3237", variant: "Bulk" } as const;

/** Only what needs the organiser's eye wears a badge, as on the other cards. */
export function seasonBadge(
  season: Season,
  t: (key: string) => string,
): CardBadge | null {
  if (season.suspendedAt) {
    return { label: t("seasonCard.status.suspended"), tone: "failure" };
  }
  switch (season.adminStatus) {
    case "rejected":
      return { label: t("seasonCard.status.rejected"), tone: "failure" };
    case "requested":
      return { label: t("seasonCard.status.requested"), tone: "warning" };
    case "review":
      return { label: t("seasonCard.status.review"), tone: "warning" };
    default:
      return null;
  }
}

/** "12 Jan – 30 May 2027", or one date when the season has a single match. */
export function seasonDateRange(season: Season, locale: string): string | null {
  if (!season.startsAt) return null;
  const start = DateTime.fromISO(season.startsAt).setLocale(locale);
  const end = season.endsAt
    ? DateTime.fromISO(season.endsAt).setLocale(locale)
    : start;
  if (start.hasSame(end, "day")) return start.toFormat("d LLL yyyy");
  const startFormat = start.hasSame(end, "year") ? "d LLL" : "d LLL yyyy";
  return `${start.toFormat(startFormat)} – ${end.toFormat("d LLL yyyy")}`;
}

export default function SeasonCard({
  season,
  ongoing,
}: {
  season: Season;
  ongoing?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("Events");
  const range = seasonDateRange(season, locale);

  return (
    <ActivityCard
      href={`/events/season/${slugify(season.name, season.seasonId)}`}
      imageUrl={season.coverImageUrl}
      title={season.name}
      badge={seasonBadge(season, t)}
      liveBadge={
        ongoing ? { label: t("ongoing"), tone: "success", pulse: true } : null
      }
      meta={[
        <CardMeta key="c" icon={<Award {...ICON} />} className="flex-1">
          {season.competition}
        </CardMeta>,
        <CardMeta key="d" icon={<Calendar {...ICON} />} className="shrink-0">
          {range ?? t("seasonCard.no_dates")}
        </CardMeta>,
      ]}
      price={
        <CardPrice
          amount={t("seasonCard.matches", { count: season.matchCount ?? 0 })}
          unit={t(`season.sports.${season.sport}`)}
        />
      }
    />
  );
}
