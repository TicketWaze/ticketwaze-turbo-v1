"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Award, Crown, Refresh2, Forward } from "iconsax-reactjs";
import { useTranslations } from "next-intl";

export type DrawWinnerView = {
  rank: number;
  prizeTitle: string;
  prizeImageUrl?: string | null;
  ticketName: string | null;
  displayName: string | null;
};

/** How long one prize's reel spins before it locks onto the winning code. */
const SPIN_MS = 3400;
/**
 * Spin length when the pool holds a single distinct code.
 *
 * Every row of the reel is then the same string, so the scroll is real but
 * invisible — a long spin just looks frozen. A one-entry raffle has no suspense
 * to build anyway, so it settles quickly instead of pretending otherwise. The
 * reel never invents codes to pad itself out: what it shows is the actual field.
 */
const SOLO_SPIN_MS = 1200;
/** The beat the reel holds on the winning code before the card is dealt. */
const LOCK_MS = 750;
/** Beat between one prize locking and the next reel starting. */
const GAP_MS = 700;

/** Row height in px. The reel's arithmetic depends on it, so it is set inline
 *  rather than through a class that a future refactor could quietly change. */
const ROW_H = 72;
/** Rows visible in the window. Odd, so one row sits dead centre on the payline. */
const VISIBLE_ROWS = 3;
/** Rows the reel travels through before landing. Long enough to build speed. */
const STRIP_ROWS = 36;

/**
 * Builds the column the reel scrolls through: random entry codes with the
 * winning one planted near the end, and the offset that centres it.
 *
 * The codes are real entries from the published pool, so what spins past is the
 * actual field — not decoration. Filler is drawn at random because the pool is
 * capped at 150 codes server-side and a raffle can have far more entries.
 */
function buildStrip(pool: string[], winningCode: string) {
  const landing = STRIP_ROWS - 3;
  const rows = Array.from({ length: STRIP_ROWS }, () =>
    pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)]! : winningCode,
  );
  rows[landing] = winningCode;
  // Centre the landing row inside a window that is VISIBLE_ROWS tall.
  const end = -(landing - Math.floor(VISIBLE_ROWS / 2)) * ROW_H;
  return { rows, end };
}

type Spin = {
  index: number;
  rows: string[];
  end: number;
  /** Length of this spin, so the CSS animation and the timers agree. */
  duration: number;
  /** The reel has stopped and is holding on the winner. */
  locked: boolean;
};

/**
 * Replays the draw as an animated reveal, every time the page is opened.
 *
 * The draw itself already happened server-side and is immutable — this is a
 * retelling of a recorded result, not a live lottery. Prizes are revealed from
 * the lowest rank upward so the top prize lands last.
 *
 * Built with plain state and CSS transitions rather than an animation library:
 * the attendee app's only animation dependency is undeclared in its
 * package.json, and this page should not deepen that.
 */
