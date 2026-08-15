"use client";
import React, { useEffect, useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Calendar2, Ticket } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import { EventDay } from "@ticketwaze/typescript-config";
import { useTranslations } from "next-intl";
import { DateTime } from "luxon";
import { eventWindows } from "@/lib/eventSchedule";

type Countdown =
  | { kind: "ongoing" }
  | { kind: "past" }
  | { kind: "awaitingDraw" }
  | { kind: "drawn" }
  | { kind: "days"; count: number }
  | { kind: "hours"; count: number }
  | { kind: "minutes"; count: number }
  | { kind: "soon" };

// A raffle has no start/end window, just the instant it is drawn. Unlike event
// days (naive wall-clock dates), `drawAt` is already a correct UTC instant.
function computeCountdownTo(instant: string, draw?: DrawState): Countdown {
  // Already drawn — the result is what matters now, not any countdown.
  if (draw?.drawnAt) return { kind: "drawn" };

  const target = new Date(instant);
  const diffMs = target.getTime() - Date.now();
  if (Number.isNaN(diffMs) || diffMs <= 0) {
    // The moment has passed with no draw recorded. An automatic raffle is
    // genuinely mid-draw (the sweep runs hourly), but a manual one is waiting on
    // the organiser and can sit here for days — calling that "Ongoing" tells the
    // buyer a draw is happening when nothing is.
    return draw?.drawMode === "manual"
      ? { kind: "awaitingDraw" }
      : { kind: "ongoing" };
  }

  const totalMinutes = Math.floor(diffMs / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days >= 1) return { kind: "days", count: days };
  if (totalHours >= 1) return { kind: "hours", count: totalHours };
  if (totalMinutes >= 1) return { kind: "minutes", count: totalMinutes };
  return { kind: "soon" };
}

/** Raffle draw state, so the card can tell "being drawn" from "not drawn yet". */
type DrawState = { drawnAt?: string | null; drawMode?: "automatic" | "manual" };

function computeCountdown(eventDays: EventDay[]): Countdown {
  const now = DateTime.now();

  // Built in the EVENT's timezone, not the viewer's — see lib/eventSchedule.
  const windows = eventWindows(eventDays);

  // No usable schedule at all — a teaser event with no days yet, or malformed
  // ones. Neither "live" nor "finished" is defensible, so say the vaguest true
  // thing rather than assert something wrong.
  if (windows.length === 0) return { kind: "soon" };

  // Ongoing: now falls within any day's start–end window.
  if (windows.some(({ start, end }) => now >= start && now <= end)) {
    return { kind: "ongoing" };
  }

  const nextStart = windows
    .map(({ start }) => start)
    .filter((start) => start > now)
    .sort((a, b) => a.toMillis() - b.toMillis())
    .at(0);

  /**
   * Every day has finished.
   *
   * **This is what used to return "ongoing".** The intent was to avoid a
   * misleading "0 days to go" for an event still running today, but it swallowed
   * the finished case into the same branch — and because the API keeps an event
   * on this list until its DATE rolls over at midnight, a card for something
   * that ended at 11:30 in the morning stayed green and "Ongoing" for the rest
   * of the day.
   */
  if (!nextStart) return { kind: "past" };

  const diffMs = nextStart.diff(now).toMillis();
  const totalMinutes = Math.floor(diffMs / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days >= 1) return { kind: "days", count: days };
  if (totalHours >= 1) return { kind: "hours", count: totalHours };
  if (totalMinutes >= 1) return { kind: "minutes", count: totalMinutes };
  return { kind: "soon" };
}

