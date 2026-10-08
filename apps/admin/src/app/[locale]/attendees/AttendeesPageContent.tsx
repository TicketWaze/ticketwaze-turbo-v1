"use client";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ProfileCircle, MoreCircle } from "iconsax-reactjs";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import { Reveal } from "@/components/shared/motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePathname, useRouter } from "@/i18n/navigation";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";
import { Metric, TrendBadge } from "../analytics/parts";
import { PERIODS, readPeriod, type Period } from "../analytics/periods";
import { SuspendDialog } from "./[user]/SuspendDialog";
import { ReactivateDialog } from "./[user]/ReactivateDialog";

type Status = "active" | "inactive" | "suspended";

export type AttendeesData = {
  period: Period;
  stats: { total: number; active: number; repeat: number };
  trends: { total: number | null; active: number | null; repeat: number | null };
  users: {
    data: {
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      eventCount: number;
      status: Status;
      createdAt: string;
    }[];
    meta: { total: number; perPage: number; currentPage: number; lastPage: number };
  };
};

const STATUS_BADGE: Record<Status, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-warning/15 text-[#C98A00]",
  suspended: "bg-failure/10 text-failure",
};

/**
 * Figma "Admin" → Attendee (4116:66233 empty / 4129:96983 data): the
 * overview tiles under a period pill, then the list with status, date-joined
 * and search filters, a row ⋯ menu and numbered pages. Every filter lives in
 * the URL. See the API's services/admin_attendees.ts for what the tiles and
 * statuses mean.
 */