export default function DrawStage({
  winners,
  reel,
  entryCount,
}: {
  winners: DrawWinnerView[];
  reel: string[];
  entryCount: number;
}) {
  const t = useTranslations("Raffle.draw");

  // Top prize last: rank 1 is the biggest, so reveal in descending rank order.
  const order = useMemo(
    () => [...winners].sort((a, b) => b.rank - a.rank),
    [winners],
  );

  const [revealed, setRevealed] = useState(0);
  const [spin, setSpin] = useState<Spin | null>(null);
  const [finished, setFinished] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const skip = useCallback(() => {
    clearTimers();
    setSpin(null);
    setRevealed(order.length);
    setFinished(true);
  }, [clearTimers, order.length]);

  /**
   * Schedules the whole reveal. Every state change goes through a timer rather
   * than running inline, so this is safe to call straight from an effect on
   * mount — the sequence drives the component, it does not render it.
   */
  const start = useCallback(() => {
    clearTimers();

    // Someone who asked their system for less motion gets the result, not a
    // two-minute show they cannot opt out of.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || order.length === 0) {
      timers.current.push(
        setTimeout(() => {
          setRevealed(order.length);
          setFinished(true);
        }, 0),
      );
      return;
    }

    const pool = reel.length > 0 ? reel : order.map((w) => w.ticketName ?? "");
    // One distinct code means the reel has nothing to shuffle between.
    const spinMs = new Set(pool).size < 2 ? SOLO_SPIN_MS : SPIN_MS;

    let elapsed = 0;
    order.forEach((winner, index) => {
      const spinStart = elapsed;
      // Built here, in a client-only path, and never during render: the strip is
      // random, and randomness in a render would not survive hydration.
      const { rows, end } = buildStrip(pool, winner.ticketName ?? "");

      // Three beats per prize: the reel runs, holds on the winning code, then
      // hands over to the card. The scroll itself is one CSS animation, so the
      // whole spin costs three timers instead of a tick stream.
      timers.current.push(
        setTimeout(() => {
          setSpin({ index, rows, end, duration: spinMs, locked: false });
        }, spinStart),
      );
      timers.current.push(
        setTimeout(() => {
          setSpin((current) =>
            current && current.index === index ? { ...current, locked: true } : current,
          );
        }, spinStart + spinMs),
      );
      timers.current.push(
        setTimeout(() => {
          setSpin(null);
          setRevealed(index + 1);
        }, spinStart + spinMs + LOCK_MS),
      );

      elapsed = spinStart + spinMs + LOCK_MS + GAP_MS;
    });

    timers.current.push(setTimeout(() => setFinished(true), elapsed));
  }, [clearTimers, order, reel]);

  /** Replay from the top. Resetting here is fine: it is an event handler. */
  const replay = useCallback(() => {
    clearTimers();
    setRevealed(0);
    setSpin(null);
    setFinished(false);
    start();
  }, [clearTimers, start]);

  useEffect(() => {
    start();
    return clearTimers;
  }, [start, clearTimers]);

  // Keep the reel in view as each prize comes up, whatever the viewport or how
  // far the visitor has scrolled. Scrolling only reads the DOM, so it is safe in
  // an effect — nothing here sets state.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const spinIndex = spin?.index ?? null;
  useEffect(() => {
    if (spinIndex === null || !stageRef.current) return;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    stageRef.current.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
  }, [spinIndex]);

  const nextPrize = spin ? order[spin.index] : undefined;

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-2 text-center">
        <span className="text-[1.4rem] leading-8 text-neutral-600">
          {t("entriesInDraw", { count: entryCount })}
        </span>
      </div>

      {/* The reel: only mounted while a prize is being drawn.
          Deliberately NOT sticky. A sticky block keeps its space in the flow but
          paints at the top of the scroll container, so everything after it — the
          winner cards and the skip button — slid up underneath an opaque panel
          and could never be scrolled to. Visibility is handled by bringing the
          stage into view instead, which covers nothing. */}
      {spin && nextPrize && (
        <div ref={stageRef} className="flex flex-col items-center gap-4">
          <span className="text-[1.4rem] uppercase tracking-widest text-neutral-500">
            {t("drawingRank", { rank: nextPrize.rank })}
          </span>
          {/* Prize and reel share a row on desktop: seeing what is at stake is
              the point of the wait, but stacked they pushed the reel off-screen. */}
          <div className="flex items-center gap-4">
            {/* Root font-size is 10px, so a rem value is the only way to land on
                real pixels here — w-18 would be 45px, not 72. */}
            {nextPrize.prizeImageUrl && (
              <Image
                src={nextPrize.prizeImageUrl}
                alt={nextPrize.prizeTitle}
                width={72}
                height={72}
                className="w-[7.2rem] h-[7.2rem] rounded-[1.2rem] object-cover shrink-0"
              />
            )}
            <span className="text-[1.6rem] font-medium leading-8 text-deep-100">
              {nextPrize.prizeTitle}
            </span>
          </div>

          <div
            className={`relative w-full max-w-[42rem] rounded-[20px] border-2 bg-neutral-50 overflow-hidden ${
              spin.locked
                ? "border-primary-500 tw-reel-lock"
                : "border-primary-500/30"
            }`}
            style={{ height: ROW_H * VISIBLE_ROWS }}
          >
            {/* The payline: the row the reel has to land on. */}
            <div
              className={`pointer-events-none absolute inset-x-0 z-10 border-y-2 border-primary-500/70 bg-primary-50/40 ${
                spin.locked ? "" : "tw-reel-pulse"
              }`}
              style={{ top: ROW_H, height: ROW_H }}
            />
            <div className="tw-reel-window h-full">
              {/* Keyed by prize: a new prize remounts the strip, which restarts
                  the scroll from the top. */}
              <div
                key={spin.index}
                className="tw-reel-strip"
                style={
                  {
                    "--reel-end": `${spin.end}px`,
                    "--reel-duration": `${spin.duration}ms`,
                  } as React.CSSProperties
                }
              >
                {spin.rows.map((code, row) => (
                  <div
                    key={`${row}-${code}`}
                    className="flex items-center justify-center font-primary font-bold text-[2.6rem] lg:text-[3.4rem] leading-none tracking-widest text-deep-100"
                    style={{ height: ROW_H }}
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revealed prizes stack downward in reveal order, so the grand prize
          lands last and sits at the bottom as the payoff. */}
      <ul className="flex flex-col gap-6">
        {order.slice(0, revealed).map((winner) => (
          <li
            key={winner.rank}
            className={`tw-reveal flex items-center gap-6 rounded-[20px] border p-8 ${
              winner.rank === 1
                ? "border-primary-500/40 bg-primary-50/40"
                : "border-neutral-100"
            }`}
          >
            {winner.prizeImageUrl ? (
              <span className="relative shrink-0">
                <Image
                  src={winner.prizeImageUrl}
                  alt={winner.prizeTitle}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-[1.2rem] object-cover"
                />
                {winner.rank === 1 && (
                  <span className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center">
                    <Crown size="18" color="#fff" variant="Bulk" />
                  </span>
                )}
              </span>
            ) : (
              <span
                className={`shrink-0 w-20 h-20 rounded-full flex items-center justify-center ${
                  winner.rank === 1
                    ? "bg-primary-500 text-white"
                    : "bg-primary-50 text-primary-500"
                }`}
              >
                {winner.rank === 1 ? (
                  <Crown size="28" color="#fff" variant="Bulk" />
                ) : (
                  <span className="font-bold text-[1.8rem]">{winner.rank}</span>
                )}
              </span>
            )}
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-[1.8rem] font-medium leading-8 text-deep-100 truncate">
                {winner.prizeImageUrl ? `${winner.rank}. ` : ""}
                {winner.prizeTitle}
              </p>
              <p className="text-[1.5rem] leading-8 text-neutral-600">
                {winner.displayName ?? t("anonymous")}
                {winner.ticketName ? (
                  <span className="font-medium text-deep-100">
                    {" "}
                    · {winner.ticketName}
                  </span>
                ) : null}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-center gap-6">
        {finished ? (
          <button
            onClick={replay}
            className="inline-flex items-center gap-4 px-12 py-4 rounded-[100px] border-2 border-black text-[1.5rem] font-semibold leading-8 text-deep-100 cursor-pointer"
          >
            <Refresh2 size="20" color="#0d0d0d" variant="Bulk" />
            {t("replay")}
          </button>
        ) : (
          <button
            onClick={skip}
            className="inline-flex items-center gap-4 px-12 py-4 rounded-[100px] border-2 border-neutral-300 text-[1.5rem] font-semibold leading-8 text-neutral-600 cursor-pointer"
          >
            <Forward size="20" color="#737c8a" variant="Bulk" />
            {t("skip")}
          </button>
        )}
      </div>

      {finished && order.length === 0 && (
        <p className="text-center text-[1.5rem] leading-8 text-neutral-500 inline-flex items-center justify-center gap-2">
          <Award size="20" color="#737c8a" variant="Bulk" />
          {t("noWinners")}
        </p>
      )}
    </div>
  );
}
