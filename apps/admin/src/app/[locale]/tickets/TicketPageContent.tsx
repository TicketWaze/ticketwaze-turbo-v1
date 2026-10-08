"use client";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Ticket as TicketIcon, MoreCircle } from "iconsax-reactjs";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import { Reveal } from "@/components/shared/motion";
import TicketDetailsDrawer, { type TicketDetailsData } from "@/components/shared/TicketDetailsDrawer";
import { CHECK_BADGE, ticketClassColor } from "@/components/shared/ticketBadges";
import { Drawer } from "@/components/ui/drawer";
import { usePathname, useRouter } from "@/i18n/navigation";
import formatDateTime from "@/lib/formatDateTime";
import { cn } from "@/lib/utils";
import { Metric, TrendBadge } from "../analytics/parts";
import { PERIODS, readPeriod, type Period } from "../analytics/periods";

type TicketRow = TicketDetailsData & {
  createdAt: string;
  activity: TicketDetailsData["activity"] & { activityId: string; type: string };
};

export type TicketsData = {
  period: Period;
  stats: { sold: number; created: number; checkedIn: number };
  trends: { sold: number | null; created: number | null; checkedIn: number | null };
  tickets: {
    data: TicketRow[];
    meta: { total: number; perPage: number; currentPage: number; lastPage: number };
  };
};

/**
 * Figma "Admin" → Tickets (4334:88723 empty / 4351:91910 data): the overview
 * tiles under a period pill, then every ticket of every activity type with
 * status, purchase-time and search filters (no class filter — user decision),
 * a row ⋯ and numbered pages. A row opens the shared Ticket Details drawer
 * (4353:92712) with the data the API already sent. Filters live in the URL.
 * See the API's services/admin_tickets.ts for what the tiles count.
 */
