"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@ticketwaze/currency";
import { Reveal } from "@/components/shared/motion";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import { cn } from "@/lib/utils";
import AnalyticsFilters from "./AnalyticsFilters";
import RevenueChart, { type RevenuePoint } from "./RevenueChart";
import SignupsChart, { type SignupPoint } from "./SignupsChart";
import { BarList, Metric, PanelTitle, SectionTitle, TrendBadge, Unit } from "./parts";
import { readPeriod, type Period } from "./periods";
import type { Granularity } from "./axis";

type Money = { htg: number; usd: number };

export type AnalyticsData = {
  filters: { period: Period; eventId: string | null };
  events: { eventId: string; name: string }[];
  stats: {
    revenue: Money;
    users: number;
    attendees: number;
    organizers: number;
    events: number;
    ticketsSold: number;
    avgTicketsPerAttendee: number;
    topOrganizerRevenue: Money;
  };
  trends: Record<
    | "revenue"
    | "users"
    | "attendees"
    | "organizers"
    | "events"
    | "ticketsSold"
    | "avgTicketsPerAttendee"
    | "topOrganizerRevenue",
    number | null
  >;
  series: {
    granularity: Granularity;
    revenue: RevenuePoint[];
    users: SignupPoint[];
  };
  gender: Record<"male" | "female" | "others", { count: number; percent: number }>;
  top: { name: string; sold: number; percent: number }[];
};

/**
 * Figma "Admin" → Analytics ("Platform Overview", 4009:103596 / 4111:65348):
 * heading with the event and period pills, eight KPI tiles, Income
 * Performance, User Demographics and User Growth. KPIs follow both filters
 * (see the API's services/admin_analytics.ts); money is HTG with the USD
 * equivalent in small type.
 */
