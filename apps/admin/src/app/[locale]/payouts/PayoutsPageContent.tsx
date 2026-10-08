"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { formatMoney } from "@ticketwaze/currency";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import FilterPill from "@/components/shared/FilterPill";
import { Reveal } from "@/components/shared/motion";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Metric, TrendBadge, Unit } from "../analytics/parts";
import { PERIODS, readPeriod, type Period } from "../analytics/periods";
import PayoutTable, { type PayoutPage } from "./PayoutTable";

export type PayoutsOverview = {
  period: Period;
  stats: { paid: { htg: number; usd: number }; pending: number; organisationsPaid: number };
  trends: { paid: number | null; pending: null; organisationsPaid: number | null };
};

/**
 * Figma "Admin" → Payouts (4384:74258 empty / 4384:74393 data): Total
 * Payouts / Pending Payout Requests / Total Organizers Paid under the period
 * pill, then "Payout request" and "Payout history", each with its own
 * Organisations | Attendees switch (user decision). See the API's
 * services/admin_payouts.ts for what the tiles count.
 */
export default function PayoutsPageContent({
  overview,
  requests,
  history,
}: {
  overview: PayoutsOverview | null;
  requests: PayoutPage | null;
  history: PayoutPage | null;
}) {
  const t = useTranslations("PayoutsList");
  const tPeriods = useTranslations("Analytics.filters.periods");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  // Settling a request moves it from one table to the other: both reload.
  const [refreshKey, setRefreshKey] = useState(0);

  const period = readPeriod(overview?.period);
  const number = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 });
  const trend = (value: number | null) => (
    <TrendBadge
      value={value}
      label={value === null ? "" : t(value < 0 ? "trend.down" : "trend.up", { value: Math.abs(value) })}
    />
  );

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "month") params.delete("period");
    else params.set("period", value);
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  const tiles = overview
    ? [
        {
          key: "paid",
          figure: (
            <>
              {number(overview.stats.paid.htg)} <Unit>HTG</Unit>
            </>
          ),
          note: formatMoney(overview.stats.paid.usd, "USD", locale),
          trend: overview.trends.paid,
        },
        { key: "pending", figure: number(overview.stats.pending), note: null, trend: null },
        {
          key: "organisationsPaid",
          figure: number(overview.stats.organisationsPaid),
          note: null,
          trend: overview.trends.organisationsPaid,
        },
      ]
    : [];

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")} aria-busy={pending}>
      <div className="sticky top-0 z-20 bg-white pb-8 flex items-center justify-between gap-6">
        <h3 className="font-primary font-medium text-[2.6rem] leading-12 text-black">{t("title")}</h3>
        <FilterPill
          label={t("period")}
          value={period}
          defaultValue="month"
          options={PERIODS.map((p) => ({ value: p, label: tPeriods(p) }))}
          onChange={setPeriod}
          pending={pending}
        />
      </div>

      <Reveal className="grid grid-cols-2 lg:grid-cols-3 border-b border-neutral-100">
        {tiles.map((tile, i) => (
          <div
            key={tile.key}
            title={t(`hints.${tile.key}`)}
            className={cn(
              "py-6 pr-6 lg:pr-10 border-neutral-100",
              i === 1 && "pl-6 lg:pl-10 border-l",
              i === 2 && "col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:pl-10 lg:border-l",
            )}
          >
            <Metric label={t(tile.key)} trend={trend(tile.trend)} note={tile.note}>
              {tile.figure}
            </Metric>
          </div>
        ))}
      </Reveal>

      <Reveal delay={0.05} className="flex flex-col gap-16 pt-12">
        <PayoutTable
          scope="requests"
          initial={requests}
          refreshKey={refreshKey}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
        <PayoutTable
          scope="history"
          initial={history}
          refreshKey={refreshKey}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      </Reveal>
    </div>
  );
}
