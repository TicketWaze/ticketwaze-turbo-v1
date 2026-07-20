"use client";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import TransactionDetails from "./TransactionDetails";
import Money from "@ticketwaze/ui/assets/icons/moneys.svg";
import ArrowUp from "@ticketwaze/ui/assets/icons/arrow-up.svg";
import Image from "next/image";
import PaymentsPageTopbar from "./PaymentsPageTopbar";
import SearchInput from "@/components/shared/SearchInput";
import PageLoader from "@/components/PageLoader";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Order } from "@ticketwaze/typescript-config";

function getTransactionStatusStyle(status: string) {
  switch (status) {
    case "SUCCESSFUL":
      return { color: "#349C2E" };
    case "FAILED":
      return { color: "#EF1870" };
    case "RETURNED":
      return { color: "#3F3F3F" };
    default:
      return { color: "#EA961C" };
  }
}

function formatOrderAmount(order: Order) {
  const currency = order.tickets?.[0]?.event?.currency ?? "HTG";
  const amount =
    currency === "HTG"
      ? order.amount.toLocaleString()
      : order.usdPrice.toLocaleString();
  return `${amount} ${currency}`;
}

/**
 * The buyer's name lives in two places depending on how they checked out: on
 * the tickets for a signed-in purchase, and on the order itself for a guest
 * one. Both are checked, in the same order the API searches them, so the name
 * shown here is the one a search for it would match.
 */
