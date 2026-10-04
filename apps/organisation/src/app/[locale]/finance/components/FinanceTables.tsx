"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ArrowRight2, Money3, Setting4 } from "iconsax-reactjs";
import { Order, WithdrawalRequest } from "@ticketwaze/typescript-config";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import FilterSheet, { RadioGroup } from "@/components/shared/FilterSheet";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/financeFigures";
import { cn } from "@/lib/utils";
import {
  cellClass,
  classColour,
  headClass,
  ORDER_COLOURS,
  OrderState,
  orderPaid,
  orderState,
  StatusPill,
  WITHDRAWAL_COLOURS,
} from "./financeParts";
import OrderDetails from "./OrderDetails";
import WithdrawalDetails from "./WithdrawalDetails";

/* ── Shared table frame ─────────────────────────────────────────── */

function Toolbar({
  title,
  status,
  setStatus,
  statusOptions,
  query,
  setQuery,
  searchPlaceholder,
  onOpenSheet,
  titleAs = "h2",
}: {
  title: string;
  status: string;
  setStatus: (v: string) => void;
  statusOptions: { value: string; label: string }[];
  query: string;
  setQuery: (v: string) => void;
  searchPlaceholder: string;
  onOpenSheet: () => void;
  titleAs?: "h1" | "h2";
}) {
  const t = useTranslations("Finance");
  const Title = titleAs;
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <Title
        className={cn(
          "font-primary font-medium text-black",
          titleAs === "h1"
            ? "text-[2.2rem] lg:text-[2.6rem] leading-[1.2]"
            : "text-[1.8rem] leading-10",
        )}
      >
        {title}
      </Title>
      <div className="hidden lg:flex items-center gap-4">
        <FilterPill
          label={t("filters.all")}
          value={status}
          defaultValue="all"
          placeholder={t("filters.all")}
          options={statusOptions}
          onChange={setStatus}
        />
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={searchPlaceholder}
          className="flex w-[24.3rem]"
        />
      </div>
      <div className="flex lg:hidden items-center gap-4">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder={searchPlaceholder}
          className="flex flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={onOpenSheet}
          aria-label={t("filters_title")}
          className={cn(
            "w-[3.5rem] h-[3.5rem] shrink-0 rounded-full flex items-center justify-center cursor-pointer",
            status !== "all" ? "bg-primary-50" : "bg-neutral-100",
          )}
        >
          <Setting4
            size="20"
            variant="Bulk"
            color={status !== "all" ? "#E45B00" : "#737C8A"}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}

/** Figma's empty table: the column headings, the round icon and a line. */
function EmptyState({ headings, text }: { headings: string[]; text: string }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-8 pb-8 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div
        className="hidden lg:grid w-full border-b border-neutral-100 text-left"
        style={{
          gridTemplateColumns: `repeat(${headings.length}, minmax(0, 1fr))`,
        }}
      >
        {headings.map((h) => (
          <span key={h} className={headClass}>
            {h}
          </span>
        ))}
      </div>
      <motion.div
        className="w-[11rem] h-[11rem] rounded-full flex items-center justify-center bg-neutral-100"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
      >
        <div className="w-[8rem] h-[8rem] rounded-full flex items-center justify-center bg-neutral-200">
          <Money3 size="40" color="#0d0d0d" variant="Bulk" aria-hidden />
        </div>
      </motion.div>
      <p className="font-sans text-[1.6rem] leading-[2.4rem] text-neutral-600 max-w-[40rem]">
        {text}
      </p>
    </motion.div>
  );
}

function NoMatch({ text, onClear }: { text: string; onClear: () => void }) {
  const t = useTranslations("Finance");
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <p className="font-sans text-[1.5rem] text-neutral-600">{text}</p>
      <button
        type="button"
        onClick={onClear}
        className="font-sans text-[1.4rem] text-primary-500 cursor-pointer"
      >
        {t("transactions.clear_filters")}
      </button>
    </div>
  );
}

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <div className="w-full flex justify-end">
      <Link
        href={href}
        className="text-primary-500 flex gap-3 items-center text-[1.4rem] leading-8 group"
      >
        {label}
        <ArrowRight2
          size="16"
          color="#E45B00"
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}

function rowMotion(i: number) {
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, delay: Math.min(i * 0.025, 0.2) },
  };
}

/* ── Transactions ───────────────────────────────────────────────── */

/**
 * Recent Transactions (Figma 1749:34639) and the full list (1754:39485): one
 * row per order — ID, activity, its ticket classes, what the buyer paid and
 * the status — with the status filter and search. `limit` shows the overview's
 * first rows with "View all"; `pageSize` paginates the full page.
 */
