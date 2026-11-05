"use client";
import { Calendar2 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { DateTime } from "luxon";
import { ExploreSeason } from "@ticketwaze/typescript-config";
import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import TeamCrest from "./TeamCrest";

/** Explore's card for a season: its cover, competition and next match. */
function SeasonCard({ season }: { season: ExploreSeason }) {
  const locale = useLocale();
  const t = useTranslations("Season");
  const next = season.nextMatch;
  const kickOff = next.startsAt
    ? DateTime.fromISO(next.startsAt, { setZone: true })
        .setLocale(locale)
        .toFormat(locale === "fr" ? "ccc d LLL · HH:mm" : "ccc, LLL d · h:mm a")
    : null;

  return (
    <Link
      href={`/explore/season/${slugify(season.name, season.seasonId)}`}
      className="flex flex-row items-center lg:items-stretch lg:mb-8 lg:flex-col gap-4 w-full lg:max-w-140 bg-white shadow-lg rounded-[10px] overflow-hidden pb-4 pl-4 lg:pl-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative">
        <Image
          src={season.coverImageUrl}
          className="h-62 w-62 min-w-62 lg:max-h-[19.1rem] flex-1 lg:flex-auto lg:w-full object-cover object-top-left rounded-[10px]"
          alt={season.name}
          height={191}
          width={255}
        />
        <div className="bg-primary-50 block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary font-bold leading-6 w-fit">
          {t("tag").toUpperCase()}
        </div>
      </div>

      <div className="px-4 flex flex-1 lg:flex-auto min-w-0 flex-col gap-4">
        <div className="flex flex-col w-full gap-1">
          <span className="text-primary-500 font-medium text-[1.1rem] leading-6 truncate">
            {t(`sports.${season.sport}`)} · {season.competition}
          </span>
          <h1 className="font-bold w-full truncate font-primary text-[1.2rem] text-deep-100 leading-[1.7rem]">
            {season.name}
          </h1>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <TeamCrest
            name={next.homeTeamName}
            logoUrl={next.homeTeamLogoUrl}
            size={20}
          />
          <TeamCrest
            name={next.awayTeamName}
            logoUrl={next.awayTeamLogoUrl}
            size={20}
            className="-ml-3"
          />
          <span className="font-medium text-[1rem] text-deep-100 leading-6 truncate">
            {t("card.next", { match: next.title })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          {kickOff && (
            <div className="flex items-center gap-2 min-w-0">
              <Calendar2 size="15" color="#2e3237" variant="Bulk" />
              <span className="font-medium text-[1rem] text-deep-100 leading-6 truncate">
                {kickOff}
              </span>
            </div>
          )}
          <p className="font-bold text-[1.2rem] leading-6 text-primary-500 shrink-0">
            {t("card.upcoming", { count: season.upcomingCount })}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default SeasonCard;
