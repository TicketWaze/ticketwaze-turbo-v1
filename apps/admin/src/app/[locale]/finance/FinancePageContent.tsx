"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { WalletMoney } from "iconsax-reactjs";
import { usePathname, useRouter } from "@/i18n/navigation";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHeader from "@/components/shared/SettingsHeader";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import { Reveal } from "@/components/shared/motion";
import {
  Badge,
  EmptyState,
  RowMore,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_ROW,
  TableFrame,
} from "@/components/shared/DataTable";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Metric, Unit } from "../analytics/parts";
import FinanceActivityDrawer from "./FinanceActivityDrawer";
import {
  FINANCE_PERIODS,
  formatAmount,
  formatMoney,
  type FinanceActivitiesPage,
  type FinancePeriod,
  type FinanceSummary,
  type Money as MoneyAmount,
} from "./types";

/**
 * Settings → Finance: what Ticketwaze itself earned (see the API's
 * services/finance.ts for the definitions). Earnings per channel on the first
 * row of tiles, estimated net on the second, in USD with HTG underneath; then
 * every activity's books, searchable, a row opening its drawer.
 */
export default function FinancePageContent({
  summary,
  activities,
  period,
  search,
}: {
  summary: FinanceSummary;
  activities: FinanceActivitiesPage;
  period: FinancePeriod;
  search: string;
}) {
  const t = useTranslations("Finance");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function hrefFor(next: { period?: string; page?: number; search?: string }) {
    const params = new URLSearchParams();
    const p = next.period ?? period;
    if (p !== "all") params.set("period", p);
    const s = next.search ?? term.trim();
    if (s) params.set("search", s);
    const page = next.page ?? 1;
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function navigate(href: string) {
    startTransition(() => router.replace(href, { scroll: false }));
  }

  /**
   * Search is server-side so it covers every activity, not just the page on
   * screen. Debounced so a word typed is one request, not one per letter.
   */
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const handle = setTimeout(() => navigate(hrefFor({ search: term.trim(), page: 1 })), 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const subscriptionsUsd = summary.breakdown.subscriptions.usd;
  const tiles: { key: string; label: string; value: MoneyAmount; note?: string }[] = [
    {
      key: "total",
      label: t("summary.total_earned"),
      value: summary.gross,
      note:
        subscriptionsUsd > 0
          ? t("summary.includes_subscriptions", { amount: formatAmount(subscriptionsUsd) })
          : undefined,
    },
    { key: "moncash", label: t("summary.moncash_earned"), value: summary.channels.moncash.gross },
    { key: "stripe", label: t("summary.stripe_earned"), value: summary.channels.stripe.gross },
    { key: "net", label: t("summary.total_net"), value: summary.net },
    { key: "moncash_net", label: t("summary.moncash_net"), value: summary.channels.moncash.net },
    { key: "stripe_net", label: t("summary.stripe_net"), value: summary.channels.stripe.net },
  ];

  const rows = activities.data;
  const { meta } = activities;

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")} aria-busy={pending}>
      <SettingsHeader
        title={t("title")}
        actions={
          <FilterPill
            label={t("period_label")}
            value={period}
            defaultValue="all"
            options={FINANCE_PERIODS.map((p) => ({ value: p, label: t(`periods.${p}`) }))}
            onChange={(v) => navigate(hrefFor({ period: v, page: 1 }))}
            pending={pending}
          />
        }
      />

      {/* Earnings on the first row, estimated net on the second. */}
      <Reveal
        className={cn(
          "grid grid-cols-2 lg:grid-cols-3 border-b border-neutral-100 transition-opacity",
          pending && "opacity-60",
        )}
      >
        {tiles.map((tile, i) => (
          <div
            key={tile.key}
            className={cn(
              "py-6 pr-6 border-neutral-100",
              i % 2 === 1 && "max-lg:pl-6 max-lg:border-l",
              i % 3 !== 0 && "lg:pl-10 lg:border-l",
              i >= 2 && "max-lg:border-t",
              i >= 3 && "lg:border-t",
            )}
          >
            <Metric
              label={tile.label}
              note={
                <>
                  {formatAmount(tile.value.htg)} HTG
                  {tile.note && <span className="block">{tile.note}</span>}
                </>
              }
            >
              <span className={tile.value.usd < 0 ? "text-failure" : undefined}>
                {formatAmount(tile.value.usd)}
              </span>{" "}
              <Unit>USD</Unit>
            </Metric>
          </div>
        ))}
      </Reveal>

      <Reveal delay={0.05} className="flex flex-col gap-6 pt-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
            {t("activities.title")}
          </h4>
          <SearchField
            value={term}
            onChange={setTerm}
            placeholder={t("activities.search")}
            className="flex w-full lg:w-[32rem]"
          />
        </div>

        <TableFrame minWidth="96rem" pending={pending}>
          <thead>
            <tr className="border-b border-neutral-100">
              <th className={TABLE_HEAD}>{t("activities.table.activity")}</th>
              <th className={TABLE_HEAD}>{t("activities.table.type")}</th>
              <th className={TABLE_HEAD}>{t("activities.table.organisation")}</th>
              <th className={TABLE_HEAD}>{t("activities.table.sold")}</th>
              <th className={TABLE_HEAD}>{t("activities.table.collected")}</th>
              <th className={TABLE_HEAD}>{t("activities.table.earned")}</th>
              <th className={TABLE_HEAD}>{t("activities.table.net")}</th>
              <th className={TABLE_HEAD}>
                <span className="sr-only">{t("activities.table.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const net = row.currency === "USD" ? row.net.usd : row.net.htg;
              return (
                <tr
                  key={row.activityId}
                  className={TABLE_ROW}
                  onClick={() => {
                    setSelectedId(row.activityId);
                    setDrawerOpen(true);
                  }}
                >
                  <td className={cn(TABLE_CELL, "font-medium")}>
                    <span title={row.name} className="block max-w-[24rem] truncate">
                      {row.name}
                    </span>
                  </td>
                  <td className="py-6 pr-4">
                    <Badge tone="primary">{t(`types.${row.activityType}`)}</Badge>
                  </td>
                  <td className={TABLE_CELL}>
                    <span title={row.organisationName} className="block max-w-[18rem] truncate">
                      {row.organisationName}
                    </span>
                  </td>
                  <td className={TABLE_CELL}>{row.unitsSold.toLocaleString(locale)}</td>
                  <td className={TABLE_CELL}>
                    <MoneyCell money={row.collected} currency={row.currency} />
                  </td>
                  <td className={cn(TABLE_CELL, "font-medium")}>
                    <MoneyCell money={row.fees} currency={row.currency} />
                  </td>
                  <td className={cn(TABLE_CELL, net < 0 && "text-failure")}>
                    <MoneyCell money={row.net} currency={row.currency} />
                  </td>
                  <td className="py-6 text-right">
                    <RowMore />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableFrame>

        {rows.length === 0 && (
          <EmptyState
            Icon={WalletMoney}
            filtered={Boolean(search)}
            text={search ? t("activities.no_results", { term: search }) : t("activities.empty")}
          />
        )}

        {meta.lastPage > 1 && (
          <TablePagination
            page={meta.currentPage}
            count={meta.lastPage}
            onChange={(page) => navigate(hrefFor({ page }))}
            prevLabel={t("activities.prev")}
            nextLabel={t("activities.next")}
          />
        )}
      </Reveal>

      <Drawer direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
        {selectedId && (
          <FinanceActivityDrawer activityId={selectedId} period={period} locale={locale} />
        )}
      </Drawer>
    </div>
  );
}

/**
 * An amount in the activity's own currency. A USD activity also gets its HTG
 * equivalent underneath, the same way the tiles do.
 */
function MoneyCell({ money, currency }: { money: MoneyAmount; currency: string }) {
  return (
    <span className="flex flex-col whitespace-nowrap">
      <span>{formatMoney(money, currency)}</span>
      {currency === "USD" && (
        <span className="text-[1.2rem] text-neutral-500 font-normal leading-6">
          {formatAmount(money.htg)} HTG
        </span>
      )}
    </span>
  );
}
