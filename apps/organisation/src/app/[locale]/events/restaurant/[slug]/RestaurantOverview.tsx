"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Money3, SearchNormal, Shop } from "iconsax-reactjs";
import {
  Restaurant,
  RestaurantStats,
  RestaurantTransaction,
} from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import TopBar from "@/components/shared/TopBar";
import { LinkSecondary } from "@/components/shared/Links";
import { slugify } from "@/lib/Slugify";
import FormatDate from "@/lib/FormatDate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ShareRestaurant from "./components/ShareRestaurant";
import RestaurantMoreComponent from "./components/RestaurantMoreComponent";

export default function RestaurantOverview({
  restaurant,
  transactions = [],
  stats,
}: {
  restaurant: Restaurant;
  transactions?: RestaurantTransaction[];
  stats: RestaurantStats;
}) {
  const t = useTranslations("Events.restaurantDetail");
  const tc = useTranslations("Events.restaurantCard");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const slug = slugify(restaurant.name, restaurant.restaurantId);

  const suspended = restaurant.suspendedAt !== null;

  // Match on what a venue owner would actually have to hand: the reference on
  // the receipt, or the customer's name.
  const filteredTransactions = transactions.filter((transaction) => {
    const search = query.trim().toLowerCase();
    if (!search) return true;
    const customer = [transaction.firstName, transaction.lastName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      transaction.orderName.toLowerCase().includes(search) ||
      customer.includes(search) ||
      (transaction.email ?? "").toLowerCase().includes(search)
    );
  });

  return (
    <div className={"flex flex-col gap-12 overflow-y-scroll"}>
      <TopBar title={restaurant.name}>
        <div className="hidden lg:flex items-center gap-4">
          {/* The workplace is where the venue is actually run day to day —
              menu and, later, counter payments. Kept next to Share rather than
              inside More because staff open it constantly. */}
          <LinkSecondary
            href={`/events/restaurant/${slug}/workplace`}
            className="py-[7.5px] flex items-center gap-3"
          >
            <Shop size="20" color="#E45B00" variant="Bulk" />
            {t("workplace")}
          </LinkSecondary>
          {restaurant.adminStatus === "approved" && !suspended && (
            <ShareRestaurant restaurant={restaurant} />
          )}
          <RestaurantMoreComponent
            restaurant={restaurant}
            hasSales={stats.transactionCount > 0}
          />
        </div>
      </TopBar>

      {/* Moderation and visibility state, surfaced before the numbers so an
          invisible venue is never a mystery. */}
      {suspended && (
        <div className="flex flex-col gap-2 rounded-[15px] border border-failure/30 bg-failure/5 p-6">
          <span className="text-[1.4rem] font-medium text-failure">
            {tc("suspended")}
          </span>
          <p className="text-[1.4rem] leading-8 text-neutral-700">
            {restaurant.suspensionReason ?? t("suspended_hint")}
          </p>
        </div>
      )}
      {!suspended && restaurant.adminStatus === "rejected" && (
        <div className="flex flex-col gap-2 rounded-[15px] border border-failure/30 bg-failure/5 p-6">
          <p className="text-[1.4rem] leading-8 text-neutral-700">
            {restaurant.rejectionReason ?? t("rejected_hint")}
          </p>
        </div>
      )}
      {!suspended &&
        (restaurant.adminStatus === "requested" ||
          restaurant.adminStatus === "review") && (
          <div className="rounded-[15px] border border-warning/30 bg-warning/5 p-6">
            <p className="text-[1.4rem] leading-8 text-neutral-700">
              {t("pending_hint")}
            </p>
          </div>
        )}

      {/* Business summary. Same grid, type scale and dividers as the event page.
          A venue never ends, so "this month" carries the weight that a countdown
          to the event date carries there. */}
      <ul
        className={
          "grid grid-cols-2 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <li className={"pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("revenue")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {stats.revenue}{" "}
            <span
              className={
                "font-normal text-[1.6rem] lg:text-[25px] text-neutral-500"
              }
            >
              {stats.currency}
            </span>
          </p>
        </li>
        <li className={"pl-10 pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("month_revenue")}
          </span>
          <p className={"font-medium text-[25px] leading-12 font-primary"}>
            {stats.monthRevenue}{" "}
            <span
              className={
                "font-normal text-[1.6rem] lg:text-[25px] text-neutral-500"
              }
            >
              {stats.currency}
            </span>
          </p>
        </li>
      </ul>

      {/* Sales */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <h4 className="font-medium font-primary text-[1.8rem] leading-10 text-black">
            {t("records")}
          </h4>
          <div className="bg-neutral-100 rounded-[30px] flex items-center justify-between w-full lg:w-[243px] px-6 py-4">
            <input
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
            />
            <SearchNormal size="20" color="#737c8a" variant="Bulk" />
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.reference")}
                </TableHead>
                <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.customer")}
                </TableHead>
                <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.type")}
                </TableHead>
                <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.amount")}
                </TableHead>
                <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.method")}
                </TableHead>
                <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                  {t("table.date")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const itemType =
                  transaction.items[0]?.itemType ?? "restaurant_payment";
                const customer =
                  [transaction.firstName, transaction.lastName]
                    .filter(Boolean)
                    .join(" ") || t("guest");
                return (
                  <TableRow key={transaction.orderId}>
                    <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                      {transaction.orderName}
                    </TableCell>
                    <TableCell className="text-[1.5rem] leading-8 text-neutral-900">
                      {customer}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EF1870] px-2 rounded-[30px] bg-[#f5f5f5]">
                        {t(`types.${itemType}`)}
                      </span>
                    </TableCell>
                    <TableCell className="text-[1.5rem] font-medium leading-8 text-neutral-900">
                      {formatMoney(
                        transaction.amount,
                        transaction.currency,
                        locale,
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900 capitalize">
                      {transaction.provider}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900">
                      {FormatDate(transaction.createdAt, locale, "local")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="w-[330px] lg:w-[460px] mx-auto flex flex-col items-center justify-center gap-[5rem] py-20">
            <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100">
              <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200">
                <Money3 size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <p className="text-[1.8rem] leading-[25px] text-neutral-600 text-center max-w-[330px] lg:max-w-[422px]">
              {t("table.empty")}
            </p>
          </div>
        )}
      </div>

      {/* Mobile actions — the TopBar row is desktop-only, same as the event page. */}
      <div className="flex lg:hidden items-center gap-4">
        {restaurant.adminStatus === "approved" && !suspended && (
          <ShareRestaurant restaurant={restaurant} />
        )}
        <RestaurantMoreComponent
          restaurant={restaurant}
          hasSales={stats.transactionCount > 0}
        />
      </div>
    </div>
  );
}
