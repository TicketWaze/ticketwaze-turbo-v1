"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  HamburgerMenu,
  MoreCircle,
  Setting4,
  Ticket as TicketIcon,
  TickCircle,
} from "iconsax-reactjs";
import { toast } from "sonner";
import { Event, Order, Ticket } from "@ticketwaze/typescript-config";
import { Drawer } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import { ButtonPill } from "@/components/shared/buttons";
import { tabSpring } from "@/components/shared/motion";
import { usePathname, useRouter } from "@/i18n/navigation";
import { CheckInTicketAction } from "@/actions/EventActions";
import { DateTime } from "luxon";
import Capitalize from "@/lib/Capitalize";
import TablePagination from "@/components/shared/TablePagination";
import FilterSheet, { RadioGroup } from "@/components/shared/FilterSheet";
import { cn } from "@/lib/utils";
import TransactionDetails, { StatusBadge } from "./TransactionDetails";

const PAGE_SIZE = 10;
type Status = "all" | "CHECKED" | "PENDING" | "RETURNED";

/** One text colour per ticket class, in the classes' order (Figma's pink, purple, black…). */
const CLASS_COLOURS = [
  "#EF1870",
  "#7A19C7",
  "#0D0D0D",
  "#1C7EEA",
  "#349C2E",
  "#EA961C",
];

const headClass =
  "font-sans font-bold text-[1.1rem] leading-6 text-deep-100 uppercase text-left pb-6 pr-4 whitespace-nowrap";
const cellClass =
  "font-sans text-[1.5rem] leading-8 text-neutral-900 py-6 pr-4";

/**
 * The tickets of an activity (Figma 1712:34749, mobile 2217:51788): class tabs,
 * a status filter and search; a ⋯ per row (Details, Mark as checked in); ten
 * rows a page. On a phone the filters move to a bottom sheet (2223:64001) and
 * the table keeps the ID and buyer columns.
 */
