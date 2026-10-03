"use client";
import ActivityMoreMenu from "@/components/activity/ActivityMoreMenu";
import {
  AddEventToFavorite,
  RemoveEventToFavorite,
} from "@/actions/eventActions";
import { usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Event, EventDay } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import SaveButton from "@/components/activity/SaveButton";
import AddToCalendar from "../../explore/[slug]/AddToCalendar";
import { LinkPrimary } from "@/components/shared/Links";
import ShareEvent from "@/components/shared/ShareEvent";
import { DateTime } from "luxon";
import { isEventLiveAt, nextStartAfter } from "@/lib/eventSchedule";

function useCountdownToNextDay(eventDays: EventDay[]): string | null {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    function compute() {
      const now = DateTime.now();

      /**
       * Resolved in the EVENT's timezone, not the browser's.
       *
       * This used to parse a naive "2026-08-14T11:00" string, which JavaScript
       * reads as local time for whoever is looking, so a buyer abroad counted
       * down to the wrong moment entirely. See lib/eventSchedule.
       */
      const next = nextStartAfter(eventDays, now);

      if (!next) {
        setCountdown(null);
        return;
      }

      const diff = next.diff(now).toMillis();
      const totalHours = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);

      if (totalHours >= 24) {
        const d = Math.floor(totalHours / 24);
        const h = totalHours % 24;
        setCountdown(
          `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`,
        );
      } else if (totalHours > 0) {
        setCountdown(
          `${totalHours}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`,
        );
      } else {
        setCountdown(`${m}m ${String(s).padStart(2, "0")}s`);
      }
    }

    compute();
    const interval = setInterval(compute, 1_000);
    return () => clearInterval(interval);
  }, [eventDays]);

  return countdown;
}

export default function EventActions({
  event,
  isFavorite,
  moreInfo,
}: {
  event: Event;
  isFavorite: boolean;
  /** Extra ⋯ menu row (the "More information" dialog for in-person tickets). */
  moreInfo?: React.ReactNode;
}) {
  const t = useTranslations("Event");
  const { data: session } = useSession();
  const pathname = usePathname();
  const locale = useLocale();
  async function AddToFavorite() {
    const result = await AddEventToFavorite(
      session?.user.accessToken ?? "",
      event.eventId,
      event.organisationId,
      pathname,
      locale,
    );
    if (result.error) toast.error(result.message);
    return !result.error;
  }
  async function RemoveToFavorite() {
    const result = await RemoveEventToFavorite(
      session?.user.accessToken ?? "",
      event.eventId,
      pathname,
      locale,
    );
    if (result.error) toast.error(result.message);
    return !result.error;
  }
  function useIsEventLive(eventDays: EventDay[]): boolean {
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
      function check() {
        /**
         * THE WINDOW IN THE EVENT'S OWN TIMEZONE.
         *
         * This gates the Join button, so getting the zone wrong is not
         * cosmetic: the old naive parse used the viewer's local time, which
         * meant a buyer in a different timezone from the event found the button
         * still locked while the call they had paid for was already running,
         * or unlocked hours before anyone was there. See lib/eventSchedule.
         */
        setIsLive(isEventLiveAt(eventDays, DateTime.now()));
      }

      check();
      const interval = setInterval(check, 10_000); // re-check every 10s
      return () => clearInterval(interval);
    }, [eventDays]);

    return isLive;
  }
  const isLive = useIsEventLive(event.eventDays);
  const countdown = useCountdownToNextDay(event.eventDays);
  // A live event is only "joinable" when it actually has a meet link. In-person
  // events have a null googleMeetLink, and passing null to <Link> crashes it
  // ("Cannot read properties of null (reading 'pathname')").
  /**
   * WHERE THIS VIEWER JOINS FROM.
   *
   * Google Meet is one link for the whole event, held on the event. Zoom is
   * one link PER BUYER, issued when they were registered and held on their own
   * ticket — so for a Zoom event the event's own `zoomJoinUrl` is the wrong
   * one to hand out and is deliberately ignored here.
   *
   * A Zoom ticket with no link yet is a registration that has not landed. The
   * hourly retry sweep is still working on it, so the button stays disabled
   * rather than sending the holder somewhere that will turn them away.
   */
  const onlineJoinUrl =
    event.onlineProvider === "zoom"
      ? (event.tickets?.find((ticket) => ticket.zoomJoinUrl)?.zoomJoinUrl ??
        null)
      : event.googleMeetLink;

  // In-person events have a null link, and passing null to <Link> crashes it
  // ("Cannot read properties of null (reading 'pathname')").
  const canJoinLive = isLive && Boolean(onlineJoinUrl);
  const joinHref = (isLive && onlineJoinUrl) || "#";
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-around lg:justify-start w-full lg:w-auto gap-8">
          <ShareEvent event={event} />
          {event.eventCategory !== "meet" && <AddToCalendar event={event} />}
          <SaveButton
            initialSaved={isFavorite}
            save={AddToFavorite}
            unsave={RemoveToFavorite}
          />
          <ActivityMoreMenu
            activityId={event.eventId}
            organisationId={event.organisationId}
            extra={moreInfo}
          />
        </div>
        <div className="hidden lg:flex flex-col items-end gap-1">
          <LinkPrimary
            target="_blank"
            rel="noopener noreferrer"
            href={joinHref}
            aria-disabled={!canJoinLive}
            onClick={(e) => {
              if (!canJoinLive) e.preventDefault();
            }}
            className={
              !canJoinLive
                ? "opacity-50 pointer-events-none cursor-not-allowed"
                : ""
            }
          >
            {!isLive ? countdown : t("join")}
          </LinkPrimary>
        </div>
      </div>
      <div className="lg:hidden flex w-full flex-col items-end gap-1">
        <LinkPrimary
          target="_blank"
          rel="noopener noreferrer"
          href={joinHref}
          aria-disabled={!canJoinLive}
          onClick={(e) => {
            if (!canJoinLive) e.preventDefault();
          }}
          className={
            !canJoinLive
              ? "opacity-50 pointer-events-none cursor-not-allowed w-full"
              : "w-full"
          }
        >
          {!isLive ? countdown : t("join")}
        </LinkPrimary>
      </div>
    </div>
  );
}