export default function AttendeesPageContent({
  data,
  filters,
}: {
  data: AttendeesData | null;
  filters: { status: string | null; joined: string | null; search: string };
}) {
  const t = useTranslations("Attendees");
  const tPeriods = useTranslations("Analytics.filters.periods");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(filters.search);
  const [dialog, setDialog] = useState<{ kind: "suspend" | "reactivate"; userId: string } | null>(
    null,
  );

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
  const rows = data?.users.data ?? [];
  const meta = data?.users.meta;
  const filtering = Boolean(filters.status || filters.joined || filters.search);

  const trend = (value: number | null) => (
    <TrendBadge
      value={value}
      label={value === null ? "" : t(value < 0 ? "trend.down" : "trend.up", { value: Math.abs(value) })}
    />
  );

  const tiles = data
    ? [
        { label: t("total"), value: data.stats.total, trend: data.trends.total },
        { label: t("active"), value: data.stats.active, trend: data.trends.active },
        { label: t("repeat"), value: data.stats.repeat, trend: data.trends.repeat },
      ]
    : [];

  const head = "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase text-left";

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
              key={tile.label}
              className={cn(
                "py-6 pr-6 lg:pr-10 border-neutral-100",
                i === 1 && "pl-6 lg:pl-10 border-l",
                i === 2 && "col-span-2 lg:col-span-1 border-t lg:border-t-0 lg:pl-10 lg:border-l",
              )}
            >
              <Metric label={tile.label} trend={trend(tile.trend)}>
                {tile.value.toLocaleString(locale)}
              </Metric>
            </div>
          ))}
        </Reveal>

        {/* The list */}
        <Reveal delay={0.05} className="flex flex-col gap-6 pt-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
              {t("attendees_list.title")}
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              <FilterPill
                label={t("filters.status_label")}
                value={filters.status ?? "all"}
                defaultValue="all"
                placeholder={t("filters.status")}
                options={[
                  { value: "all", label: t("filters.status") },
                  { value: "active", label: t("filters.status_active") },
                  { value: "inactive", label: t("filters.status_inactive") },
                  { value: "suspended", label: t("filters.status_suspended") },
                ]}
                onChange={(v) => update({ status: v === "all" ? null : v })}
                pending={pending}
              />
              <FilterPill
                label={t("filters.time_label")}
                value={filters.joined ?? "all"}
                defaultValue="all"
                placeholder={t("filters.time")}
                options={PERIODS.map((p) => ({ value: p, label: tPeriods(p) }))}
                onChange={(v) => update({ joined: v === "all" ? null : v })}
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
            <table className="w-full min-w-[72rem] border-collapse">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className={head}>{t("attendees_list.table.name")}</th>
                  <th className={head}>{t("attendees_list.table.email")}</th>
                  <th className={head}>{t("attendees_list.table.phone")}</th>
                  <th className={head}>{t("attendees_list.table.event_count")}</th>
                  <th className={head} title={t("attendees_list.status_hint")}>
                    {t("attendees_list.table.status")}
                  </th>
                  <th className={head}>{t("attendees_list.table.joined")}</th>
                  <th className={head}>
                    <span className="sr-only">{t("attendees_list.table.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.userId}
                    onClick={() => router.push(`/attendees/${row.userId}`)}
                    className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <td className="py-6 pr-4 text-[1.5rem] leading-8 text-deep-100">
                      <span className="block max-w-[20rem] truncate">
                        {row.firstName} {row.lastName}
                      </span>
                    </td>
                    <td className="py-6 pr-4 text-[1.5rem] leading-8 text-deep-100">
                      <span className="block max-w-[24rem] truncate" title={row.email}>
                        {row.email}
                      </span>
                    </td>
                    <td className="py-6 pr-4 text-[1.5rem] leading-8 text-deep-100 whitespace-nowrap">
                      {row.phone || "—"}
                    </td>
                    <td className="py-6 pr-4 text-[1.5rem] leading-8 text-deep-100">
                      {row.eventCount}
                    </td>
                    <td className="py-6 pr-4">
                      <span
                        className={cn(
                          "py-[0.3rem] px-3 rounded-[30px] text-[1.1rem] font-bold uppercase",
                          STATUS_BADGE[row.status],
                        )}
                      >
                        {t(`attendees_list.status.${row.status}`)}
                      </span>
                    </td>
                    <td className="py-6 pr-4 text-[1.5rem] leading-8 text-deep-100 whitespace-nowrap">
                      {formatDate(row.createdAt, locale, "local")}
                    </td>
                    <td className="py-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <RowMenu
                        suspended={row.status === "suspended"}
                        onView={() => router.push(`/attendees/${row.userId}`)}
                        onSuspend={() => setDialog({ kind: "suspend", userId: row.userId })}
                        onReactivate={() => setDialog({ kind: "reactivate", userId: row.userId })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 &&
            (filtering ? (
              <p className="text-[1.6rem] text-neutral-600 leading-10 text-center py-16">
                {t("attendees_list.no_results")}
              </p>
            ) : (
              <div className="flex flex-col items-center gap-10 py-16">
                <div className="rounded-full bg-neutral-100 p-6">
                  <div className="rounded-full bg-neutral-200 p-8">
                    <ProfileCircle size="44" variant="Bulk" color="#454A53" />
                  </div>
                </div>
                <p className="max-w-[44rem] text-[1.6rem] text-neutral-600 leading-9 text-center">
                  {t("attendees_list.no_history")}
                </p>
              </div>
            ))}

          {meta && meta.lastPage > 1 && (
            <TablePagination
              page={meta.currentPage}
              count={meta.lastPage}
              onChange={(page) => update({ page: page > 1 ? String(page) : null })}
              prevLabel={t("attendees_list.prev")}
              nextLabel={t("attendees_list.next")}
            />
          )}
        </Reveal>
      </div>

      {/* Rendered here, not inside the row's popover (see lib/dialogControl.ts). */}
      {dialog && (
        <>
          <SuspendDialog
            userId={dialog.userId}
            open={dialog.kind === "suspend"}
            onOpenChange={(open) => !open && setDialog(null)}
            hideTrigger
          />
          <ReactivateDialog
            userId={dialog.userId}
            open={dialog.kind === "reactivate"}
            onOpenChange={(open) => !open && setDialog(null)}
            hideTrigger
          />
        </>
      )}
    </AdminLayout>
  );
}

function RowMenu({
  suspended,
  onView,
  onSuspend,
  onReactivate,
}: {
  suspended: boolean;
  onView: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  const t = useTranslations("Attendees.attendees_list.menu");
  const [open, setOpen] = useState(false);
  const item =
    "w-full text-left px-[1rem] py-[.8rem] rounded-[.75rem] text-[1.4rem] leading-8 cursor-pointer hover:bg-neutral-100";
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
        className="w-[20rem] p-[.6rem] bg-white border border-neutral-100 rounded-[1rem] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)]"
      >
        <button type="button" className={cn(item, "text-deep-100")} onClick={() => { setOpen(false); onView(); }}>
          {t("view")}
        </button>
        {suspended ? (
          <button type="button" className={cn(item, "text-success")} onClick={() => { setOpen(false); onReactivate(); }}>
            {t("reactivate")}
          </button>
        ) : (
          <button type="button" className={cn(item, "text-failure")} onClick={() => { setOpen(false); onSuspend(); }}>
            {t("suspend")}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
