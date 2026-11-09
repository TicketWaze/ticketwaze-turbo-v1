import { getTranslations } from "next-intl/server";
import { Match } from "@ticketwaze/typescript-config";
import TeamCrest from "@/components/shared/TeamCrest";

/**
 * The top of a match's event page: the two teams and the round. No season
 * since 2026-11-09 (a multi-match ticket shows in the checkout instead).
 */
export default async function MatchBanner({ match }: { match: Match }) {
  const t = await getTranslations("Season");
  const caption = match.round ?? "";

  return (
    <section className="flex flex-col gap-6 rounded-[15px] bg-neutral-50 p-6 lg:p-8">
      {caption && (
        <span className="text-center text-primary-500 font-medium text-[1.3rem] leading-8">
          {caption}
        </span>
      )}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center gap-3 min-w-0 text-center">
          <TeamCrest
            name={match.homeTeamName}
            logoUrl={match.homeTeamLogoUrl}
            size={64}
          />
          <span className="font-primary font-medium text-[1.5rem] lg:text-[1.7rem] leading-8 text-deep-100 break-words max-w-full">
            {match.homeTeamName}
          </span>
          <span className="text-[1.2rem] text-neutral-600">
            {t("match.home")}
          </span>
        </div>
        <span className="font-primary font-medium text-[1.6rem] text-neutral-500">
          vs
        </span>
        <div className="flex flex-col items-center gap-3 min-w-0 text-center">
          <TeamCrest
            name={match.awayTeamName}
            logoUrl={match.awayTeamLogoUrl}
            size={64}
          />
          <span className="font-primary font-medium text-[1.5rem] lg:text-[1.7rem] leading-8 text-deep-100 break-words max-w-full">
            {match.awayTeamName}
          </span>
          <span className="text-[1.2rem] text-neutral-600">
            {t("match.away")}
          </span>
        </div>
      </div>
    </section>
  );
}
