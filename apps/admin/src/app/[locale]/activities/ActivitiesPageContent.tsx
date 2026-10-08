"use client";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Calendar, MoreCircle } from "iconsax-reactjs";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import { Reveal } from "@/components/shared/motion";
import SuspendActivityDialog, { type ActivityKind } from "@/components/shared/SuspendActivityDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePathname, useRouter } from "@/i18n/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import formatDateTime from "@/lib/formatDateTime";
import { cn } from "@/lib/utils";
import { Metric, TrendBadge } from "../analytics/parts";
import { PERIODS, readPeriod, type Period } from "../analytics/periods";

export type ActivityStatus =
  | "deleted"
  | "cancelled"
  | "suspended"
  | "rejected"
  | "requested"
  | "review"
  | "upcoming"
  | "ongoing"
  | "past"
  | "active"
  | "inactive";

export type ActivitiesData = {
  period: Period;
  stats: { total: number; ongoing: number; suspended: number };
  trends: { total: number | null; ongoing: number | null; suspended: null };
  activities: {
    data: {
      activityId: string;
      type: ActivityKind;
      name: string;
      organisationId: string;
      organisationName: string;
      startsAt: string | null;
      ticketsSold: number | null;
      status: ActivityStatus;
      pendingEdit: boolean;
      selfSuspended: boolean;
      createdAt: string;
    }[];
    meta: { total: number; perPage: number; currentPage: number; lastPage: number };
  };
};

export const ACTIVITY_HREF: Record<ActivityKind, (id: string) => string> = {
  event: (id) => `/activities/${id}`,
  raffle: (id) => `/activities/raffle/${id}`,
  sale: (id) => `/activities/sale/${id}`,
  restaurant: (id) => `/activities/restaurant/${id}`,
};

export const STATUS_BADGE: Record<ActivityStatus | "pending_edit", string> = {
  ongoing: "bg-success/10 text-success",
  active: "bg-success/10 text-success",
  upcoming: "bg-warning/15 text-[#C98A00]",
  requested: "bg-warning/15 text-[#C98A00]",
  review: "bg-[#EAF2FF] text-[#2F6FEB]",
  pending_edit: "bg-[#EAF2FF] text-[#2F6FEB]",
  past: "bg-neutral-100 text-deep-100",
  inactive: "bg-neutral-100 text-neutral-700",
  rejected: "bg-failure/10 text-failure",
  suspended: "bg-failure/10 text-failure",
  cancelled: "bg-failure/10 text-failure",
  deleted: "bg-failure/10 text-failure",
};

const STATUS_FILTER = [
  "requested",
  "review",
  "pending_edit",
  "upcoming",
  "ongoing",
  "past",
  "active",
  "inactive",
  "rejected",
  "suspended",
  "cancelled",
  "deleted",
] as const;

const TYPES: ActivityKind[] = ["event", "raffle", "sale", "restaurant"];

/**
 * Figma "Admin" → Events (4264:77180 empty / 4264:82176 data), worded
 * "Activities" and covering all four activity types (user decision): the
 * overview tiles under a period pill, then the list with type, status,
 * created and search filters, a row ⋯ menu and numbered pages. Every filter
 * lives in the URL. See the API's services/admin_activities.ts for what the
 * tiles and the combined status mean.
 */
