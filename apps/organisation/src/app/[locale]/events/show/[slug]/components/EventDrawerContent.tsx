"use client";
import { slugify } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Calendar2,
  Call,
  Clock,
  Edit2,
  Global,
  Location,
  Sms,
  Video,
  Warning2,
} from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import { eventStartsAt } from "@/lib/eventTime";
import { DateTime } from "luxon";
import { Stagger } from "@/components/shared/motion";
import React from "react";

/**
 * Figma's "Event Details" side panel (1644:55655): thumbnail, about, contact
 * information and dates, each with a pencil that opens the edit form at that
 * section. Contact details are the organisation's, so that pencil goes to the
 * profile settings. Pencils only show while the activity can still be edited.
 */
export default function EventDrawerContent({
  event,
  open,
  onOpenChange,
}: {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Events.single_event");
  const locale = useLocale();
  /**
   * Whether the event is still to start, which is what gates editing. Read
   * through the shared helper, which takes the earliest day's start in that
   * day's own timezone (not day 1's UTC-midnight date in the browser's zone).
   */
  const eventStart = eventStartsAt(event.eventDays);
  const isUpcoming = eventStart !== null && DateTime.now() < eventStart;
  const pendingDeletion = event.deletionStatus != null;
  const canEdit = isUpcoming && !pendingDeletion;
  const editHref = (section: string) =>
    `/events/show/${slugify(event.eventName, event.eventId)}/edit/${event.eventCategory}#${section}`;
  const organisation = event.organisation;
  const website = organisation?.organisationWebsite?.trim();
  const days = [...event.eventDays].sort((a, b) => a.dayNumber - b.dayNumber);
  const isOnline = event.eventCategory === "meet";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="bg-white border-none outline-none my-6 mr-4 lg:mr-6 p-6 lg:p-12 rounded-[30px] data-[vaul-drawer-direction=right]:w-[calc(100vw-2rem)] data-[vaul-drawer-direction=right]:lg:w-[58rem]">
        <DrawerTitle className="font-primary font-medium text-center text-[2.6rem] leading-12 text-black pb-8">
          {t("event_details")}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("event_details")}
        </DrawerDescription>
        <div className="w-full flex flex-col gap-12 overflow-y-auto pb-6">
          <Stagger>
            <section className="flex flex-col gap-6">
              <Heading
                title={t("thumbnail")}
                editLabel={t("edit_section", { section: t("thumbnail") })}
                href={canEdit ? editHref("thumbnail") : undefined}
              />
              <Image
                alt={event.eventName}
                src={event.eventImageUrl}
                height={298}
                width={520}
                className="w-full rounded-[1rem] h-[22rem] lg:h-[29.8rem] object-cover object-top"
              />
            </section>
            <section className="flex flex-col gap-6">
              <Heading
                title={t("about")}
                editLabel={t("edit_section", { section: t("about") })}
                href={canEdit ? editHref("about") : undefined}
              />
              <div
                className="rich-text text-[1.5rem] leading-[3rem] text-neutral-700"
                dangerouslySetInnerHTML={{ __html: event.eventDescription }}
              />
            </section>
            {organisation &&
              (organisation.organisationEmail ||
                organisation.organisationPhoneNumber ||
                website) && (
                <section className="flex flex-col gap-6">
                  <Heading
                    title={t("contact")}
                    editLabel={t("edit_section", { section: t("contact") })}
                    href={canEdit ? "/settings/profile" : undefined}
                  />
                  <ul className="flex flex-col gap-4">
                    {organisation.organisationEmail && (
                      <ContactRow
                        icon={<Sms size="20" color="#737c8a" variant="Bulk" />}
                      >
                        <a
                          href={`mailto:${organisation.organisationEmail}`}
                          className="hover:text-primary-500"
                        >
                          {organisation.organisationEmail}
                        </a>
                      </ContactRow>
                    )}
                    {organisation.organisationPhoneNumber && (
                      <ContactRow
                        icon={<Call size="20" color="#737c8a" variant="Bulk" />}
                      >
                        <a
                          href={`tel:${organisation.organisationPhoneNumber}`}
                          className="hover:text-primary-500"
                        >
                          {organisation.organisationPhoneNumber}
                        </a>
                      </ContactRow>
                    )}
                    {website && (
                      <ContactRow
                        icon={
                          <Global size="20" color="#737c8a" variant="Bulk" />
                        }
                      >
                        <a
                          href={
                            /^https?:\/\//.test(website)
                              ? website
                              : `https://${website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary-500 break-all"
                        >
                          {website.replace(/^https?:\/\//, "")}
                        </a>
                      </ContactRow>
                    )}
                  </ul>
                </section>
              )}
            <section className="flex flex-col gap-6">
              <Heading
                title={t("event_details")}
                editLabel={t("edit_section", { section: t("event_details") })}
                href={canEdit ? editHref("details") : undefined}
              />
              <ul className="flex flex-col gap-4">
                {days.map((day) => (
                  <React.Fragment key={day.eventDayId}>
                    <IconRow
                      icon={
                        <Calendar2 size="20" color="#737c8a" variant="Bulk" />
                      }
                    >
                      {formatDate(day.eventDate, locale, day.timezone)}
                    </IconRow>
                    <IconRow
                      icon={<Clock size="20" color="#737c8a" variant="Bulk" />}
                    >
                      {formatTime(day.startTime, day.timezone, locale)} -{" "}
                      {formatTime(day.endTime, day.timezone, locale)} ·{" "}
                      {day.timezone}
                    </IconRow>
                  </React.Fragment>
                ))}
                {isOnline ? (
                  event.onlineLink && (
                    <IconRow
                      icon={<Video size="20" color="#737c8a" variant="Bulk" />}
                    >
                      <a
                        href={event.onlineLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline break-all hover:text-primary-500"
                      >
                        {event.onlineLink}
                      </a>
                    </IconRow>
                  )
                ) : (
                  <IconRow
                    icon={<Location size="20" color="#737c8a" variant="Bulk" />}
                  >
                    {[event.address, event.city, event.country]
                      .filter(Boolean)
                      .join(", ")}
                  </IconRow>
                )}
              </ul>
            </section>
            {pendingDeletion && (
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-amber-300 bg-amber-50 px-5 py-4 text-amber-700 text-[1.4rem] font-medium leading-8">
                <Warning2
                  variant="Bulk"
                  color="#b45309"
                  size={20}
                  aria-hidden
                />
                <span>{t("cannot_edit_pending")}</span>
              </div>
            )}
          </Stagger>
        </div>
        {/* Phones close from the bottom (Figma 2220:56701). */}
        <DrawerClose className="lg:hidden w-full shrink-0 mt-4 h-[5rem] rounded-[10rem] border-2 border-primary-500 bg-primary-50 font-sans font-semibold text-[1.5rem] text-primary-500 cursor-pointer">
          {t("close")}
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}

function Heading({
  title,
  href,
  editLabel,
}: {
  title: string;
  href?: string;
  editLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h3 className="font-sans font-medium text-[1.8rem] leading-10 text-deep-100">
        {title}
      </h3>
      {href && (
        <Link
          href={href}
          aria-label={editLabel}
          title={editLabel}
          className="w-[3.5rem] h-[3.5rem] rounded-full bg-neutral-100 flex items-center justify-center transition-colors hover:bg-neutral-200"
        >
          <Edit2 size="18" variant="Bulk" color="#2E3237" aria-hidden />
        </Link>
      )}
    </div>
  );
}

function IconRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-4">
      <span className="w-[3.5rem] h-[3.5rem] shrink-0 flex items-center justify-center bg-neutral-100 rounded-full">
        {icon}
      </span>
      <span className="font-sans text-[1.4rem] leading-8 text-deep-200">
        {children}
      </span>
    </li>
  );
}

function ContactRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-4">
      <span className="flex shrink-0">{icon}</span>
      <span className="font-sans text-[1.5rem] leading-8 text-neutral-700 min-w-0">
        {children}
      </span>
    </li>
  );
}