export default function AnalyticsPageContent({ data }: { data: AnalyticsData | null }) {
  const t = useTranslations("Analytics");
  const locale = useLocale();
  const period = readPeriod(data?.filters.period);
  const eventId = data?.filters.eventId ?? null;

  const number = (n: number) => n.toLocaleString(locale);
  // Figma: "20,553,758,125.90 HTG", and a plain "0 HTG" when empty.
  const money = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const htg = (n: number) => (
    <>
      {n === 0 ? "0" : money.format(n)} <Unit>HTG</Unit>
    </>
  );
  const usd = (n: number) => formatMoney(n, "USD", locale);
  const trend = (value: number | null) => (
    <TrendBadge
      value={value}
      label={
        value === null
          ? ""
          : t(value < 0 ? "trend.down" : "trend.up", { value: Math.abs(value) })
      }
    />
  );

  const stats = data?.stats;
  const tiles: {
    label: string;
    value: ReactNode;
    trend: number | null;
    note?: string;
  }[] = stats
    ? [
        { label: t("kpis.revenue"), value: htg(stats.revenue.htg), trend: data.trends.revenue, note: usd(stats.revenue.usd) },
        { label: t("kpis.users"), value: number(stats.users), trend: data.trends.users },
        { label: t("kpis.attendees"), value: number(stats.attendees), trend: data.trends.attendees },
        { label: t("kpis.organizers"), value: number(stats.organizers), trend: data.trends.organizers },
        { label: t("kpis.events"), value: number(stats.events), trend: data.trends.events },
        { label: t("kpis.sold"), value: number(stats.ticketsSold), trend: data.trends.ticketsSold },
        { label: t("kpis.avg"), value: number(stats.avgTicketsPerAttendee), trend: data.trends.avgTicketsPerAttendee },
        {
          label: t("kpis.top_organizer"),
          value: htg(stats.topOrganizerRevenue.htg),
          trend: data.trends.topOrganizerRevenue,
          note: usd(stats.topOrganizerRevenue.usd),
        },
      ]
    : [];

  // Figma's empty state still lists three rows with dashes and zeros.
  const topRows = Array.from({ length: 3 }, (_, i) => data?.top[i]);
  const gender = data?.gender;

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")}>
      {/* Heading row (sticky) — title + description, filters on the right. */}
      <div className="sticky top-0 z-20 bg-white pb-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-primary font-medium text-[2.6rem] leading-12 text-black">
            {t("title")}
          </h3>
          <p className="text-[1.5rem] leading-8 text-neutral-600">{t("description")}</p>
        </div>
        {data && (
          <AnalyticsFilters events={data.events} eventId={eventId} period={period} />
        )}
      </div>

      {/* KPI grid: 4 × 2 with hairlines between cells (2 × 4 on phones). */}
      <Reveal className="grid grid-cols-2 lg:grid-cols-4 border-b border-neutral-100">
        {tiles.map((tile, i) => (
          <div
            key={tile.label}
            className={cn(
              "py-8 pr-6 lg:pr-10 border-neutral-100",
              // Phones: two columns, hairline between them and under rows 1–3.
              i % 2 === 1 && "pl-6 border-l",
              i < 6 && "border-b",
              // Desktop: four columns, hairline before columns 2–4, under row 1.
              "lg:pl-0 lg:border-l-0 lg:border-b-0",
              i % 4 !== 0 && "lg:pl-10 lg:border-l",
              i < 4 && "lg:border-b",
            )}
          >
            <Metric label={tile.label} trend={trend(tile.trend)} note={tile.note}>
              {tile.value}
            </Metric>
          </div>
        ))}
      </Reveal>

      {/* Income Performance */}
      <Reveal delay={0.05} className="flex flex-col gap-8 pt-14">
        <SectionTitle>{t("income.title")}</SectionTitle>
        <PanelTitle>{t("income.revenue")}</PanelTitle>
        <RevenueChart
          points={data?.series.revenue ?? []}
          granularity={data?.series.granularity ?? "day"}
        />
      </Reveal>

      {/* User Demographics */}
      <Reveal delay={0.1} className="flex flex-col gap-10 pt-16">
        <SectionTitle>{t("demographics.title")}</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-neutral-100">
          <div className="flex flex-col gap-8 pb-10 lg:pr-10 border-b lg:border-b-0 lg:border-r border-neutral-100">
            <PanelTitle>{t("demographics.gender")}</PanelTitle>
            <BarList
              rows={(["male", "female", "others"] as const).map((key) => ({
                label: t(`demographics.${key}`),
                value: gender?.[key].percent ?? 0,
                // Figma's empty state prints 0 rather than 0%.
                display:
                  gender && gender.male.count + gender.female.count + gender.others.count > 0
                    ? `${gender[key].percent}%`
                    : "0",
              }))}
            />
          </div>
          <div className="flex flex-col gap-8 py-10 lg:pt-0 lg:pl-10">
            <PanelTitle>
              {eventId ? t("demographics.top_classes") : t("demographics.top_events")}
            </PanelTitle>
            <BarList
              truncateLabels
              rows={topRows.map((row) => ({
                label: row?.name ?? "-",
                value: row?.percent ?? 0,
                display: row ? `${row.percent}%` : "0",
              }))}
            />
          </div>
        </div>
      </Reveal>

      {/* User Growth */}
      <Reveal delay={0.15} className="flex flex-col gap-8 pt-16">
        <SectionTitle>{t("growth.title")}</SectionTitle>
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <PanelTitle>{t("growth.signups")}</PanelTitle>
          <div className="flex items-center gap-6">
            <Legend color="bg-primary-500" label={t("growth.attendee")} />
            <Legend color="bg-primary-50" label={t("growth.organizer")} />
          </div>
        </div>
        <SignupsChart
          points={data?.series.users ?? []}
          granularity={data?.series.granularity ?? "day"}
        />
      </Reveal>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-[1.4rem] leading-8 text-neutral-600">
      <span className={cn("w-6 h-6", color)} />
      {label}
    </span>
  );
}