export default function ActivitiesPageContent({
  data,
  filters,
}: {
  data: ActivitiesData | null;
  filters: { type: string | null; status: string | null; created: string | null; search: string };
}) {
  const t = useTranslations("ActivitiesList");
  const tPeriods = useTranslations("Analytics.filters.periods");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(filters.search);
  const [dialog, setDialog] = useState<{
    kind: ActivityKind;
    activityId: string;
    suspended: boolean;
  } | null>(null);

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
  const rows = data?.activities.data ?? [];
  const meta = data?.activities.meta;
  const filtering = Boolean(filters.type || filters.status || filters.created || filters.search);

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
    ? [
        { key: "total", value: data.stats.total, trend: data.trends.total },
        { key: "ongoing", value: data.stats.ongoing, trend: data.trends.ongoing },
        { key: "suspended", value: data.stats.suspended, trend: null },
      ]
    : [];

  const head = "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase text-left";
  const cell = "py-6 pr-4 text-[1.5rem] leading-8 text-deep-100";
  const badge = "py-[0.3rem] px-3 rounded-[30px] text-[1.1rem] font-bold uppercase whitespace-nowrap";

  return (
    <AdminLayout>
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

        {/* The list */}
        <Reveal delay={0.05} className="flex flex-col gap-6 pt-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
              {t("list.title")}
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              <FilterPill
                label={t("filters.type_label")}
                value={filters.type ?? "all"}
                defaultValue="all"
                placeholder={t("filters.type")}
                options={[
                  { value: "all", label: t("filters.type") },
                  ...TYPES.map((type) => ({ value: type, label: t(`filters.types.${type}`) })),
                ]}
                onChange={(v) => update({ type: v === "all" ? null : v })}
                pending={pending}
              />
              <FilterPill
                label={t("filters.status_label")}
                value={filters.status ?? "all"}
                defaultValue="all"
                placeholder={t("filters.status")}
                options={[
                  { value: "all", label: t("filters.status") },
                  ...STATUS_FILTER.map((s) => ({ value: s, label: t(`status_options.${s}`) })),
                ]}
                onChange={(v) => update({ status: v === "all" ? null : v })}
                pending={pending}
              />
              <FilterPill
                label={t("filters.time_label")}
                value={filters.created ?? "all"}
                defaultValue="all"
                placeholder={t("filters.time")}
                options={PERIODS.map((p) => ({ value: p, label: tPeriods(p) }))}
                onChange={(v) => update({ created: v === "all" ? null : v })}
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
            <table className="w-full min-w-[88rem] border-collapse">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className={head}>{t("list.table.name")}</th>
                  <th className={head}>{t("list.table.organisation")}</th>
                  <th className={head}>{t("list.table.start")}</th>
                  <th className={head}>{t("list.table.sold")}</th>
                  <th className={head}>{t("list.table.status")}</th>
                  <th className={head}>{t("list.table.created")}</th>
                  <th className={head}>
                    <span className="sr-only">{t("list.table.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const href = ACTIVITY_HREF[row.type](row.activityId);
                  return (
                    <tr
                      key={row.activityId}
                      onClick={() => router.push(href)}
                      className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors"
                    >
                      <td className={cell}>
                        <span className="flex items-center gap-3 max-w-[24rem]">
                          <span className="truncate" title={row.name}>
                            {row.name}
                          </span>
                          {row.type !== "event" && (
                            <span className="shrink-0 bg-primary-50 text-primary-500 text-[1rem] font-bold uppercase rounded-[30px] px-2 py-[0.2rem]">
                              {t(`list.type_badge.${row.type}`)}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className={cell}>
                        <span className="block max-w-[20rem] truncate" title={row.organisationName}>
                          {row.organisationName}
                        </span>
                      </td>
                      <td className={cn(cell, "whitespace-nowrap")}>
                        {row.startsAt ? formatDateTime(row.startsAt, locale) : "—"}
                      </td>
                      <td className={cell}>
                        {row.ticketsSold === null ? "—" : row.ticketsSold.toLocaleString(locale)}
                      </td>
                      <td className="py-6 pr-4">
                        <span className="inline-flex items-center gap-2">
                          <span className={cn(badge, STATUS_BADGE[row.status])}>
                            {t(`status.${row.status}`)}
                          </span>
                          {row.pendingEdit && (
                            <span className={cn(badge, STATUS_BADGE.pending_edit)}>
                              {t("status.pending_edit")}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className={cn(cell, "whitespace-nowrap")}>
                        {formatDateTime(row.createdAt, locale)}
                      </td>
                      <td className="py-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowMenu
                          suspended={row.selfSuspended}
                          // Suspended only through its organisation: lifted from there.
                          canEdit={can("activity.edit") && (row.selfSuspended || row.status !== "suspended")}
                          onView={() => router.push(href)}
                          onOrganisation={() => router.push(`/organisations/${row.organisationId}`)}
                          onToggle={() =>
                            setDialog({
                              kind: row.type,
                              activityId: row.activityId,
                              suspended: row.selfSuspended,
                            })
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
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
                    <Calendar size="44" variant="Bulk" color="#454A53" />
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
      </div>

      {/* Rendered here, not inside the row's popover (see lib/dialogControl.ts). */}
      {dialog && (
        <SuspendActivityDialog
          kind={dialog.kind}
          activityId={dialog.activityId}
          suspended={dialog.suspended}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </AdminLayout>
  );
}

function RowMenu({
  suspended,
  canEdit,
  onView,
  onOrganisation,
  onToggle,
}: {
  suspended: boolean;
  canEdit: boolean;
  onView: () => void;
  onOrganisation: () => void;
  onToggle: () => void;
}) {
  const t = useTranslations("ActivitiesList.list.menu");
  const [open, setOpen] = useState(false);
  const item =
    "w-full text-left px-[1rem] py-[.8rem] rounded-[.75rem] text-[1.4rem] leading-8 cursor-pointer hover:bg-neutral-100";
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="More"
        className="relative w-[2rem] h-[2rem] shrink-0 rounded-full bg-neutral-100 inline-flex items-center justify-center after:absolute after:-inset-[0.8rem] after:content-[''] cursor-pointer hover:bg-neutral-200"
      >
        <MoreCircle size="10" variant="Bulk" color="#737C8A" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[22rem] p-[.6rem] bg-white border border-neutral-100 rounded-[1rem] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)]"
      >
        <button type="button" className={cn(item, "text-deep-100")} onClick={run(onView)}>
          {t("view")}
        </button>
        <button type="button" className={cn(item, "text-deep-100")} onClick={run(onOrganisation)}>
          {t("organisation")}
        </button>
        {canEdit && (
          <button
            type="button"
            className={cn(item, suspended ? "text-success" : "text-failure")}
            onClick={run(onToggle)}
          >
            {suspended ? t("reactivate") : t("suspend")}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
