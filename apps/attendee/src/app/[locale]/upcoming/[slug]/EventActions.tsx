"use client";
import {
  AddEventToFavorite,
  RemoveEventToFavorite,
} from "@/actions/eventActions";
import { usePathname } from "@/i18n/navigation";
import { Heart, MoreCircle } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ReportEventComponent from "../../explore/[slug]/ReportEventComponent";
import ReportOrganisationComponent from "../../explore/[slug]/ReportOrganisationComponent";
import { Event, EventDay, User } from "@ticketwaze/typescript-config";
import PageLoader from "@/components/PageLoader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import AddToCalendar from "../../explore/[slug]/AddToCalendar";
import { LinkPrimary } from "@/components/shared/Links";
import ShareEvent from "@/components/shared/ShareEvent";

function useCountdownToNextDay(eventDays: EventDay[]): string | null {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    function compute() {
      const now = new Date();

      const upcoming = eventDays
        .map((day) => {
          const dateStr =
            typeof day.eventDate === "string"
              ? day.eventDate.split("T")[0]
              : new Date(day.eventDate).toISOString().split("T")[0];
          return new Date(`${dateStr}T${day.startTime}`);
        })
        .filter((start) => start > now)
        .sort((a, b) => a.getTime() - b.getTime());

      if (upcoming.length === 0) {
        setCountdown(null);
        return;
      }

      const diff = upcoming[0].getTime() - now.getTime();
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
  user,
  isFavorite,
}: {
  event: Event;
  user: User;
  isFavorite: boolean;
}) {
  const t = useTranslations("Event");
  const pathname = usePathname();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  async function AddToFavorite() {
    setIsLoading(true);
    const result = await AddEventToFavorite(
      user.accessToken,
      event.eventId,
      event.organisationId,
      pathname,
      locale,
    );
    if (result.error) {
      toast.error(result.message);
    }

    setIsLoading(false);
  }
  async function RemoveToFavorite() {
    setIsLoading(true);
    const result = await RemoveEventToFavorite(
      user.accessToken,
      event.eventId,
      pathname,
      locale,
    );
    if (result.error) {
      toast.error(result.message);
    }

    setIsLoading(false);
  }
  function useIsEventLive(eventDays: EventDay[]): boolean {
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
      function check() {
        const now = new Date();
        const live = eventDays.some((day) => {
          const dateStr =
            typeof day.eventDate === "string"
              ? day.eventDate.split("T")[0]
              : new Date(day.eventDate).toISOString().split("T")[0];

          const start = new Date(`${dateStr}T${day.startTime}`);
          const end = new Date(`${dateStr}T${day.endTime}`);

          return now >= start && now <= end;
        });
        setIsLive(live);
      }

      check();
      const interval = setInterval(check, 10_000); // re-check every 10s
      return () => clearInterval(interval);
    }, [eventDays]);

    return isLive;
  }
  const isLive = useIsEventLive(event.eventDays);
  const countdown = useCountdownToNextDay(event.eventDays);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <PageLoader isLoading={isLoading} />
        <div className="flex items-center justify-around lg:justify-start w-full lg:w-auto gap-8">
          <ShareEvent event={event} />
          {event.eventCategory !== "meet" && <AddToCalendar event={event} />}
          {isFavorite ? (
            <button
              disabled={isLoading}
              onClick={RemoveToFavorite}
              className="w-14 h-14 group flex items-center justify-center rounded-[30px] cursor-pointer bg-primary-100"
            >
              <Heart size="20" color="#E45B00" variant="Bulk" />
            </button>
          ) : (
            <button
              disabled={isLoading}
              onClick={AddToFavorite}
              className="w-14 h-14 group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500"
            >
              <Heart
                size="20"
                className='"stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500'
                variant="Bulk"
              />
            </button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <span className="w-14 h-14 group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
                <MoreCircle variant={"Bulk"} color={"#737C8A"} size={20} />
                {/* {t('more')} */}
              </span>
            </PopoverTrigger>
            <PopoverContent
              className={
                "bg-neutral-100 border border-neutral-200 right-8 p-4 pb-8 w-92  mb-8 rounded-2xl shadow-xl bottom-full flex flex-col gap-4"
              }
            >
              <span
                className={
                  "font-medium py-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8"
                }
              >
                {t("more")}
              </span>

              <ReportEventComponent event={event} />
              <div className="h-px bg-neutral-200 w-full"></div>
              <ReportOrganisationComponent event={event} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-1">
          <LinkPrimary
            target="_blank"
            rel="noopener noreferrer"
            href={isLive ? event.googleMeetLink : "#"}
            aria-disabled={!isLive}
            onClick={(e) => {
              if (!isLive) e.preventDefault();
            }}
            className={
              !isLive ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
            }
          >
            {!isLive ? countdown : "test"}
          </LinkPrimary>
        </div>
      </div>
      <div className="lg:hidden flex w-full flex-col items-end gap-1">
        <LinkPrimary
          target="_blank"
          rel="noopener noreferrer"
          href={isLive ? event.googleMeetLink : "#"}
          aria-disabled={!isLive}
          onClick={(e) => {
            if (!isLive) e.preventDefault();
          }}
          className={
            !isLive
              ? "opacity-50 pointer-events-none cursor-not-allowed w-full"
              : "w-full"
          }
        >
          {!isLive ? countdown : "test"}
        </LinkPrimary>
      </div>
    </div>
  );
}
