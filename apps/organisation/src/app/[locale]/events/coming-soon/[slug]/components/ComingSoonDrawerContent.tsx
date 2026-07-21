/* eslint-disable @next/next/no-img-element */
"use client";
import { slugify } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import {
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Calendar2, Edit2, Location, Warning2 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { LinkPrimary } from "@/components/shared/Links";
import { DateTime } from "luxon";

/**
 * The teaser's counterpart to `EventDrawerContent`.
 *
 * Same drawer, same rows, same footer — but a teaser answers "when?" with a
 * single date or a phrase like "Summer 2027" rather than a list of event days
 * with start and end times, and its venue is often not decided yet.
 */
export default function ComingSoonDrawerContent({ event }: { event: Event }) {
  const t = useTranslations("Events.coming_soon");
  const locale = useLocale();

  // A day, not an instant: parse it as a plain date so it does not shift a day
  // backwards for anyone west of UTC.
  const expectedDate = event.comingSoonDate
    ? DateTime.fromISO(event.comingSoonDate).setLocale(locale).toLocaleString(
        DateTime.DATE_FULL,
      )
    : null;
  const expected = expectedDate ?? event.comingSoonHint ?? null;

  return (
    <DrawerContent className={"my-6 p-6 lg:p-12 rounded-[30px] lg:w-[580px]"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-[40px]"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black"
            }
          >
            {t("details.title")}
          </span>
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          Teaser details
        </DrawerDescription>
        <div className={"w-full"}>
          <div className={"w-full gap-[30px] flex flex-col"}>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <img
                alt={event.eventName}
                src={event.eventImageUrl}
                className={
                  "rounded-[10px] w-full h-[298px] object-cover object-top"
                }
              />
            </div>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <span
                className={
                  "font-primary text-deep-100 font-medium text-[1.8rem]"
                }
              >
                {t("details.about")}
              </span>
              <div
                className="rich-text text-[1.5rem] leading-8 text-neutral-700"
                dangerouslySetInnerHTML={{ __html: event.eventDescription }}
              />
            </div>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <span
                className={
                  "font-primary text-deep-100 font-medium text-[1.8rem]"
                }
              >
                {t("details.title")}
              </span>
              <div className={"flex items-center gap-[5px]"}>
                <div
                  className={
                    "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full shrink-0"
                  }
                >
                  <Calendar2 size="20" color="#737c8a" variant="Bulk" />
                </div>
                <span
                  className={
                    "font-normal text-[1.4rem] leading-8 text-deep-200"
                  }
                >
                  {expected ?? t("stats.date_unset")}
                </span>
              </div>
              <div className={"flex items-center gap-[5px]"}>
                <div
                  className={
                    "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full shrink-0"
                  }
                >
                  <Location size="20" color="#737c8a" variant="Bulk" />
                </div>
                <span
                  className={
                    "font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[293px]"
                  }
                >
                  {event.address || t("details.no_venue")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DrawerFooter className="lg:flex-row pb-0">
        {event.deletionStatus != null ? (
          <div className="flex-1 flex items-center gap-3 rounded-[100px] border border-amber-300 bg-amber-50 px-5 py-[14px] text-amber-700 text-[1.4rem] font-medium leading-8 cursor-not-allowed">
            <Warning2 variant="Bulk" color="#b45309" size={20} />
            <span>{t("details.pending_deletion")}</span>
          </div>
        ) : (
          <LinkPrimary
            href={`/events/coming-soon/${slugify(event.eventName, event.eventId)}/edit`}
            className="flex-1 gap-4"
          >
            <Edit2 variant={"Bulk"} color={"#ffffff"} size={20} />{" "}
            {t("details.edit")}
          </LinkPrimary>
        )}
      </DrawerFooter>
    </DrawerContent>
  );
}