export default function TicketPageContent({
  data,
  filters,
}: {
  data: TicketsData | null;
  filters: { status: string | null; purchased: string | null; search: string };
}) {
  const t = useTranslations("TicketsList");
  const tPeriods = useTranslations("Analytics.filters.periods");
  const tStatus = useTranslations("Activities.activity.resume.attendance.status");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(filters.search);
  const [selected, setSelected] = useState<TicketRow | null>(null);

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    // Any new filter starts again from the first page.
    if (!("page" in changes)) params.delete("page");
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  // Search follows typing, 300 ms after the last key.
  useEffect(() => {
    if (term.trim() === filters.search) return;
    const id = setTimeout(() => update({ search: term.trim() || null }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const period = readPeriod(data?.period);
  const rows = data?.tickets.data ?? [];
  const meta = data?.tickets.meta;
  const filtering = Boolean(filters.status || filters.purchased || filters.search);

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

  const tiles = data
    ? (["sold", "created", "checkedIn"] as const).map((key) => ({
        key,
        value: data.stats[key],
        trend: data.trends[key],
      }))
    : [];

  const head = "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase text-left";
  const cell = "py-6 pr-4 text-[1.5rem] leading-8 text-deep-100";
  const badge = "py-[0.3rem] px-2 rounded-[30px] text-[1.1rem] font-bold leading-6 uppercase whitespace-nowrap";

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")} aria-busy={pending}>
      {/* Heading + the tiles' period pill. */}
      <div className="sticky top-0 z-20 bg-white pb-8 flex items-center justify-between gap-6">
        <h3 className="font-primary font-medium text-[2.6rem] leading-12 text-black">
          {t("title")}
        </h3>
        <FilterPill
          label={t("filters.period")}
          value={period}
          defaultValue="month"
          options={PERIODS.map((p) => ({ value: p, label: tPeriods(p) }))}
          onChange={(v) => update({ period: v === "month" ? null : v })}
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
            <Metric label={t(tile.key)} trend={trend(tile.trend)}>
              {tile.value.toLocaleString(locale)}
            </Metric>
          </div>
        ))}
      </Reveal>

      <Reveal delay={0.05} className="flex flex-col gap-6 pt-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
            {t("list.title")}
          </h4>
          <div className="flex flex-wrap items-center gap-4">
            <FilterPill
              label={t("filters.status_label")}
              value={filters.status ?? "all"}
              defaultValue="all"
              placeholder={t("filters.status")}
              options={[
                { value: "all", label: t("filters.status") },
                { value: "CHECKED", label: t("filters.checked") },
                { value: "PENDING", label: t("filters.pending") },
                { value: "RETURNED", label: t("filters.returned") },
              ]}
              onChange={(v) => update({ status: v === "all" ? null : v })}
              pending={pending}
            />
            <FilterPill
              label={t("filters.time_label")}
              value={filters.purchased ?? "all"}
              defaultValue="all"
              placeholder={t("filters.time")}
              options={PERIODS.map((p) => ({ value: p, label: tPeriods(p) }))}
              onChange={(v) => update({ purchased: v === "all" ? null : v })}
              pending={pending}
            />
            <SearchField
              value={term}
              onChange={setTerm}
              placeholder={t("filters.search")}
              className="flex w-full lg:w-[26rem]"
            />
          </div>
        </div>

        <div className={cn("overflow-x-auto transition-opacity", pending && "opacity-60")}>
          <table className="w-full min-w-[84rem] border-collapse">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={head}>{t("list.table.id")}</th>
                <th className={head}>{t("list.table.attendee")}</th>
                <th className={head}>{t("list.table.activity")}</th>
                <th className={head}>{t("list.table.class")}</th>
                <th className={head}>{t("list.table.status")}</th>
                <th className={head}>{t("list.table.purchased")}</th>
                <th className={head}>
                  <span className="sr-only">{t("list.table.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.ticketId}
                  onClick={() => setSelected(row)}
                  className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <td className={cn(cell, "whitespace-nowrap")}>{row.ticketName}</td>
                  <td className={cell}>
                    <span className="block max-w-[18rem] truncate" title={row.fullName}>
                      {row.fullName}
                    </span>
                  </td>
                  <td className={cn(cell, "font-medium")}>
                    <span className="flex items-center gap-3 max-w-[22rem]">
                      <span className="truncate" title={row.activity.name}>
                        {row.activity.name}
                      </span>
                      {row.activity.type !== "event" &&
                        ["raffle", "sale", "restaurant"].includes(row.activity.type) && (
                          <span className="shrink-0 bg-primary-50 text-primary-500 text-[1rem] font-bold uppercase rounded-[30px] px-2 py-[0.2rem]">
                            {t(`list.type_badge.${row.activity.type}`)}
                          </span>
                        )}
                    </span>
                  </td>
                  <td className="py-6 pr-4">
                    <span
                      style={{ color: ticketClassColor(row.ticketType) }}
                      className={cn(badge, "inline-block max-w-[14rem] truncate bg-neutral-100")}
                    >
                      {row.ticketType}
                    </span>
                  </td>
                  <td className="py-6 pr-4">
                    <span className={cn(badge, CHECK_BADGE[row.status])}>{tStatus(row.status)}</span>
                  </td>
                  <td className={cn(cell, "whitespace-nowrap")}>
                    {formatDateTime(row.createdAt, locale)}
                  </td>
                  <td className="py-6 text-right">
                    <span
                      aria-hidden
                      className="relative w-[2rem] h-[2rem] shrink-0 rounded-full bg-neutral-100 inline-flex items-center justify-center after:absolute after:-inset-[0.8rem] after:content-['']"
                    >
                      <MoreCircle size="10" variant="Bulk" color="#737C8A" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 &&
          (filtering ? (
            <p className="text-[1.6rem] text-neutral-600 leading-10 text-center py-16">
              {t("list.no_results")}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-10 py-16">
              <div className="rounded-full bg-neutral-100 p-6">
                <div className="rounded-full bg-neutral-200 p-8">
                  <TicketIcon size="44" variant="Bulk" color="#454A53" />
                </div>
              </div>
              <p className="max-w-[44rem] text-[1.6rem] text-neutral-600 leading-9 text-center">
                {t("list.no_history")}
              </p>
            </div>
          ))}

        {meta && meta.lastPage > 1 && (
          <TablePagination
            page={meta.currentPage}
            count={meta.lastPage}
            onChange={(page) => update({ page: page > 1 ? String(page) : null })}
            prevLabel={t("list.prev")}
            nextLabel={t("list.next")}
          />
        )}
      </Reveal>

      <Drawer
        direction="right"
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        {selected && <TicketDetailsDrawer ticket={selected} />}
      </Drawer>
    </div>
  );
}
