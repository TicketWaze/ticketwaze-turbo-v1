"use client";
import { useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { DateTime } from "luxon";
import { Printer, Status } from "iconsax-reactjs";
import { formatMoney } from "@ticketwaze/currency";
import {
  EventDay,
  Match,
  PhysicalTicketBatch,
  Season,
} from "@ticketwaze/typescript-config";
import { Link } from "@/i18n/navigation";
import ActivityActionsMenu from "@/components/shared/ActivityActionsMenu";
import ActivityHeaderActions, {
  ActivitySuspensionNotice,
} from "@/components/shared/ActivityHeaderActions";
import ActivityDetailShell, {
  InfoGroup,
  InfoList,
  InfoRow,
} from "@/components/shared/ActivityDetailShell";
import { eventEndsAt, eventStartsAt } from "@/lib/eventTime";
import { cn } from "@/lib/utils";
import PrintTicketsDialog from "../../../[id]/components/PrintTicketsDialog";
import { SeasonStatusDialog, StatusBadge } from "./SeasonStatusDialog";

/** GET /admin/season/:id — see the API's AdminSeasonsController.fetchSeason. */
export type AdminSeasonDetail = {
  season: Season & { suspensionReason?: string | null };
  organisation: {
    organisationId: string;
    organisationName: string;
    profileImageUrl: string | null;
    isVerified?: boolean;
    isSuspended?: boolean;
    followersCount?: number;
  };
  matches: (Match & {
    title: string;
    ticketsSold: number;
    capacity: number;
    event: {
      eventId: string;
      eventName: string;
      adminStatus: "requested" | "review" | "approved" | "rejected";
      cancelledAt: string | null;
      deletionStatus: string | null;
      suspendedAt?: string | null;
      eventDays: EventDay[];
    };
  })[];
  passTypes: {
    seasonPassTypeId: string;
    name: string;
    currency: "HTG" | "USD";
    price: number;
    usdPrice: number;
    /** Null = unlimited (every season pass since the 2026-11-07 revamp). */
    quantity: number | null;
    quantitySold: number;
  }[];
  passMoney: {
    passesSold: number;
    faceHtg: number;
    faceUsd: number;
    earnedHtg: number;
    earnedUsd: number;
    releasedHtg: number;
    releasedUsd: number;
  };
  printedBatches: PhysicalTicketBatch[];
};

const SPORT_LABEL: Record<string, string> = {
  football: "Football",
  basketball: "Basketball",
  volleyball: "Volleyball",
  baseball: "Baseball",
  other: "Other sport",
};

const BADGE = "py-[0.3rem] px-4 text-[1.1rem] font-bold leading-6 uppercase rounded-[30px] whitespace-nowrap";

/** One badge per match: a problem state first, then where it is in time. */
function matchState(match: AdminSeasonDetail["matches"][number]): {
  label: string;
  className: string;
} {
  const e = match.event;
  if (e.deletionStatus) return { label: "Deleted", className: "bg-failure/10 text-failure" };
  if (e.cancelledAt) return { label: "Cancelled", className: "bg-failure/10 text-failure" };
  if (e.suspendedAt) return { label: "Suspended", className: "bg-failure/10 text-failure" };
  if (e.adminStatus === "rejected") return { label: "Rejected", className: "bg-failure/10 text-failure" };
  if (e.adminStatus === "requested") return { label: "Requested", className: "bg-warning/15 text-[#C98A00]" };
  if (e.adminStatus === "review") return { label: "In review", className: "bg-[#EAF2FF] text-[#2F6FEB]" };
  const ends = eventEndsAt(e.eventDays);
  const starts = eventStartsAt(e.eventDays);
  const now = DateTime.now();
  if (ends && ends < now) return { label: "Played", className: "bg-neutral-100 text-deep-100" };
  if (starts && starts <= now) return { label: "Ongoing", className: "bg-success/10 text-success" };
  return { label: "Upcoming", className: "bg-warning/15 text-[#C98A00]" };
}

function Crest({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return logoUrl ? (
    <Image
      src={logoUrl}
      alt={name}
      width={28}
      height={28}
      className="w-[2.8rem] h-[2.8rem] rounded-full object-cover border border-neutral-100 shrink-0"
    />
  ) : (
    <span className="w-[2.8rem] h-[2.8rem] rounded-full bg-neutral-100 text-deep-100 text-[1.2rem] font-semibold flex items-center justify-center uppercase shrink-0">
      {name.charAt(0)}
    </span>
  );
}

/**
 * The season page on the shared Figma activity layout (ActivityDetailShell),
 * like the raffle and sale pages: Suspend in the header, status and printing
 * in the ⋯ menu, Edit for the season's own fields. Each match has its own
 * admin page (its own review, dates, venue and tickets) behind its row.
 */
export default function SeasonReviewComponent({ detail }: { detail: AdminSeasonDetail }) {
  const locale = useLocale();
  const { season, organisation, matches, passTypes, passMoney, printedBatches } = detail;
  const [dialog, setDialog] = useState<null | "status" | "print">(null);
  const control = (kind: "status" | "print") => ({
    open: dialog === kind,
    onOpenChange: (next: boolean) => setDialog(next ? kind : null),
  });

  const money = (htg: number, usd: number) =>
    `${formatMoney(htg, "HTG", locale)} · ${formatMoney(usd, "USD", locale)}`;
  const dayLabel = (days: EventDay[]) => {
    const starts = eventStartsAt(days);
    return starts
      ? starts.setLocale(locale === "fr" ? "fr" : "en").toFormat(locale === "fr" ? "d LLL yyyy · HH:mm" : "LLL d, yyyy · h:mm a")
      : "No date";
  };
  const live = matches.filter((m) => !m.event.cancelledAt && !m.event.deletionStatus);
  const first = live[0];
  const last = live[live.length - 1];
  const printed = printedBatches.reduce((s, b) => s + b.quantity, 0);
  const printedUsed = printedBatches.reduce((s, b) => s + b.checked, 0);
  const printedVoid = printedBatches.reduce((s, b) => s + b.void, 0);

  return (
    <>
      <ActivityDetailShell
        title={season.name}
        badges={
          <>
            <StatusBadge status={season.adminStatus} />
            <span className={cn(BADGE, "bg-neutral-100 text-deep-100 normal-case font-medium")}>
              {SPORT_LABEL[season.sport] ?? season.sport} · {season.competition}
            </span>
          </>
        }
        actions={
          <ActivityHeaderActions
            kind="season"
            activityId={season.seasonId}
            editHref={`/activities/season/${season.seasonId}/edit`}
            editLabel="Edit season"
            suspendedAt={season.suspendedAt}
          >
            <ActivityActionsMenu
              label="Actions"
              actions={[
                {
                  key: "status",
                  label: "Change status",
                  onSelect: () => setDialog("status"),
                  icon: <Status size="20" variant="Bulk" color="#2E3237" />,
                },
                {
                  key: "print",
                  label: "Print season tickets",
                  onSelect: () => setDialog("print"),
                  icon: <Printer size="20" variant="Bulk" color="#2E3237" />,
                },
              ]}
            />
          </ActivityHeaderActions>
        }
        notices={
          <>
            <ActivitySuspensionNotice
              suspendedAt={season.suspendedAt}
              reason={season.suspensionReason}
              organisationSuspended={organisation.isSuspended === true}
            />
            {season.adminStatus === "rejected" && season.rejectionReason && (
              <div className="flex flex-col gap-2 rounded-[15px] border border-failure/30 bg-[#FCE5EA] p-6">
                <span className="text-[1.4rem] font-medium text-failure">Rejection reason</span>
                <p className="text-[1.4rem] leading-8 text-neutral-700">{season.rejectionReason}</p>
              </div>
            )}
          </>
        }
        imageUrl={season.coverImageUrl}
        aboutTitle="About season"
        aboutHtml={season.description}
        organisation={organisation}
        details={[
          {
            icon: "calendar",
            text: first
              ? `${dayLabel(first.event.eventDays)} → ${dayLabel(last.event.eventDays)}`
              : "No match scheduled yet",
            wide: true,
          },
          {
            icon: "location",
            text: [season.venueName, season.address, season.city, season.country]
              .filter(Boolean)
              .join(", "),
            wide: true,
          },
        ]}
        tabs={[
          {
            value: "matches",
            label: `Matches (${matches.length})`,
            content:
              matches.length === 0 ? (
                <p className="text-[1.4rem] leading-8 text-neutral-600 pt-4">
                  The organiser has not added a match yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-4 pt-4">
                  {matches.map((match) => {
                    const state = matchState(match);
                    return (
                      <li key={match.eventId}>
                        <Link
                          href={`/activities/${match.eventId}`}
                          className="flex flex-col gap-3 rounded-[15px] border border-neutral-100 p-5 hover:border-neutral-300 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[1.3rem] text-neutral-600">
                              {dayLabel(match.event.eventDays)}
                              {match.round ? ` · ${match.round}` : ""}
                            </span>
                            <span className={cn(BADGE, state.className)}>{state.label}</span>
                          </div>
                          <div className="flex items-center gap-3 min-w-0">
                            <Crest name={match.homeTeamName} logoUrl={match.homeTeamLogoUrl} />
                            <span className="text-[1.5rem] font-medium text-deep-100 truncate">
                              {match.homeTeamName}
                            </span>
                            <span className="text-[1.3rem] text-neutral-500 shrink-0">vs</span>
                            <Crest name={match.awayTeamName} logoUrl={match.awayTeamLogoUrl} />
                            <span className="text-[1.5rem] font-medium text-deep-100 truncate">
                              {match.awayTeamName}
                            </span>
                          </div>
                          <span className="text-[1.3rem] text-neutral-600">
                            Single tickets sold: {match.ticketsSold.toLocaleString()} /{" "}
                            {match.capacity.toLocaleString()} (passes included in capacity)
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ),
          },
          {
            value: "passes",
            label: `Passes (${passMoney.passesSold})`,
            content: (
              <>
                {passTypes.length === 0 ? (
                  <p className="text-[1.4rem] leading-8 text-neutral-600 pt-4">
                    No season pass on sale.
                  </p>
                ) : (
                  <InfoList>
                    {passTypes.map((p) => (
                      <InfoRow key={p.seasonPassTypeId} label={p.name}>
                        {formatMoney(p.currency === "USD" ? p.usdPrice : p.price, p.currency, locale)}
                        {" · "}
                        {p.quantity === null
                          ? `${p.quantitySold.toLocaleString()} sold · no limit`
                          : `${p.quantitySold.toLocaleString()} / ${p.quantity.toLocaleString()} sold`}
                      </InfoRow>
                    ))}
                  </InfoList>
                )}
                <InfoGroup title="Pass money">
                  <InfoRow label="Passes sold">{passMoney.passesSold.toLocaleString()}</InfoRow>
                  <InfoRow label="Buyers paid (before fees)">
                    {money(passMoney.faceHtg, passMoney.faceUsd)}
                  </InfoRow>
                  <InfoRow label="Organiser's share">
                    {money(passMoney.earnedHtg, passMoney.earnedUsd)}
                  </InfoRow>
                  <InfoRow label="Released by played matches">
                    {money(passMoney.releasedHtg, passMoney.releasedUsd)}
                  </InfoRow>
                  <InfoRow label="Still pending">
                    {money(
                      Math.max(passMoney.earnedHtg - passMoney.releasedHtg, 0),
                      Math.max(passMoney.earnedUsd - passMoney.releasedUsd, 0),
                    )}
                  </InfoRow>
                </InfoGroup>
                <p className="text-[1.2rem] leading-6 text-neutral-500 pt-6">
                  Each played match releases the pending share divided by the matches still to
                  play. Passes are not refundable.
                </p>
              </>
            ),
          },
          {
            value: "printed",
            label: "Printed",
            content:
              printedBatches.length === 0 ? (
                <div className="flex flex-col items-start gap-4 pt-4">
                  <p className="text-[1.4rem] leading-8 text-neutral-600">
                    No printed season tickets yet. Each one gets in at one match of the
                    holder&apos;s choice.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDialog("print")}
                    className="h-[3.5rem] px-6 rounded-[10rem] bg-black text-white text-[1.4rem] cursor-pointer hover:bg-neutral-900"
                  >
                    Print season tickets
                  </button>
                </div>
              ) : (
                <>
                  <InfoList>
                    <InfoRow label="Printed">{printed.toLocaleString()}</InfoRow>
                    <InfoRow label="Used at a match">{printedUsed.toLocaleString()}</InfoRow>
                    <InfoRow label="Cancelled">{printedVoid.toLocaleString()}</InfoRow>
                  </InfoList>
                  <InfoGroup title="Runs">
                    {printedBatches.map((b) => (
                      <InfoRow
                        key={b.batchId}
                        label={new Date(b.createdAt).toLocaleDateString(locale, {
                          dateStyle: "medium",
                        })}
                      >
                        {b.quantity} × {b.ticketType} · {b.checked} used
                        {b.void > 0 ? ` · ${b.void} cancelled` : ""}
                      </InfoRow>
                    ))}
                  </InfoGroup>
                </>
              ),
          },
        ]}
      />

      <SeasonStatusDialog season={season} hideTrigger {...control("status")} />
      <PrintTicketsDialog
        season={{ seasonId: season.seasonId, name: season.name }}
        {...control("print")}
      />
    </>
  );
}
