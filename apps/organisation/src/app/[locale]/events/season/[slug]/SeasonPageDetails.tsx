"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { DateTime } from "luxon";
import {
  Add,
  Calendar,
  Edit2,
  HamburgerMenu,
  MoreCircle,
  Ticket,
  Trash,
} from "iconsax-reactjs";
import { motion } from "motion/react";
import {
  PhysicalTicketBatch,
  Season,
  SeasonMatch,
  SeasonPassType,
} from "@ticketwaze/typescript-config";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ButtonPill, ButtonRed } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import MountOnOpen from "@/components/shared/MountOnOpen";
import { Reveal } from "@/components/shared/motion";
import { Metric, Unit } from "@/app/[locale]/analytics/parts";
import TeamCrest from "@/components/season/TeamCrest";
import PrintedTicketsSection from "../../show/[slug]/components/PrintedTicketsSection";
import { DeleteSeason } from "@/actions/SeasonActions";
import { slugify } from "@/lib/Slugify";
import { eventStartsAt } from "@/lib/eventTime";
import { cn } from "@/lib/utils";

// The details panel downloads on first open, as on the event page.
const SeasonDrawerContent = dynamic(() => import("./SeasonDrawerContent"), {
  ssr: false,
});

type MatchState =
  | "requested"
  | "review"
  | "rejected"
  | "cancelled"
  | "live"
  | "over";

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
          <TeamCrest
            name={match.homeTeamName}
            logoUrl={match.homeTeamLogoUrl}
          />
          <span className="font-medium text-[1.5rem] leading-8 text-deep-100 truncate">
            {match.homeTeamName}
          </span>
          <span className="text-[1.3rem] text-neutral-500 shrink-0">
            {t("match.vs")}
          </span>
          <span className="font-medium text-[1.5rem] leading-8 text-deep-100 truncate">
            {match.awayTeamName}
          </span>
          <TeamCrest
            name={match.awayTeamName}
            logoUrl={match.awayTeamLogoUrl}
          />
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-6 shrink-0">
          {match.round && (
            <span className="text-[1.3rem] text-neutral-600">
              {match.round}
            </span>
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

const itemClass =
  "w-full flex items-center justify-between gap-6 py-4 border-b border-neutral-200 font-sans text-[1.5rem] leading-8 text-neutral-700 cursor-pointer transition-colors hover:text-primary-500";

// 2×2 on mobile, one row of four on desktop (as on the event page).
const kpiTiles = [
  "max-lg:pr-6 max-lg:pb-8 max-lg:border-r lg:pr-[2.5rem] lg:pb-10",
  "max-lg:pl-6 max-lg:pb-8 lg:px-[2.5rem] lg:pb-10",
  "max-lg:pr-6 max-lg:pt-8 max-lg:border-r max-lg:border-t lg:px-[2.5rem] lg:pb-10",
  "max-lg:pl-6 max-lg:pt-8 max-lg:border-t lg:pl-[2.5rem] lg:pb-10",
].map((c) => cn(c, "border-neutral-100"));

/**
 * The season's ⋯ menu, like an event's: details (the side panel), edit, and
 * delete while the season has no match.
 */
function SeasonMore({
  season,
  canEdit,
  canDelete,
  editHref,
  onShowDetails,
}: {
  season: Season;
  canEdit: boolean;
  canDelete: boolean;
  editHref: string;
  onShowDetails: () => void;
}) {
  const t = useTranslations("Events.season");
  const tEvent = useTranslations("Events.single_event");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const items: React.ReactNode[] = [
    <button
      key="details"
      type="button"
      className={itemClass}
      onClick={() => {
        setMenuOpen(false);
        onShowDetails();
      }}
    >
      <span>{t("page.details")}</span>
      <HamburgerMenu size="20" variant="Bulk" color="#2E3237" />
    </button>,
    canEdit && (
      <Link key="edit" href={editHref} className={itemClass}>
        <span>{t("page.edit")}</span>
        <Edit2 size="20" variant="Bulk" color="#2E3237" />
      </Link>
    ),
    canEdit && canDelete && (
      <Dialog key="delete">
        <DialogTrigger
          className={cn(
            itemClass,
            "border-b-0 text-failure hover:text-failure/80",
          )}
        >
          <span>{t("page.delete")}</span>
          <Trash size="20" variant="Bulk" color="#DE0028" />
        </DialogTrigger>
        <DialogContent className="w-xl lg:w-208">
          <DialogHeader>
            <DialogTitle className="font-medium border-b border-neutral-100 pb-8 text-[2.6rem] leading-12 text-black font-primary">
              {t("page.delete_title")}
            </DialogTitle>
            <DialogDescription className="text-[1.5rem] leading-8 text-neutral-600 pt-4">
              {t("page.delete_body")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-4">
            <DialogClose asChild>
              <ButtonPill className="flex-1 justify-center">
                {t("page.delete_cancel")}
              </ButtonPill>
            </DialogClose>
            <ButtonRed className="flex-1" disabled={deleting} onClick={remove}>
              {deleting ? <LoadingCircleSmall /> : t("page.delete_confirm")}
            </ButtonRed>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
  ].filter(Boolean);

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger
        aria-label={tEvent("more")}
        className="w-[3.5rem] h-[3.5rem] shrink-0 cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center transition-colors hover:bg-neutral-200 data-[state=open]:bg-neutral-200"
      >
        <MoreCircle variant="Bulk" size={20} color="#737C8A" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[23.5rem] p-[1rem] bg-neutral-100 border border-neutral-200 rounded-[1rem] shadow-[0px_10px_30px_rgba(0,0,0,0.12)]"
      >
        <p className="font-sans font-medium pb-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8">
          {tEvent("more")}
        </p>
        <ul className="flex flex-col [&>li:last-child>*]:border-b-0">
          {items.map((item, i) => (
            <motion.li
              key={(item as React.ReactElement).key ?? i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              {item}
            </motion.li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/**
 * THE ORGANISER'S SEASON PAGE, laid out like an event's: the name with "Add
 * match" and the ⋯ menu (details panel, edit, delete) on one row, four KPIs,
 * then the fixture list. A season is only the wrapper: each match row opens
 * the match's own event page, where its tickets, sales and check-in live.
 */
export default function SeasonPageDetails({
  season,
  matches,
  passTypes,
  printedBatches,
  canCreate,
  canEdit,
}: {
  season: Season;
  matches: SeasonMatch[];
  passTypes: SeasonPassType[];
  printedBatches: PhysicalTicketBatch[];
  canCreate: boolean;
  canEdit: boolean;
}) {
  const t = useTranslations("Events.season");
  const locale = useLocale();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const slug = slugify(season.name, season.seasonId);
  const editHref = `/events/season/${slug}/edit`;
  const pass = passTypes[0];

  const upcoming = matches.filter((m) => !m.isOver);
  const played = matches.filter((m) => m.isOver).reverse();
  const rejectedReason = season.rejectionReason?.trim();

  /* ── KPIs ── */
  const fmt = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 });
  const passPrice = pass
    ? pass.currency === "USD"
      ? Number(pass.usdPrice)
      : Number(pass.price)
    : null;
  const nextKickOff = upcoming
    .filter((m) => !m.event.cancelledAt)
    .map((m) => eventStartsAt(m.event.eventDays))
    .filter((d): d is DateTime => d !== null && d > DateTime.now())[0];
  const daysToNext = nextKickOff
    ? Math.ceil(nextKickOff.diff(DateTime.now(), "days").days)
    : null;

  const canAddMatch = canCreate && season.adminStatus !== "rejected";
  const addMatch = canAddMatch && (
    <Link href={`/events/season/${slug}/matches/new`}>
      <ButtonPill tone="primary" type="button">
        <Add size="18" color="#fff" aria-hidden />
        {t("page.add_match")}
      </ButtonPill>
    </Link>
  );
  const more = (
    <SeasonMore
      season={season}
      canEdit={canEdit}
      canDelete={matches.length === 0}
      editHref={editHref}
      onShowDetails={() => setDetailsOpen(true)}
    />
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-12 lg:gap-16 pb-24 lg:pb-16">
      {/* Title + actions */}
      <Reveal
        y={-12}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-[1.3rem] leading-6 text-primary-500 font-medium">
            {t(`sports.${season.sport}`)} · {season.competition}
          </span>
          <h1 className="font-primary font-medium text-[2.2rem] lg:text-[2.6rem] leading-[1.2] text-black break-words">
            {season.name}
          </h1>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {addMatch}
          <div className="ml-auto lg:ml-0">{more}</div>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-neutral-100 divide-neutral-100 lg:divide-x pb-8 lg:pb-0">
        <Reveal className={kpiTiles[0]} delay={0.06}>
          <Metric label={t("pass.price")} size="responsive">
            {passPrice === null ? "—" : fmt(passPrice)}{" "}
            {pass && <Unit>{pass.currency}</Unit>}
          </Metric>
        </Reveal>
        <Reveal className={kpiTiles[1]} delay={0.11}>
          <Metric label={t("page.passes_sold")} size="responsive">
            {fmt(pass?.quantitySold ?? 0)}
          </Metric>
        </Reveal>
        <Reveal className={kpiTiles[2]} delay={0.16}>
          <Metric label={t("page.matches")} size="responsive">
            {fmt(played.length)} <Unit>/ {fmt(matches.length)}</Unit>
          </Metric>
        </Reveal>
        <Reveal className={kpiTiles[3]} delay={0.21}>
          <Metric label={t("page.next_match")} size="responsive">
            {daysToNext === null ? "—" : fmt(daysToNext)}{" "}
            {daysToNext !== null && (
              <Unit>{t("page.days", { count: daysToNext })}</Unit>
            )}
          </Metric>
        </Reveal>
      </div>

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
          {addMatch && <div className="pt-4">{addMatch}</div>}
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

      <PrintedTicketsSection
        batches={printedBatches}
        timezone={season.timezone}
        kind="season"
      />

      <MountOnOpen open={detailsOpen}>
        <SeasonDrawerContent
          season={season}
          passType={pass}
          editHref={canEdit ? editHref : undefined}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </MountOnOpen>
    </div>
  );
}
