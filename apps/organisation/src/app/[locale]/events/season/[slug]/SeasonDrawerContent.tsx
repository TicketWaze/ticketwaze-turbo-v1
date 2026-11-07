"use client";
import React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Award,
  Edit2,
  Location,
  Ticket,
  Clock,
} from "iconsax-reactjs";
import { Season, SeasonPassType } from "@ticketwaze/typescript-config";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Link } from "@/i18n/navigation";
import { Stagger } from "@/components/shared/motion";

/**
 * The season's details, in the same right-hand panel as an event's (Events ›
 * Event details): about, competition, home venue and the season pass price,
 * each with a pencil that opens the season's edit form.
 */
export default function SeasonDrawerContent({
  season,
  passType,
  editHref,
  open,
  onOpenChange,
}: {
  season: Season;
  passType?: SeasonPassType;
  /** The edit form, or undefined when the viewer may not edit. */
  editHref?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Events.season");
  const tEvent = useTranslations("Events.single_event");
  const locale = useLocale();
  const venue = [
    season.venueName,
    season.address,
    season.city,
    season.state,
    season.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="bg-white border-none outline-none my-6 mr-4 lg:mr-6 p-6 lg:p-12 rounded-[30px] data-[vaul-drawer-direction=right]:w-[calc(100vw-2rem)] data-[vaul-drawer-direction=right]:lg:w-[58rem]">
        <DrawerTitle className="font-primary font-medium text-center text-[2.6rem] leading-12 text-black pb-8">
          {t("page.details")}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("page.details")}
        </DrawerDescription>
        <div className="w-full flex flex-col gap-12 overflow-y-auto pb-6">
          <Stagger>
            <section className="flex flex-col gap-6">
              <Heading
                title={tEvent("about")}
                editLabel={tEvent("edit_section", { section: tEvent("about") })}
                href={editHref}
              />
              <div
                className="rich-text text-[1.5rem] leading-[3rem] text-neutral-700"
                dangerouslySetInnerHTML={{ __html: season.description }}
              />
            </section>
            <section className="flex flex-col gap-6">
              <Heading
                title={t("page.details")}
                editLabel={tEvent("edit_section", {
                  section: t("page.details"),
                })}
                href={editHref}
              />
              <ul className="flex flex-col gap-4">
                <IconRow
                  icon={<Award size="20" color="#737c8a" variant="Bulk" />}
                  label={t("page.competition")}
                >
                  {t(`sports.${season.sport}`)} · {season.competition}
                </IconRow>
                <IconRow
                  icon={<Location size="20" color="#737c8a" variant="Bulk" />}
                  label={t("page.venue")}
                >
                  {venue}
                </IconRow>
                <IconRow
                  icon={<Clock size="20" color="#737c8a" variant="Bulk" />}
                  label={t("page.timezone")}
                >
                  {season.timezone}
                </IconRow>
              </ul>
            </section>
            <section className="flex flex-col gap-6">
              <Heading
                title={t("pass.title")}
                editLabel={tEvent("edit_section", { section: t("pass.title") })}
                href={editHref}
              />
              <ul className="flex flex-col gap-4">
                <IconRow
                  icon={<Ticket size="20" color="#737c8a" variant="Bulk" />}
                  label={t("pass.price")}
                >
                  {passType ? (
                    <>
                      {(passType.currency === "USD"
                        ? Number(passType.usdPrice)
                        : Number(passType.price)
                      ).toLocaleString(locale, { maximumFractionDigits: 2 })}{" "}
                      {passType.currency}
                    </>
                  ) : (
                    "—"
                  )}
                </IconRow>
              </ul>
              <p className="text-[1.3rem] leading-7 text-neutral-600">
                {t("pass.hint")}
              </p>
            </section>
          </Stagger>
        </div>
        <DrawerClose className="lg:hidden w-full shrink-0 mt-4 h-[5rem] rounded-[10rem] border-2 border-primary-500 bg-primary-50 font-sans font-semibold text-[1.5rem] text-primary-500 cursor-pointer">
          {tEvent("close")}
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
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-4">
      <span className="w-[3.5rem] h-[3.5rem] shrink-0 flex items-center justify-center bg-neutral-100 rounded-full">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[1.2rem] leading-6 text-neutral-600">{label}</p>
        <p className="font-sans text-[1.4rem] leading-8 text-deep-200">
          {children}
        </p>
      </div>
    </li>
  );
}
