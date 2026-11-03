"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Add,
  Award,
  Calendar,
  Edit2,
  Location,
  Trash,
  Ticket,
} from "iconsax-reactjs";
import { Season, SeasonMatch } from "@ticketwaze/typescript-config";
import { Link, useRouter } from "@/i18n/navigation";
import { Dialog, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import ModalShell from "@/components/shared/ModalShell";
import { ButtonPill, ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import { Reveal } from "@/components/shared/motion";
import TeamCrest from "@/components/season/TeamCrest";
import { seasonDateRange } from "@/components/shared/SeasonCard";
import { DeleteSeason } from "@/actions/SeasonActions";
import { slugify } from "@/lib/Slugify";
import { eventStartsAt } from "@/lib/eventTime";
import { cn } from "@/lib/utils";

type MatchState = "requested" | "review" | "rejected" | "cancelled" | "live" | "over";

function matchState(match: SeasonMatch): MatchState {
  const event = match.event;
  if (event.cancelledAt) return "cancelled";
  if (event.adminStatus !== "approved") return event.adminStatus;
  return match.isOver ? "over" : "live";
}

const STATE_CLASS: Record<MatchState, string> = {
  requested: "bg-neutral-900 text-white",
  review: "bg-warning text-white",
  rejected: "bg-failure text-white",
  cancelled: "bg-neutral-500 text-white",
  live: "bg-success text-white",
  over: "bg-neutral-100 text-neutral-700",
};

function Banner({
  tone,
  children,
}: {
  tone: "warning" | "failure";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-[15px] border p-6",
        tone === "failure"
          ? "bg-failure/5 border-failure/20"
          : "bg-warning/5 border-warning/30",
      )}
    >
      <div
        className={cn(
          "w-[0.8rem] h-[0.8rem] rounded-full mt-[0.6rem] shrink-0",
          tone === "failure" ? "bg-failure" : "bg-warning",
        )}
      />
      <p className="text-[1.5rem] leading-8 text-deep-100">{children}</p>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-4 min-w-0">
      <span className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[1.2rem] leading-6 text-neutral-600">{label}</p>
        <p className="text-[1.5rem] leading-8 text-deep-100 truncate">{value}</p>
      </div>
    </li>
  );
}