function UpcomingCard({
  image,
  name,
  href,
  eventDays,
  tickets,
  countdownTo,
  unitLabel,
  draw,
}: {
  image: StaticImageData | string;
  name: string;
  href: string;
  eventDays: EventDay[];
  tickets: number;
  /** ISO instant to count down to instead of `eventDays` (raffle draw date). */
  countdownTo?: string;
  /** Word after the count. Defaults to "tickets"; raffles pass "entries". */
  unitLabel?: string;
  /** Raffles only: distinguishes a draw in progress from one not yet run. */
  draw?: DrawState;
}) {
  const t = useTranslations("Upcoming.countdown");

  // Compute after mount (and tick) to avoid a server/client time mismatch.
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const drawnAt = draw?.drawnAt;
  const drawMode = draw?.drawMode;
  useEffect(() => {
    const update = () =>
      setCountdown(
        countdownTo
          ? computeCountdownTo(countdownTo, { drawnAt, drawMode })
          : computeCountdown(eventDays),
      );
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
    // Depend on the primitives, not the object: a fresh `draw` literal on every
    // parent render would restart the interval each time.
  }, [eventDays, countdownTo, drawnAt, drawMode]);

  const muted = (chunks: React.ReactNode) => (
    <span className="text-neutral-600">{chunks}</span>
  );

  const isOngoing = countdown?.kind === "ongoing";
  // Amber matches the organiser's "waiting for you to draw" notice, so both
  // sides of the same raffle read the same way.
  const isAwaitingDraw = countdown?.kind === "awaitingDraw";
  // Finished events are stated plainly and greyed: the card stays on the list
  // until midnight, and green "Ongoing" was telling buyers to go and join a
  // call that had already ended.
  const isPast = countdown?.kind === "past";
  let label: React.ReactNode = null;
  if (countdown?.kind === "ongoing") {
    label = t("ongoing");
  } else if (countdown?.kind === "past") {
    label = t("past");
  } else if (countdown?.kind === "awaitingDraw") {
    label = t("awaitingDraw");
  } else if (countdown?.kind === "drawn") {
    label = t("drawn");
  } else if (countdown?.kind === "soon") {
    label = t.rich("soon", { muted });
  } else if (countdown) {
    label = t.rich(countdown.kind, { count: countdown.count, muted });
  }

  const accent = isOngoing
    ? "#16A34A"
    : isAwaitingDraw
      ? "#F59E0B"
      : isPast
        ? "#737c8a"
        : "#2e3237";

  return (
    <Link
      href={href}
      className={`flex flex-row items-center lg:items-stretch lg:mb-8 lg:flex-col gap-4 w-full bg-white shadow-lg rounded-[10px] overflow-hidden pb-4 pl-4 lg:pl-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="relative">
        <Image
          src={image}
          className={
            "h-62 lg:max-h-[19.1rem] flex-1 lg:flex-auto w-62 lg:w-full object-cover object-top-left rounded-[10px]"
          }
          alt={name}
          height={191}
          width={255}
        />
      </div>
      <div className={"px-4 flex flex-1 lg:flex-auto flex-col gap-6 lg:gap-4"}>
        <h1
          className={
            "font-bold font-primary text-[1.2rem] text-deep-100 leading-[1.7rem]"
          }
        >
          {name}
        </h1>
        <div
          className={
            "flex flex-col lg:flex-row gap-6  lg:items-center justify-between"
          }
        >
          <div className={"flex items-center gap-2"}>
            <Calendar2 size="15" color={accent} variant="Bulk" />
            <p
              className={`font-medium text-[1rem] leading-6 ${
                isOngoing
                  ? "text-[#16A34A]"
                  : isAwaitingDraw
                    ? "text-[#F59E0B]"
                    : isPast
                      ? "text-neutral-600"
                      : "text-deep-100"
              }`}
            >
              {label}
            </p>
          </div>
          <div className={"flex items-center gap-2"}>
            <Ticket size="15" color="#2e3237" variant="Bulk" />
            <p className={"font-medium text-[1rem] text-deep-100 leading-6"}>
              {tickets}{" "}
              <span className={"text-neutral-700"}>{unitLabel ?? "tickets"}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default UpcomingCard;
