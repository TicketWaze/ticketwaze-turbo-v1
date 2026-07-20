"use client";
import { useLocale, useTranslations } from "next-intl";
import { Restaurant } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { Calendar } from "iconsax-reactjs";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import type { ServiceDay } from "../types";

/**
 * Daily sales, one row per closed day. The figures are the ones frozen when the
 * venue closed the day, not a re-sum of today's menu prices — that is the whole
 * reason they were snapshotted.
 */
export default function SalesHistory({
  restaurant,
  days,
}: {
  restaurant: Restaurant;
  days: ServiceDay[];
}) {
  const t = useTranslations("Events.workplace");
  const locale = useLocale();
  const usd = restaurant.reservationFeeCurrency === "USD";
  const currency = restaurant.reservationFeeCurrency;

  const period = days.reduce(
    (sum, day) => sum + (usd ? day.usdTotalSales : day.totalSales),
    0,
  );

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll pb-12">
      <BackButton text={t("back")} />
      <TopBar title={t("sales_history")} />

      {days.length === 0 ? (
        <EmptyState message={t("no_closed_days")} />
      ) : (
        <>
          <div className="w-full p-6 rounded-[15px] border border-neutral-100 flex flex-wrap items-center gap-8">
            <Stat
              label={t("period_total")}
              value={formatMoney(period, currency, locale)}
            />
            <Stat label={t("days_recorded")} value={String(days.length)} />
          </div>

          <ul className="flex flex-col divide-y divide-neutral-100 border border-neutral-100 rounded-[15px] px-6">
            {days.map((day) => {
              const sales = usd ? day.usdTotalSales : day.totalSales;
              const cash = usd ? day.usdCashSales : day.cashSales;
              const date = new Date(day.businessDate).toLocaleDateString(
                locale,
                { weekday: "long", day: "numeric", month: "long", year: "numeric" },
              );

              return (
                <li
                  key={day.serviceDayId}
                  className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between py-6"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[1.5rem] font-medium leading-8 text-deep-100 capitalize">
                      {date}
                    </span>
                    <span className="text-[1.2rem] text-neutral-600">
                      {t("items_count", { count: day.itemCount })} ·{" "}
                      {t("tabs_count", { count: day.tabCount })}
                      {day.note ? ` · ${day.note}` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-8 shrink-0">
                    <Stat
                      label={t("day_cash")}
                      value={formatMoney(cash, day.currency, locale)}
                      muted
                    />
                    <span className="text-[1.8rem] font-medium leading-8 text-primary-500">
                      {formatMoney(sales, day.currency, locale)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[1.2rem] text-neutral-600">{label}</span>
      <span
        className={`font-medium leading-8 ${
          muted
            ? "text-[1.4rem] text-neutral-600"
            : "text-[1.8rem] text-deep-100"
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
          <Calendar size="50" color="#0d0d0d" variant="Bulk" />
        </div>
      </div>
      <p className="text-[1.8rem] leading-[25px] text-neutral-600 text-center max-w-[330px] lg:max-w-[422px]">
        {message}
      </p>
    </div>
  );
}