function MatchRow({ match }: { match: SeasonMatch }) {
  const t = useTranslations("Events.season");
  const locale = useLocale();
  const event = match.event;
  const starts = eventStartsAt(event.eventDays);
  const state = matchState(match);
  const total = (event.eventTicketTypes ?? []).reduce(
    (sum, type) => sum + Number(type.ticketTypeQuantity ?? 0),
    0,
  );
  const sold = (event.eventTicketTypes ?? []).reduce(
    (sum, type) => sum + Number(type.ticketTypeQuantitySold ?? 0),
    0,
  );

  return (
    <li>
      <Link
        href={`/events/show/${slugify(event.eventName, event.eventId)}`}
        className="flex flex-col lg:flex-row lg:items-center gap-6 rounded-[1.5rem] border border-neutral-100 p-6 hover:border-primary-500/40 hover:shadow-[0_15px_25px_rgba(0,0,0,0.05)] transition-all"
      >
        <div className="flex items-center gap-4 lg:w-[14rem] shrink-0">
          <div className="flex flex-col">
            <span className="font-primary font-medium text-[1.8rem] leading-8 text-deep-100">
              {starts ? starts.setLocale(locale).toFormat("d LLL") : "—"}
            </span>
            <span className="text-[1.3rem] leading-6 text-neutral-600">
              {starts ? starts.setLocale(locale).toFormat("ccc · HH:mm") : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 min-w-0">
          <TeamCrest name={match.homeTeamName} logoUrl={match.homeTeamLogoUrl} />
          <span className="font-medium text-[1.5rem] leading-8 text-deep-100 truncate">
            {match.homeTeamName}
          </span>
          <span className="text-[1.3rem] text-neutral-500 shrink-0">
            {t("match.vs")}
          </span>
          <span className="font-medium text-[1.5rem] leading-8 text-deep-100 truncate">
            {match.awayTeamName}
          </span>
          <TeamCrest name={match.awayTeamName} logoUrl={match.awayTeamLogoUrl} />
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0">
          {match.round && (
            <span className="text-[1.3rem] text-neutral-600">{match.round}</span>
          )}
          <span className="flex items-center gap-2 text-[1.3rem] text-neutral-700">
            <Ticket size="16" color="#737c8a" variant="Bulk" />
            {t("page.sold", { sold, total })}
          </span>
          <span
            className={cn(
              "py-1 px-4 rounded-[30px] font-primary font-bold text-[1rem] leading-6 uppercase",
              STATE_CLASS[state],
            )}
          >
            {t(`page.match_status.${state}`)}
          </span>
        </div>
      </Link>
    </li>
  );
}

/**
 * THE ORGANISER'S SEASON PAGE: who, what and where on top, then the fixture
 * list. Each match row opens the match's own event page, where its tickets,
 * sales and check-in live exactly as for any event.
 */
export default function SeasonPageDetails({
  season,
  matches,
  canCreate,
  canEdit,
}: {
  season: Season;
  matches: SeasonMatch[];
  canCreate: boolean;
  canEdit: boolean;
}) {
  const t = useTranslations("Events.season");
  const tCard = useTranslations("Events");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [deleting, setDeleting] = useState(false);
  const slug = slugify(season.name, season.seasonId);

  const upcoming = matches.filter((m) => !m.isOver);
  const played = matches.filter((m) => m.isOver).reverse();
  const range = seasonDateRange(
    {
      ...season,
      startsAt: matches[0]
        ? (eventStartsAt(matches[0].event.eventDays)?.toISO() ?? null)
        : null,
      endsAt: matches.length
        ? (eventStartsAt(matches[matches.length - 1]!.event.eventDays)?.toISO() ??
          null)
        : null,
    },
    locale,
  );
  const venue = [season.venueName, season.city].filter(Boolean).join(", ");
  const rejectedReason = season.rejectionReason?.trim();

  async function remove() {
    const organisationId = session?.activeOrganisation?.organisationId;
    if (!organisationId) return;
    setDeleting(true);
    const result = await DeleteSeason(organisationId, season.seasonId, locale);
    setDeleting(false);
    if (result.status !== "success") {
      toast.error(
        result.code === "HAS_MATCHES" ? t("page.delete_blocked") : result.error,
      );
      return;
    }
    toast.success(t("page.deleted"));
    router.push("/events");
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-10 pb-24 lg:pb-8">
      <Reveal>
        <div className="flex flex-col lg:flex-row gap-8 lg:items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={season.coverImageUrl}
            alt=""
            className="w-full lg:w-[22rem] h-[16rem] lg:h-[13rem] rounded-[1.5rem] object-cover object-top border border-neutral-100"
          />
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <span className="text-[1.3rem] leading-6 text-primary-500 font-medium">
              {t(`sports.${season.sport}`)} · {season.competition}
            </span>
            <h1 className="text-[2.6rem] font-medium font-primary leading-12 text-black">
              {season.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {canCreate && season.adminStatus !== "rejected" && (
                <Link href={`/events/season/${slug}/matches/new`}>
                  <ButtonPill tone="primary" type="button">
                    <Add size="18" color="#fff" />
                    {t("page.add_match")}
                  </ButtonPill>
                </Link>
              )}
              {canEdit && (
                <Link href={`/events/season/${slug}/edit`}>
                  <ButtonPill type="button">
                    <Edit2 size="16" color="#737c8a" variant="Bulk" />
                    {t("page.edit")}
                  </ButtonPill>
                </Link>
              )}
              {canEdit && matches.length === 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <ButtonPill type="button">
                      <Trash size="16" color="#DE0028" variant="Bulk" />
                      {t("page.delete")}
                    </ButtonPill>
                  </DialogTrigger>
                  <ModalShell
                    title={t("page.delete_title")}
                    description={t("page.delete_body")}
                  >
                    <div className="flex gap-4 pt-8">
                      <DialogClose asChild>
                        <ButtonPrimary className="flex-1 bg-neutral-100 text-deep-100 hover:bg-neutral-200">
                          {t("page.delete_cancel")}
                        </ButtonPrimary>
                      </DialogClose>
                      <ButtonRed
                        className="flex-1"
                        disabled={deleting}
                        onClick={remove}
                      >
                        {t("page.delete_confirm")}
                      </ButtonRed>
                    </div>
                  </ModalShell>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {season.suspendedAt ? (
        <Banner tone="failure">{t("page.status_suspended")}</Banner>
      ) : season.adminStatus === "rejected" ? (
        <Banner tone="failure">
          {rejectedReason
            ? t("page.status_rejected", { reason: rejectedReason })
            : t("page.status_rejected_no_reason")}
        </Banner>
      ) : season.adminStatus === "requested" ? (
        <Banner tone="warning">{t("page.status_requested")}</Banner>
      ) : season.adminStatus === "review" ? (
        <Banner tone="warning">{t("page.status_review")}</Banner>
      ) : null}

      <ul className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-b border-neutral-100 pb-10">
        <Fact
          icon={<Award size="20" color="#0d0d0d" variant="Bulk" />}
          label={t("page.competition")}
          value={season.competition}
        />
        <Fact
          icon={<Location size="20" color="#0d0d0d" variant="Bulk" />}
          label={t("page.venue")}
          value={venue || season.address}
        />
        <Fact
          icon={<Calendar size="20" color="#0d0d0d" variant="Bulk" />}
          label={t("page.matches")}
          value={
            <>
              {tCard("seasonCard.matches", { count: matches.length })}
              {range ? ` · ${range}` : ""}
            </>
          }
        />
      </ul>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-4 py-16">
          <div className="w-[9rem] h-[9rem] rounded-full bg-neutral-100 flex items-center justify-center">
            <Calendar size="40" color="#0d0d0d" variant="Bulk" />
          </div>
          <p className="font-primary font-medium text-[2rem] leading-10 text-deep-100">
            {t("page.no_matches")}
          </p>
          <p className="text-[1.4rem] leading-8 text-neutral-600 max-w-[42rem]">
            {t("page.no_matches_hint")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {upcoming.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="font-primary font-medium text-[2rem] leading-10 text-deep-100">
                {t("page.upcoming")}
              </h2>
              <ul className="flex flex-col gap-4">
                {upcoming.map((match) => (
                  <MatchRow key={match.eventId} match={match} />
                ))}
              </ul>
            </section>
          )}
          {played.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="font-primary font-medium text-[2rem] leading-10 text-deep-100">
                {t("page.played")}
              </h2>
              <ul className="flex flex-col gap-4">
                {played.map((match) => (
                  <MatchRow key={match.eventId} match={match} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