export function TransactionsTable({
  orders,
  limit,
  pageSize,
  titleAs,
}: {
  orders: Order[];
  limit?: number;
  pageSize?: number;
  titleAs?: "h1" | "h2";
}) {
  const t = useTranslations("Finance");
  const locale = useLocale();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sheet, setSheet] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== "all" && orderState(order) !== status) return false;
      if (!q) return true;
      return [
        order.orderName,
        order.activity?.name,
        order.email,
        order.firstName,
        order.lastName,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [orders, status, query]);

  const pageCount = pageSize
    ? Math.max(1, Math.ceil(filtered.length / pageSize))
    : 1;
  const current = Math.min(page, pageCount);
  const rows = pageSize
    ? filtered.slice((current - 1) * pageSize, current * pageSize)
    : filtered.slice(0, limit ?? filtered.length);

  const options = [
    { value: "all", label: t("filters.all") },
    { value: "successful", label: t("filters.successful") },
    { value: "partly_returned", label: t("transactions.partly_returned") },
    { value: "returned", label: t("filters.returned") },
  ];
  const stateLabel: Record<OrderState, string> = {
    successful: t("filters.successful"),
    partly_returned: t("transactions.partly_returned"),
    returned: t("filters.returned"),
  };
  const headings = [
    t("transactions.table.id"),
    t("transactions.table.name"),
    t("transactions.table.class"),
    t("transactions.table.amount"),
    t("transactions.table.status"),
  ];
  const reset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  return (
    <section className="flex flex-col gap-8">
      <Toolbar
        title={t("transactions.title")}
        titleAs={titleAs}
        status={status}
        setStatus={reset(setStatus)}
        statusOptions={options}
        query={query}
        setQuery={reset(setQuery)}
        searchPlaceholder={t("search")}
        onOpenSheet={() => setSheet(true)}
      />

      {orders.length === 0 ? (
        <EmptyState headings={headings} text={t("transactions.description")} />
      ) : (
        <div>
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={headClass}>{headings[0]}</th>
                <th className={headClass}>{headings[1]}</th>
                <th className={cn(headClass, "hidden lg:table-cell")}>
                  {headings[2]}
                </th>
                <th className={cn(headClass, "hidden lg:table-cell")}>
                  {headings[3]}
                </th>
                <th className={cn(headClass, "hidden lg:table-cell w-[16rem]")}>
                  {headings[4]}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order, i) => {
                const state = orderState(order);
                const classes = [
                  ...new Set((order.tickets ?? []).map((tk) => tk.ticketType)),
                ];
                return (
                  <motion.tr
                    key={`${current}-${order.orderId}`}
                    {...rowMotion(i)}
                    onClick={() => setDetail(order)}
                    className="border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50"
                  >
                    <td className={cn(cellClass, "truncate")}>
                      {order.orderName}
                    </td>
                    <td className={cn(cellClass, "truncate")}>
                      {order.activity?.name}
                    </td>
                    <td className={cn(cellClass, "hidden lg:table-cell")}>
                      <span className="flex flex-wrap gap-1">
                        {classes.map((name) => (
                          <span
                            key={name}
                            className="inline-block px-2 py-[.3rem] rounded-[3rem] bg-[#f5f5f5] font-bold text-[1.1rem] leading-6 uppercase"
                            style={{ color: classColour(name) }}
                          >
                            {name}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td
                      className={cn(
                        cellClass,
                        "hidden lg:table-cell font-medium whitespace-nowrap",
                      )}
                    >
                      {formatMoney(orderPaid(order), locale)}{" "}
                      {order.activity?.currency}
                    </td>
                    <td className={cn(cellClass, "hidden lg:table-cell")}>
                      <StatusPill colour={ORDER_COLOURS[state]}>
                        {stateLabel[state]}
                      </StatusPill>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <NoMatch
              text={t("transactions.no_match")}
              onClear={() => {
                setStatus("all");
                setQuery("");
                setPage(1);
              }}
            />
          )}
        </div>
      )}

      {pageSize && pageCount > 1 && (
        <TablePagination
          page={current}
          count={pageCount}
          onChange={setPage}
          prevLabel={t("page_prev")}
          nextLabel={t("page_next")}
        />
      )}
      {limit && filtered.length > limit && (
        <ViewAll href="/finance/transactions" label={t("transactions.more")} />
      )}

      <FilterSheet
        open={sheet}
        onOpenChange={setSheet}
        title={t("filters_title")}
        closeLabel={t("close")}
      >
        <RadioGroup
          title={t("filters.all")}
          options={options}
          value={status}
          onChange={reset(setStatus)}
        />
      </FilterSheet>
      <OrderDetails order={detail} onClose={() => setDetail(null)} />
    </section>
  );
}

/* ── Withdrawals ────────────────────────────────────────────────── */

/**
 * Withdrawal history (Figma 1760:45206): ID, bank (or method), account,
 * amount and status, with the same filter + search, and the Withdrawal Details
 * panel (1760:49181) per row.
 */
export function WithdrawalsTable({
  requests,
  currency,
  limit,
  pageSize,
  titleAs,
}: {
  requests: WithdrawalRequest[];
  /** The organisation's display currency, which picks amount or usdAmount. */
  currency: string;
  limit?: number;
  pageSize?: number;
  titleAs?: "h1" | "h2";
}) {
  const t = useTranslations("Finance");
  const locale = useLocale();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sheet, setSheet] = useState(false);
  const [detail, setDetail] = useState<WithdrawalRequest | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return [r.withdrawalRequestId, r.bankName, r.accountNumber, r.accountName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [requests, status, query]);

  const pageCount = pageSize
    ? Math.max(1, Math.ceil(filtered.length / pageSize))
    : 1;
  const current = Math.min(page, pageCount);
  const rows = pageSize
    ? filtered.slice((current - 1) * pageSize, current * pageSize)
    : filtered.slice(0, limit ?? filtered.length);

  const statusLabel: Record<WithdrawalRequest["status"], string> = {
    PENDING: t("filters.pending"),
    APPROVED: t("withdrawal.approved"),
    SUCCESSFUL: t("filters.successful"),
    FAILED: t("filters.failed"),
  };
  const options = [
    { value: "all", label: t("filters.all") },
    ...(["PENDING", "APPROVED", "SUCCESSFUL", "FAILED"] as const).map((s) => ({
      value: s,
      label: statusLabel[s],
    })),
  ];
  const headings = [
    t("withdrawal.table.id"),
    t("withdrawal.table.name"),
    t("withdrawal.table.account"),
    t("withdrawal.table.amount"),
    t("withdrawal.table.status"),
  ];
  const reset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };
  const amountOf = (r: WithdrawalRequest) =>
    `${formatMoney(Number(currency === "USD" ? r.usdAmount : r.amount) || 0, locale)} ${currency}`;

  return (
    <section className="flex flex-col gap-8">
      <Toolbar
        title={t("withdrawal.title")}
        titleAs={titleAs}
        status={status}
        setStatus={reset(setStatus)}
        statusOptions={options}
        query={query}
        setQuery={reset(setQuery)}
        searchPlaceholder={t("search_withdrawal")}
        onOpenSheet={() => setSheet(true)}
      />

      {requests.length === 0 ? (
        <EmptyState headings={headings} text={t("withdrawal.description")} />
      ) : (
        <div>
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={headClass}>{headings[0]}</th>
                <th className={headClass}>{headings[1]}</th>
                <th className={cn(headClass, "hidden lg:table-cell")}>
                  {headings[2]}
                </th>
                <th className={cn(headClass, "hidden lg:table-cell")}>
                  {headings[3]}
                </th>
                <th className={cn(headClass, "w-[12rem] lg:w-[16rem]")}>
                  {headings[4]}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <motion.tr
                  key={`${current}-${r.withdrawalRequestId}`}
                  {...rowMotion(i)}
                  onClick={() => setDetail(r)}
                  className="border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50"
                >
                  <td className={cn(cellClass, "truncate uppercase")}>
                    {r.withdrawalRequestId.slice(0, 8)}
                  </td>
                  <td className={cn(cellClass, "truncate")}>{r.bankName}</td>
                  <td
                    className={cn(cellClass, "hidden lg:table-cell truncate")}
                  >
                    {r.accountNumber}
                  </td>
                  <td
                    className={cn(
                      cellClass,
                      "hidden lg:table-cell font-medium whitespace-nowrap",
                    )}
                  >
                    {amountOf(r)}
                  </td>
                  <td className={cellClass}>
                    <StatusPill colour={WITHDRAWAL_COLOURS[r.status]}>
                      {statusLabel[r.status]}
                    </StatusPill>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <NoMatch
              text={t("withdrawal.no_match")}
              onClear={() => {
                setStatus("all");
                setQuery("");
                setPage(1);
              }}
            />
          )}
        </div>
      )}

      {pageSize && pageCount > 1 && (
        <TablePagination
          page={current}
          count={pageCount}
          onChange={setPage}
          prevLabel={t("page_prev")}
          nextLabel={t("page_next")}
        />
      )}
      {limit && filtered.length > limit && (
        <ViewAll href="/finance/withdrawal" label={t("withdrawal.more")} />
      )}

      <FilterSheet
        open={sheet}
        onOpenChange={setSheet}
        title={t("filters_title")}
        closeLabel={t("close")}
      >
        <RadioGroup
          title={t("filters.all")}
          options={options}
          value={status}
          onChange={reset(setStatus)}
        />
      </FilterSheet>
      <WithdrawalDetails
        request={detail}
        currency={currency}
        statusLabel={detail ? statusLabel[detail.status] : ""}
        onClose={() => setDetail(null)}
      />
    </section>
  );
}
