"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MoreCircle } from "iconsax-reactjs";
import { formatMoney } from "@ticketwaze/currency";
import { Event, Ticket } from "@ticketwaze/typescript-config";
import { TabsContent } from "@/components/ui/tabs";
import { Drawer } from "@/components/ui/drawer";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import { cn } from "@/lib/utils";
import { PERIODS, type Period } from "../../../analytics/periods";
import { analyticsStart } from "../../../attendees/[user]/periodStart";
import Informations from "./Informations";
import { CHECK_BADGE, ticketClassColor } from "@/components/shared/ticketBadges";

const PAGE_SIZE = 10;

/**
 * Figma "Attendance" (4326:87390): status, purchase-time and search pills,
 * Buyer · Class · Amount paid · Check-in status · Purchase date, a row ⋯ and
 * 10 rows a page. Row or ⋯ opens Ticket Details (4329:88173). Everything is
 * filtered here: the page already holds the event's sold tickets.
 */
export function ActivityAttendances({ event }: { event: Event }) {
  const t = useTranslations("Activities.activity.resume.attendance");
  const tPeriods = useTranslations("Analytics.filters.periods");
  const locale = useLocale();
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState<Period | "all">("all");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const rows = useMemo(() => {
    const since = period === "all" ? null : analyticsStart(period);
    const query = term.trim().toLowerCase();
    return (event.tickets ?? [])
      .filter((ticket) => status === "all" || ticket.status === status)
      .filter((ticket) => !since || new Date(ticket.createdAt as unknown as string) >= since)
      .filter(
        (ticket) =>
          !query ||
          [ticket.fullName, ticket.email, ticket.ticketId, ticket.ticketName].some((field) =>
            field?.toLowerCase().includes(query),
          ),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt as unknown as string).getTime() -
          new Date(a.createdAt as unknown as string).getTime(),
      );
  }, [event.tickets, status, period, term]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const head = "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase text-left";
  const cell = "py-6 pr-4 text-[1.5rem] leading-8 text-deep-100";
  const purchaseDate = (iso: unknown) =>
    new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/Port-au-Prince",
    }).format(new Date(iso as string));

  return (
    <TabsContent value="attendance" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <FilterPill
          label={t("filters.status_label")}
          value={status}
          defaultValue="all"
          placeholder={t("filters.status")}
          options={[
            { value: "all", label: t("filters.status") },
            { value: "CHECKED", label: t("filters.checked") },
            { value: "PENDING", label: t("filters.pending") },
            { value: "RETURNED", label: t("filters.returned") },
          ]}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <FilterPill
          label={t("filters.period_label")}
          value={period}
          defaultValue="all"
          placeholder={t("filters.period")}
          options={PERIODS.map((p) => ({ value: p, label: tPeriods(p) }))}
          onChange={(v) => {
            setPeriod(v as Period);
            setPage(1);
          }}
        />
        <SearchField
          value={term}
          onChange={(v) => {
            setTerm(v);
            setPage(1);
          }}
          placeholder={t("filters.search")}
          className="flex w-full lg:w-[26rem]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] border-collapse">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className={head}>{t("table.name")}</th>
              <th className={head}>{t("table.class")}</th>
              <th className={head}>{t("table.amount")}</th>
              <th className={head}>{t("table.status")}</th>
              <th className={head}>{t("table.purchase")}</th>
              <th className={head}>
                <span className="sr-only">{t("menu.details")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((ticket) => (
              <tr
                key={ticket.ticketId}
                onClick={() => setSelected(ticket)}
                className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors"
              >
                <td className={cell}>
                  <span className="block max-w-[16rem] truncate" title={ticket.fullName}>
                    {ticket.fullName}
                  </span>
                </td>
                <td className="py-6 pr-4">
                  <span
                    style={{ color: ticketClassColor(ticket.ticketType) }}
                    className="inline-block max-w-[12rem] truncate py-[0.3rem] px-2 rounded-[30px] bg-neutral-100 text-[1.1rem] font-bold leading-6 uppercase"
                  >
                    {ticket.ticketType}
                  </span>
                </td>
                <td className={cn(cell, "whitespace-nowrap")}>
                  {formatMoney(
                    event.currency === "USD" ? ticket.ticketUsdPrice : ticket.ticketPrice,
                    event.currency,
                    locale,
                  )}
                </td>
                <td className="py-6 pr-4">
                  <span
                    className={cn(
                      "py-[0.3rem] px-2 rounded-[30px] text-[1.1rem] font-bold leading-6 uppercase whitespace-nowrap",
                      CHECK_BADGE[ticket.status],
                    )}
                  >
                    {t(`status.${ticket.status}`)}
                  </span>
                </td>
                <td className={cn(cell, "whitespace-nowrap")}>{purchaseDate(ticket.createdAt)}</td>
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

      {rows.length === 0 && (
        <p className="text-center text-[1.4rem] text-neutral-500 py-12">{t("empty")}</p>
      )}
      {pages > 1 && (
        <TablePagination
          page={current}
          count={pages}
          onChange={setPage}
          prevLabel={t("prev")}
          nextLabel={t("next")}
        />
      )}

      <Drawer direction="right" open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && <Informations ticket={selected} event={event} />}
      </Drawer>
    </TabsContent>
  );
}