function getOrderAttendeeName(order: Order): string {
  const fromTicket = order.tickets?.[0]?.fullName?.trim();
  if (fromTicket) return fromTicket;
  const fromOrder = [order.firstName, order.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fromOrder || "—";
}

type PaymentStats = {
  totalRevenue: number;
  totalTransactions: number;
  revenueGrowth: number;
  platformFees: number;
};

export default function PaymentsPageContent({
  orders,
  stats,
  activeStatus,
  period,
  search,
}: {
  orders: Order[];
  stats: PaymentStats;
  activeStatus: string;
  period?: string;
  search?: string;
}) {
  const t = useTranslations("Payments");
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [term, setTerm] = useState(search ?? "");

  /**
   * Search results live beside the server-rendered rows rather than replacing
   * them: null means "not searching", so clearing the box restores the filtered
   * list already on screen without a round trip.
   */
  const [searchRows, setSearchRows] = useState<Order[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isSearchActive = term.trim().length > 0;
  const rows = searchRows ?? orders;
  const history = rows.length > 0;

  const selectedStatus = [
    "PENDING",
    "SUCCESSFUL",
    "FAILED",
    "RETURNED",
  ].includes(activeStatus)
    ? activeStatus
    : "all";

  // The server is the source of truth for what is on screen, so a completed
  // navigation is what clears the loader.
  useEffect(() => {
    setIsLoading(false);
  }, [activeStatus, period, search]);

  /**
   * One request per keystroke, with the previous one aborted as the next goes
   * out. Aborting is what keeps the results honest: without it a slow early
   * request can land after a faster later one and overwrite the newer results
   * with stale rows.
   *
   * The request goes straight to the API rather than through a navigation so it
   * is cancellable — the admin origin is CORS allow-listed, and the bearer token
   * is the same one the server components use.
   */
  useEffect(() => {
    abortRef.current?.abort();

    const trimmed = term.trim();
    if (!trimmed) {
      setSearchRows(null);
      setIsSearching(false);
      return;
    }

    const token = session?.user.accessToken;
    if (!token) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);

    // Searching deliberately ignores the status and period pills so it runs
    // against every record.
    const params = new URLSearchParams({
      status: "all",
      search: trimmed,
      limit: "50",
    });

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/payments/requests?${params.toString()}`,
      {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then((response) => response.json())
      .then((data) => {
        setSearchRows(data?.orders?.data ?? []);
        setIsSearching(false);
      })
      .catch((error) => {
        // An aborted request was replaced by a newer one; it owns the state now.
        if (error?.name === "AbortError") return;
        setSearchRows([]);
        setIsSearching(false);
      });

    return () => controller.abort();
  }, [term, session?.user.accessToken]);

  // Picking a filter ends the search — the two are alternative ways of choosing
  // rows, and leaving a stale term in the box would misdescribe what is listed.
  const navigate = (params: URLSearchParams) => {
    abortRef.current?.abort();
    setTerm("");
    setSearchRows(null);
    setIsSearching(false);
    setIsLoading(true);
    router.push(`${pathname}?${params.toString()}`);
  };

  // `status` is always written to the URL, "all" included: an absent param
  // falls back to the page's SUCCESSFUL default, so omitting it would turn
  // "All status" back into "Successful".
  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams();
    params.set("status", value);
    if (period) params.set("period", period);
    navigate(params);
  };

  const handlePeriodChange = (value: string) => {
    const params = new URLSearchParams();
    params.set("status", selectedStatus);
    if (value !== "all_period") params.set("period", value);
    navigate(params);
  };

  const growthPositive = stats.revenueGrowth >= 0;

  return (
    <>
      <PageLoader isLoading={isLoading} />
      <PaymentsPageTopbar
        title={t("title")}
        filter={t("filters.period.actual")}
      />
      <div
        className={
          "grid grid-cols-2 lg:grid-cols-3 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <div className={"pb-12"}>
          <span
            className={
              "flex text-[14px] text-neutral-600 leading-8 pb-2 justify-between"
            }
          >
            {t("total_revenue")}
            <span
              className={`flex gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10 ${growthPositive ? "text-success" : "text-[#EF1870]"}`}
            >
              {Math.abs(stats.revenueGrowth)}%
              <Image src={ArrowUp} alt="trend" width={20} height={20} />
            </span>
          </span>
          <p
            className={
              "font-medium text-[1.6rem] -mt-2 lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.totalRevenue.toLocaleString()}{" "}
            <span className="text-neutral-600">HTG</span>
          </p>
        </div>
        <div className={"pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("total_transactions")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.totalTransactions.toLocaleString()}
          </p>
        </div>
        <div className={"pl-0 lg:pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("fees")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.platformFees.toLocaleString()}{" "}
            <span className="text-neutral-600">HTG</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-8 overflow-scroll h-full">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between">
            <h4 className="hidden font-medium lg:inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
              {t("transactions.title")}
            </h4>
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
              <SearchInput
                value={term}
                onChange={setTerm}
                placeholder={t("filters.search")}
              />
              {/* The two pills share a row of their own so they sit side by
                  side on mobile instead of stacking under the search box. On
                  desktop the parent is already a row, so this nests without
                  changing the layout. */}
              <div className="flex flex-row gap-4 w-full lg:w-auto">
                {/* Controlled, not defaultValue: a search runs against every
                  record, so while one is active the pills have to show that no
                  status or period narrowing is in effect. */}
                <Select
                  value={isSearchActive ? "all" : selectedStatus}
                  onValueChange={handleStatusChange}
                >
                  {/* Mobile: each pill takes an equal share of the row, so the
                      two split the width either side of the gap. `min-w-0` lets
                      them actually shrink to that share — a flex item's default
                      min-width is its content, which the base `whitespace-nowrap`
                      would otherwise hold wide. Desktop keeps the original
                      content-width pills. */}
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none flex-1 lg:flex-none w-full lg:w-fit min-w-0 text-[1.4rem] text-neutral-700 leading-8">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                    <SelectGroup>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="all"
                      >
                        {t("filters.status")}
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="SUCCESSFUL"
                      >
                        Successful
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="PENDING"
                      >
                        Pending
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="FAILED"
                      >
                        Failed
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="RETURNED"
                      >
                        Returned
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  value={
                    isSearchActive ? "all_period" : (period ?? "all_period")
                  }
                  onValueChange={handlePeriodChange}
                >
                  {/* Mobile: each pill takes an equal share of the row, so the
                      two split the width either side of the gap. `min-w-0` lets
                      them actually shrink to that share — a flex item's default
                      min-width is its content, which the base `whitespace-nowrap`
                      would otherwise hold wide. Desktop keeps the original
                      content-width pills. */}
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none flex-1 lg:flex-none w-full lg:w-fit min-w-0 text-[1.4rem] text-neutral-700 leading-8">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                    <SelectGroup>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="all_period"
                      >
                        {t("filters.time")}
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="last_week"
                      >
                        Last week
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="last_month"
                      >
                        Last month
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* The results area owns the search loader: the header, stats and
              filters stay usable while a query is in flight. */}
          <div className="relative min-h-40">
            {isSearching && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-20 bg-white/70">
                <LoadingCircleSmall />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Mobile keeps only the attendee and the amount — the two
                      columns that identify a transaction at a glance on a
                      narrow screen. Everything else is desktop-only. */}
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("transactions.table.transaction_id")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("transactions.table.attendee")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("transactions.table.activity_name")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("transactions.table.amount_paid")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("transactions.table.transaction_status.title")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              {history ? (
                <TableBody>
                  {rows.map((order) => {
                    const statusStyle = getTransactionStatusStyle(order.status);
                    const firstTicket = order.tickets?.[0];
                    const attendeeName = getOrderAttendeeName(order);
                    return (
                      <Drawer key={order.orderId} direction="right">
                        <DrawerTrigger asChild>
                          <TableRow className="cursor-pointer">
                            <TableCell
                              className={
                                "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                              }
                            >
                              <span className="cursor-pointer">
                                {order.orderName}
                              </span>
                            </TableCell>
                            {/* A long name would otherwise widen the column and
                                push the amount off a narrow screen, so it is
                                clipped and the full value kept in the title. */}
                            <TableCell
                              className={
                                "text-[1.5rem] py-6 leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className="block max-w-[16rem] lg:max-w-[24rem] truncate cursor-pointer"
                                title={attendeeName}
                              >
                                {attendeeName}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                              }
                            >
                              {firstTicket?.event?.eventName ?? "—"}
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] font-medium leading-8 text-neutral-900"
                              }
                            >
                              {formatOrderAmount(order)}
                            </TableCell>
                            <TableCell className="py-6 hidden lg:table-cell">
                              <span
                                style={{ color: statusStyle.color }}
                                className="py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-[#f5f5f5]"
                              >
                                {order.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        </DrawerTrigger>
                        <TransactionDetails order={order} />
                      </Drawer>
                    );
                  })}
                </TableBody>
              ) : null}
            </Table>
            {/* An empty search is not an empty system: the "no payments yet"
                illustration would be wrong while a query is narrowing the list. */}
            {!history &&
              !isSearching &&
              (isSearchActive ? (
                <p className="text-[1.8rem] text-neutral-600 leading-10 text-center mt-16">
                  {t("transactions.no_results", { term: term.trim() })}
                </p>
              ) : (
                <div className="flex flex-col w-fit gap-12 items-center mt-8 self-center">
                  <div className="rounded-full bg-neutral-100 p-6 w-fit">
                    <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
                      <Image
                        src={Money}
                        alt="no payment history"
                        width={50}
                        height={50}
                      />
                    </div>
                  </div>
                  <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
                    {t("transactions.no_history")}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div></div>
    </>
  );
}