export default function TicketsTable({
  event,
  tickets,
  orders,
  canCheckIn,
  showCheckTime = false,
  onPromote,
}: {
  event: Event;
  tickets: Ticket[];
  orders: Order[];
  /** Whether a pending ticket can be checked in from here right now. */
  canCheckIn: boolean;
  /** Last column shows the first check-in instead of the purchase date (event started). */
  showCheckTime?: boolean;
  /** Opens the share modal from the empty state; omitted when sharing is off. */
  onPromote?: () => void;
}) {
  const t = useTranslations("Events.single_event");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const classes = useMemo(
    () =>
      [...event.eventTicketTypes].sort((a, b) =>
        a.ticketTypeName.localeCompare(b.ticketTypeName),
      ),
    [event.eventTicketTypes],
  );
  const colourOf = (name: string) => {
    const i = classes.findIndex(
      (c) => c.ticketTypeName.toLowerCase() === name.toLowerCase(),
    );
    return CLASS_COLOURS[Math.max(0, i) % CLASS_COLOURS.length];
  };

  const [ticketClass, setTicketClass] = useState("all");
  const [status, setStatus] = useState<Status>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  /** Checked in from this page (id → when), shown at once while the server refreshes. */
  const [checkedNow, setCheckedNow] = useState<Map<string, string>>(new Map());

  /** Resend cooldowns (id → ms) learned this visit, kept across drawer opens. */
  const [resendUntil, setResendUntil] = useState<Map<string, number>>(
    new Map(),
  );

  const statusOf = (ticket: Ticket) =>
    checkedNow.has(ticket.ticketId) ? "CHECKED" : ticket.status;
  /** The first entry (sessions come oldest first), or this page's own check-in. */
  const checkTimeOf = (ticket: Ticket): string | null =>
    ticket.checkIns?.[0]?.checkedInAt
      ? String(ticket.checkIns[0].checkedInAt)
      : (checkedNow.get(ticket.ticketId) ?? null);
  const formatAt = (iso: string) =>
    DateTime.fromISO(iso)
      .setZone(event.eventDays[0]?.timezone ?? "local")
      .setLocale(locale)
      .toLocaleString(DateTime.DATETIME_MED);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets
      .filter(
        (tk) =>
          ticketClass === "all" ||
          tk.ticketType.toLowerCase() === ticketClass.toLowerCase(),
      )
      .filter(
        (tk) =>
          status === "all" ||
          (checkedNow.has(tk.ticketId) ? "CHECKED" : tk.status) === status,
      )
      .filter(
        (tk) =>
          !q ||
          tk.ticketName.toLowerCase().includes(q) ||
          tk.fullName.toLowerCase().includes(q) ||
          (tk.email ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [tickets, ticketClass, status, query, checkedNow]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtersOn = ticketClass !== "all" || status !== "all" || query !== "";

  function reset<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  async function markChecked(ticket: Ticket) {
    setCheckingIn(ticket.ticketId);
    const result = await CheckInTicketAction(
      event.eventId,
      pathname,
      ticket.ticketId,
      locale,
    );
    setCheckingIn(null);
    if (result.status === "failed") {
      toast.error(result.message);
      return;
    }
    setCheckedNow((s) =>
      new Map(s).set(ticket.ticketId, DateTime.now().toISO()),
    );
    toast.success(t("checked_in_done", { name: ticket.fullName }));
    router.refresh();
  }

  const statusOptions = [
    { value: "all", label: t("filters.all") },
    { value: "CHECKED", label: t("filters.checked") },
    { value: "PENDING", label: t("filters.pending") },
    { value: "RETURNED", label: t("filters.returned") },
  ];
  const classOptions = [
    { value: "all", label: t("all") },
    ...classes.map((c) => ({
      value: c.ticketTypeName,
      label: Capitalize(c.ticketTypeName),
    })),
  ];

  /* ── Nothing sold yet ── */
  if (tickets.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center gap-10 py-16 text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
      >
        <EmptyHead showCheckTime={showCheckTime} />
        <motion.div
          className="w-[12rem] h-[12rem] rounded-full flex items-center justify-center bg-neutral-100"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 18,
            delay: 0.35,
          }}
        >
          <div className="w-[9rem] h-[9rem] rounded-full flex items-center justify-center bg-neutral-200">
            <TicketIcon size="44" color="#0d0d0d" variant="Bulk" aria-hidden />
          </div>
        </motion.div>
        <p className="font-sans text-[1.6rem] lg:text-[1.8rem] leading-[2.5rem] text-neutral-600 max-w-[42rem]">
          {t("table.description")}
        </p>
        {onPromote && (
          <ButtonPill
            tone="primary"
            onClick={onPromote}
            className="px-10 py-[1.1rem] text-[1.5rem]"
          >
            {t("promote")}
          </ButtonPill>
        )}
      </motion.div>
    );
  }

  return (
    <motion.section
      className="flex flex-col gap-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {classes.length > 1 && (
          <div className="hidden lg:flex items-center bg-neutral-100 rounded-[3rem] p-[.75rem] w-fit max-w-full overflow-x-auto">
            {classOptions.map((o) => {
              const active = ticketClass === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => reset(setTicketClass)(o.value)}
                  className={cn(
                    "relative px-6 py-2 rounded-[3rem] font-sans text-[1.4rem] leading-8 whitespace-nowrap cursor-pointer transition-colors duration-200",
                    active
                      ? "text-white"
                      : "text-neutral-700 hover:text-deep-100",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="tickets-class-tab"
                      className="absolute inset-0 rounded-[3rem] bg-black"
                      transition={tabSpring}
                    />
                  )}
                  <span className="relative">{o.label}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="hidden lg:flex items-center gap-4 ml-auto">
          <FilterPill
            label={t("filters.all")}
            value={status}
            defaultValue="all"
            placeholder={t("filters.all")}
            options={statusOptions}
            onChange={(v) => reset(setStatus)(v as Status)}
          />
          <SearchField
            value={query}
            onChange={reset(setQuery)}
            placeholder={t("search_ticket")}
            className="flex w-[24.3rem]"
          />
        </div>
        {/* Phone: search, and a button opening the filters sheet */}
        <div className="flex lg:hidden items-center gap-4 w-full">
          <SearchField
            value={query}
            onChange={reset(setQuery)}
            placeholder={t("search_ticket")}
            className="flex flex-1 min-w-0"
          />
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label={t("filters_title")}
            className={cn(
              "relative w-[3.5rem] h-[3.5rem] shrink-0 rounded-full flex items-center justify-center cursor-pointer",
              ticketClass !== "all" || status !== "all"
                ? "bg-primary-50"
                : "bg-neutral-100",
            )}
          >
            <Setting4
              size="20"
              variant="Bulk"
              color={
                ticketClass !== "all" || status !== "all"
                  ? "#E45B00"
                  : "#737C8A"
              }
              aria-hidden
            />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className={headClass}>{t("table.id")}</th>
              <th className={headClass}>{t("table.name")}</th>
              <th className={cn(headClass, "hidden lg:table-cell")}>
                {t("table.ticket_class")}
              </th>
              <th className={cn(headClass, "hidden lg:table-cell")}>
                {t("table.amount")}
              </th>
              <th className={cn(headClass, "hidden lg:table-cell")}>
                {t("table.check")}
              </th>
              <th className={cn(headClass, "hidden lg:table-cell w-[22rem]")}>
                {showCheckTime
                  ? t("table.check_time")
                  : t("table.date_purchased")}
              </th>
              <th className="hidden lg:table-cell w-[4rem]" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {rows.map((ticket, i) => {
              const s = statusOf(ticket);
              return (
                <motion.tr
                  key={`${current}-${ticket.ticketId}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(i * 0.025, 0.2),
                  }}
                  onClick={() => setDetail(ticket)}
                  className="border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50"
                >
                  <td className={cn(cellClass, "truncate")}>
                    {ticket.ticketName}
                  </td>
                  <td className={cn(cellClass, "truncate")}>
                    {ticket.fullName}
                  </td>
                  <td className={cn(cellClass, "hidden lg:table-cell")}>
                    <span
                      className="inline-block px-2 py-[.3rem] rounded-[3rem] bg-[#f5f5f5] font-bold text-[1.1rem] leading-6 uppercase"
                      style={{ color: colourOf(ticket.ticketType) }}
                    >
                      {ticket.ticketType}
                    </span>
                  </td>
                  <td
                    className={cn(
                      cellClass,
                      "hidden lg:table-cell font-medium whitespace-nowrap",
                    )}
                  >
                    {(event.currency === "USD"
                      ? ticket.ticketUsdPrice
                      : ticket.ticketPrice
                    ).toLocaleString(locale)}{" "}
                    {event.currency}
                  </td>
                  <td className={cn(cellClass, "hidden lg:table-cell")}>
                    <StatusBadge status={s} />
                    <TimeInsideBadge ticket={ticket} />
                  </td>
                  <td
                    className={cn(
                      cellClass,
                      "hidden lg:table-cell whitespace-nowrap",
                    )}
                  >
                    {showCheckTime
                      ? (() => {
                          const at = checkTimeOf(ticket);
                          return at ? (
                            formatAt(at)
                          ) : (
                            <span className="text-neutral-400">—</span>
                          );
                        })()
                      : formatAt(String(ticket.createdAt))}
                  </td>
                  <td
                    className="hidden lg:table-cell py-6 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RowMenu
                      onDetails={() => setDetail(ticket)}
                      onCheckIn={
                        canCheckIn && s === "PENDING"
                          ? () => markChecked(ticket)
                          : undefined
                      }
                      busy={checkingIn === ticket.ticketId}
                    />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="font-sans text-[1.6rem] leading-[2.25rem] text-neutral-600">
              {t("table.no_match")}
            </p>
            {filtersOn && (
              <button
                type="button"
                onClick={() => {
                  setTicketClass("all");
                  setStatus("all");
                  setQuery("");
                  setPage(1);
                }}
                className="font-sans text-[1.4rem] text-primary-500 cursor-pointer"
              >
                {t("table.clear_filters")}
              </button>
            )}
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <TablePagination
          page={current}
          count={pageCount}
          onChange={setPage}
          prevLabel={t("page_prev")}
          nextLabel={t("page_next")}
        />
      )}

      {/* Phone filters (Figma 2223:64001) */}
      <FilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={t("filters_title")}
        closeLabel={t("close")}
      >
        {classes.length > 1 && (
          <RadioGroup
            title={t("ticket_class_label")}
            options={classOptions}
            value={ticketClass}
            onChange={reset(setTicketClass)}
          />
        )}
        <RadioGroup
          title={t("filters.all")}
          options={statusOptions}
          value={status}
          onChange={(v) => reset(setStatus)(v as Status)}
        />
      </FilterSheet>

      {/* The ticket's details, from a row or its ⋯ */}
      <Drawer
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
        direction="right"
      >
        {detail && (
          <TransactionDetails
            event={event}
            ticket={detail}
            order={orders.find((o) => o.orderId === detail.orderId)}
            status={statusOf(detail)}
            checkTime={checkTimeOf(detail)}
            classColour={colourOf(detail.ticketType)}
            cooldownUntil={resendUntil.get(detail.ticketId)}
            onCooldown={(until) =>
              setResendUntil((m) => new Map(m).set(detail.ticketId, until))
            }
            onClose={() => setDetail(null)}
          />
        )}
      </Drawer>
    </motion.section>
  );
}

/** The column headings over the empty state, as in Figma 1651:57073. */
function EmptyHead({ showCheckTime }: { showCheckTime: boolean }) {
  const t = useTranslations("Events.single_event");
  const headings = [
    t("table.id"),
    t("table.name"),
    t("table.ticket_class"),
    t("table.amount"),
    t("table.check"),
    showCheckTime ? t("table.check_time") : t("table.date_purchased"),
  ];
  return (
    <div className="hidden lg:grid w-full grid-cols-6 border-b border-neutral-100 text-left">
      {headings.map((h) => (
        <span key={h} className={headClass}>
          {h}
        </span>
      ))}
    </div>
  );
}

function RowMenu({
  onDetails,
  onCheckIn,
  busy,
}: {
  onDetails: () => void;
  onCheckIn?: () => void;
  busy: boolean;
}) {
  const t = useTranslations("Events.single_event");
  const [open, setOpen] = useState(false);
  const item =
    "w-full flex items-center justify-between gap-6 py-4 font-sans text-[1.5rem] leading-8 cursor-pointer transition-colors";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t("more")}
        disabled={busy}
        className="w-[2.4rem] h-[2.4rem] rounded-full bg-neutral-100 inline-flex items-center justify-center cursor-pointer hover:bg-neutral-200 disabled:opacity-50"
      >
        <MoreCircle size="16" variant="Bulk" color="#737C8A" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[23.5rem] p-[1rem] bg-neutral-100 border border-neutral-200 rounded-[1rem] shadow-[0px_10px_30px_rgba(0,0,0,0.12)]"
      >
        <p className="font-sans font-medium pb-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8">
          {t("more")}
        </p>
        <button
          type="button"
          className={cn(
            item,
            "text-neutral-700 hover:text-primary-500",
            onCheckIn && "border-b border-neutral-200",
          )}
          onClick={() => {
            setOpen(false);
            onDetails();
          }}
        >
          {t("details")}
          <HamburgerMenu size="20" variant="Bulk" color="#2E3237" aria-hidden />
        </button>
        {onCheckIn && (
          <button
            type="button"
            className={cn(item, "text-primary-500 hover:text-primary-600")}
            onClick={() => {
              setOpen(false);
              onCheckIn();
            }}
          >
            {t("mark_as_check")}
            <TickCircle size="20" variant="Bulk" color="#E45B00" aria-hidden />
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function formatDuration(totalMinutes: number) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return h > 0 ? `${h}h ${mins}m` : `${mins}m`;
}

// Compact attendance summary under the check-in status: total time inside,
// plus a live "inside" marker when the attendee has an open session.
function TimeInsideBadge({ ticket }: { ticket: Ticket }) {
  const t = useTranslations("Events.single_event");
  if (ticket.status !== "CHECKED" || !ticket.entriesCount) return null;
  return (
    <span className="block mt-2 text-[1.1rem] font-medium leading-6 text-neutral-500">
      {formatDuration(ticket.totalMinutesInside ?? 0)}
      {ticket.presence === "inside" && (
        <span className="ml-1 text-[#349C2E]">• {t("filters.inside")}</span>
      )}
    </span>
  );
}
