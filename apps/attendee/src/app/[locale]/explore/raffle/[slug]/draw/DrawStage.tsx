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
const SPIN_MS = 2600;
/** Beat between one prize locking and the next reel starting. */
const GAP_MS = 900;
/** Reel tick at the start and at the end; it eases between the two. */
const TICK_FAST_MS = 55;
const TICK_SLOW_MS = 320;

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
  const [spinningCode, setSpinningCode] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const skip = useCallback(() => {
    clearTimers();
    setSpinningCode(null);
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

    let elapsed = 0;
    order.forEach((winner, index) => {
      const spinStart = elapsed;

      // Decelerating reel: tick interval eases from fast to slow across the
      // spin, so it reads as slowing to a stop rather than cutting off.
      let tick = 0;
      const schedule = (offset: number) => {
        const progress = offset / SPIN_MS;
        const delay = TICK_FAST_MS + (TICK_SLOW_MS - TICK_FAST_MS) * progress ** 3;
        const next = offset + delay;
        if (next >= SPIN_MS) return;
        timers.current.push(
          setTimeout(() => {
            setSpinningCode(pool[Math.floor(Math.random() * pool.length)]);
          }, spinStart + next),
        );
        tick += 1;
        if (tick < 400) schedule(next);
      };
      schedule(0);

      timers.current.push(
        setTimeout(() => {
          setSpinningCode(null);
          setRevealed(index + 1);
        }, spinStart + SPIN_MS),
      );

      elapsed = spinStart + SPIN_MS + GAP_MS;
    });

    timers.current.push(setTimeout(() => setFinished(true), elapsed));
  }, [clearTimers, order, reel]);

  /** Replay from the top. Resetting here is fine: it is an event handler. */
  const replay = useCallback(() => {
    clearTimers();
    setRevealed(0);
    setSpinningCode(null);
    setFinished(false);
    start();
  }, [clearTimers, start]);

  useEffect(() => {
    start();
    return clearTimers;
  }, [start, clearTimers]);

  const isSpinning = spinningCode !== null;
  const nextPrize = order[revealed];

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-2 text-center">
        <span className="text-[1.4rem] leading-8 text-neutral-600">
          {t("entriesInDraw", { count: entryCount })}
        </span>
      </div>

      {/* The reel: only mounted while a prize is being drawn. */}
      {isSpinning && nextPrize && (
        <div className="flex flex-col items-center gap-6 py-8">
          <span className="text-[1.4rem] uppercase tracking-widest text-neutral-500">
            {t("drawingRank", { rank: nextPrize.rank })}
          </span>
          {/* Showing the prize while its number spins is the point of the
              wait — people should see what is at stake. */}
          {nextPrize.prizeImageUrl && (
            <Image
              src={nextPrize.prizeImageUrl}
              alt={nextPrize.prizeTitle}
              width={160}
              height={160}
              className="w-40 h-40 rounded-[1.5rem] object-cover"
            />
          )}
          <div className="w-full max-w-[42rem] rounded-[20px] border-2 border-primary-500/30 bg-neutral-50 px-8 py-12 flex items-center justify-center overflow-hidden">
            <span
              key={spinningCode}
              className="font-primary font-bold text-[3.2rem] lg:text-[4.4rem] leading-none tracking-widest text-deep-100 tw-reel-tick"
            >
              {spinningCode}
            </span>
          </div>
          <span className="text-[1.6rem] leading-8 text-neutral-600">
            {nextPrize.prizeTitle}
          </span>
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
