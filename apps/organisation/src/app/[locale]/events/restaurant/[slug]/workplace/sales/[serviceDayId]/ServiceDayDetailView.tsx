"use client";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@ticketwaze/currency";
import { Receipt21 } from "iconsax-reactjs";
import { DateTime } from "luxon";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import type { CustomerTab, ServiceDayDetail } from "../../types";

/**
 * Everything that happened on one trading day: the frozen totals, then every
 * check that was opened, in the order it was opened.
 *
 * Strictly read-only. The live board is where a tab is edited or settled; a
 * closed day is a record, and the totals shown here were snapshotted at close
 * precisely so they cannot be restated by a later menu change.
 */
export default function ServiceDayDetailView({
  day,
  timezone,
}: {
  day: ServiceDayDetail;
  timezone: string;
}) {
  const t = useTranslations("Events.workplace");
  const locale = useLocale();

  const isOpen = day.status === "open";
  // A business date is a day, not an instant — read it as a plain date so it
  // does not slide backwards for anyone behind UTC.
  const date = DateTime.fromISO(day.businessDate)
    .setLocale(locale)
    .toLocaleString(DateTime.DATE_HUGE);

  // Clock times are the venue's own: a night that ran to 3am should read as 3am
  // there, not in the reader's timezone.
  const time = (value: string | null) =>
    value
      ? DateTime.fromISO(value).setZone(timezone).setLocale(locale).toFormat("HH:mm")
      : null;

  const openedAt = time(day.openedAt);
  const closedAt = time(day.closedAt);

  /**
   * A day in progress has no frozen figures yet — they are written at close —
   * so its totals are summed from the tabs that have actually been settled.
   * Without this the summary reads as zero all day.
   */
  const settled = day.tabs.filter((tab) => tab.status === "closed");
  const liveTotal = settled.reduce((sum, tab) => sum + tab.total, 0);
  const liveCash = settled
    .filter((tab) => tab.paymentMethod === "cash")
    .reduce((sum, tab) => sum + tab.total, 0);

  const totalSales = isOpen ? liveTotal : day.totalSales;
  const cashSales = isOpen ? liveCash : day.cashSales;
  const tabCount = isOpen ? day.tabs.length : day.tabCount;
  const itemCount = isOpen
    ? day.tabs.reduce(
        (sum, tab) =>
          sum + tab.items.reduce((n, line) => n + line.quantity, 0),
        0,
      )
    : day.itemCount;

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll pb-12">
      <BackButton text={t("back")} />
      <TopBar title={date}>
        <span
          className={`px-4 py-1 rounded-[30px] text-[1.1rem] font-medium uppercase shrink-0 ${
            isOpen
              ? "bg-success/10 text-success"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {t(`status.${day.status}`)}
        </span>
      </TopBar>

      {/* The day's own summary, same treatment as the list it was opened from. */}
      <div className="w-full p-6 rounded-[15px] border border-neutral-100 flex flex-wrap items-center gap-x-12 gap-y-6">
        <Stat
          label={t("day_sales")}
          value={formatMoney(totalSales, day.currency, locale)}
          accent
        />
        <Stat
          label={t("day_cash")}
          value={formatMoney(cashSales, day.currency, locale)}
        />
        <Stat label={t("day_tabs")} value={String(tabCount)} />
        <Stat label={t("day_items")} value={String(itemCount)} />
        {(openedAt || closedAt) && (
          <Stat
            label={t("day_hours")}
            value={[openedAt, closedAt].filter(Boolean).join(" - ")}
          />
        )}
      </div>

      {day.note && (
        <div className="rounded-[15px] bg-neutral-100 p-6">
          <span className="text-[1.2rem] text-neutral-600">
            {t("day_note")}
          </span>
          <p className="text-[1.4rem] leading-8 text-deep-100">{day.note}</p>
        </div>
      )}

      <h4 className="font-medium font-primary text-[1.8rem] leading-10 text-black">
        {t("day_operations")}
      </h4>

      {day.tabs.length === 0 ? (
        <EmptyState message={t("no_tabs_on_day")} />
      ) : (
        <ul className="flex flex-col gap-6">
          {day.tabs.map((tab) => (
            <li key={tab.tabId}>
              <ClosedTabCard tab={tab} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One check as it stands in the record: what was ordered, what it came to, and
 * how it was paid. A read-only sibling of the live board's tab card, sharing
 * its shape so the two read as the same object.
 */
function ClosedTabCard({
  tab,
  locale,
}: {
  tab: CustomerTab;
  locale: string;
}) {
  const t = useTranslations("Events.workplace");
  const isOpen = tab.status === "open";
  const count = tab.items.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="w-full p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
      <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-6">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-100 truncate">
              {tab.label}
            </span>
            <span
              className={`px-4 py-1 rounded-[30px] text-[1.1rem] font-medium uppercase shrink-0 ${
                isOpen
                  ? "bg-success/10 text-success"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {t(`status.${tab.status}`)}
            </span>
          </div>
          <span className="text-[1.2rem] text-neutral-600">
            {t("items_count", { count })}
            {tab.note ? ` · ${tab.note}` : ""}
          </span>
        </div>
        <span className="text-[1.8rem] font-medium leading-8 text-primary-500 shrink-0">
          {formatMoney(tab.total, tab.currency, locale)}
        </span>
      </div>

      {/* What was actually taken at the counter. Kept for the same reason the
          live board keeps it: a change dispute later is settled by this line. */}
      {!isOpen && tab.paymentMethod && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[1.2rem] text-neutral-600">
          <span className="font-medium text-deep-100">
            {t(`paid_${tab.paymentMethod}`)}
          </span>
          {tab.amountTendered !== null && (
            <span>
              {t("received")}{" "}
              {formatMoney(tab.amountTendered, tab.currency, locale)}
            </span>
          )}
          {tab.changeGiven !== null && (
            <span>
              {t("change_due")}{" "}
              {formatMoney(tab.changeGiven, tab.currency, locale)}
            </span>
          )}
        </div>
      )}

      <ul className="flex flex-col divide-y divide-neutral-100">
        {tab.items.map((line) => (
          <li
            key={line.tabItemId}
            className="flex items-center justify-between gap-4 py-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-[1.4rem] font-medium text-neutral-600 shrink-0">
                {line.quantity}x
              </span>
              <span className="text-[1.5rem] leading-8 text-deep-100 truncate">
                {line.name}
              </span>
            </div>
            <span className="text-[1.4rem] leading-8 text-neutral-700 shrink-0">
              {formatMoney(line.unitPrice * line.quantity, line.currency, locale)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[1.2rem] text-neutral-600">{label}</span>
      <span
        className={`font-medium leading-8 text-[1.8rem] ${
          accent ? "text-primary-500" : "text-deep-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-[330px] lg:w-[460px] mx-auto flex flex-col items-center justify-center gap-[5rem] py-20">
      <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100">
        <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200">
          <Receipt21 size="50" color="#0d0d0d" variant="Bulk" />
        </div>
      </div>
      <p className="text-[1.8rem] leading-[25px] text-neutral-600 text-center max-w-[330px] lg:max-w-[422px]">
        {message}
      </p>
    </div>
  );
}
