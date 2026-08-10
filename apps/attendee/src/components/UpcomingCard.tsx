"use client";
import React, { useEffect, useState } from "react";
import Image, { StaticImageData } from "next/image";
import { Calendar2, Ticket } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import { EventDay } from "@ticketwaze/typescript-config";
import { useTranslations } from "next-intl";

type Countdown =
  | { kind: "ongoing" }
  | { kind: "awaitingDraw" }
  | { kind: "drawn" }
  | { kind: "days"; count: number }
  | { kind: "hours"; count: number }
  | { kind: "minutes"; count: number }
  | { kind: "soon" };

// Combine a day's date with a time-of-day. Mirrors the detail page's live logic
// so a card and its event page agree on "ongoing".
function toDate(day: EventDay, time: string): Date {
  const dateStr =
    typeof day.eventDate === "string"
      ? day.eventDate.split("T")[0]
      : new Date(day.eventDate).toISOString().split("T")[0];
  return new Date(`${dateStr}T${time}`);
}

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
  const now = new Date();

  // Ongoing: now falls within any day's start–end window.
  const live = eventDays.some((day) => {
    const start = toDate(day, day.startTime);
    const end = toDate(day, day.endTime);
    return now >= start && now <= end;
  });
  if (live) return { kind: "ongoing" };

  const nextStart = eventDays
    .map((day) => toDate(day, day.startTime))
    .filter((start) => start.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())
    .at(0);

  // No future day and not currently live: the day is over but still listed for
  // today — show it as ongoing rather than a misleading "0 days to go".
  if (!nextStart) return { kind: "ongoing" };

  const diffMs = nextStart.getTime() - now.getTime();
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
  let label: React.ReactNode = null;
  if (countdown?.kind === "ongoing") {
    label = t("ongoing");
  } else if (countdown?.kind === "awaitingDraw") {
    label = t("awaitingDraw");
  } else if (countdown?.kind === "drawn") {
    label = t("drawn");
  } else if (countdown?.kind === "soon") {
    label = t.rich("soon", { muted });
  } else if (countdown) {
    label = t.rich(countdown.kind, { count: countdown.count, muted });
  }

  const accent = isOngoing ? "#16A34A" : isAwaitingDraw ? "#F59E0B" : "#2e3237";

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
