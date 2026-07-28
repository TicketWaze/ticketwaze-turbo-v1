"use client";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import Image from "next/image";
import TicketImage from "@ticketwaze/ui/assets/icons/ticket-2.svg";
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
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import TicketsPageTopbar from "./TicketsPageTopbar";
import TicketDetails from "./TicketDetails";
import SearchInput from "@/components/shared/SearchInput";
import PageLoader from "@/components/PageLoader";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Ticket } from "@ticketwaze/typescript-config";

/** The filter pill. Shared by all three selects so they stay identical. */
const pillTrigger =
  "bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8";

const statusColors: Record<"PENDING" | "CHECKED" | "RETURNED", string> = {
  PENDING: "text-[#EA961C]",
  CHECKED: "text-success",
  RETURNED: "text-[#EF1870]",
};

function getTicketTypeColor(ticketType: string) {
  const upper = ticketType.toUpperCase();
  if (upper.includes("PREMIUM")) return "#2E3237";
  if (upper.includes("VIP")) return "#7A19C7";
  return "#EF1870";
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function TicketPageContent({
  tickets,
  stats,
  activeStatus,
  period,
  search,
  activityType,
}: {
  tickets: Ticket[];
  stats: { total: number; returned: number; checkedIn: number };
  activeStatus: string;
  period?: string;
  search?: string;
  activityType?: string;
}) {
  const t = useTranslations("Tickets");
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
  const [searchRows, setSearchRows] = useState<Ticket[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isSearchActive = term.trim().length > 0;
  const rows = searchRows ?? tickets;
  const history = rows.length > 0;

  const selectedStatus = ["PENDING", "CHECKED", "RETURNED"].includes(
    activeStatus,
  )
    ? activeStatus
    : "all";

  const selectedActivityType = ["event", "raffle"].includes(activityType ?? "")
    ? activityType!
    : "all_activities";

  // The server is the source of truth for what is on screen, so a completed
  // navigation is what clears the loader.
  useEffect(() => {
    setIsLoading(false);
  }, [activeStatus, period, search, activityType]);

  /**
   * One request per keystroke, with the previous one aborted as the next goes
   * out. Aborting is what keeps the results honest: without it a slow early
   * request can land after a faster later one and overwrite the newer results
   * with stale rows.
   *
   * The request goes straight to the API rather than through a navigation so it
   * is cancellable — the admin origin is CORS allow-listed, and the bearer token
   * is the same one the server components use.
   *
   * The filters are part of the request: a search runs INSIDE the current pills
   * rather than against every record, and the effect re-runs when a pill changes
   * so the results follow it. `selectedStatus` of "all" is a value the API
   * ignores, which is how "no status narrowing" is expressed.
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

    const params = new URLSearchParams({
      status: selectedStatus,
      search: trimmed,
      limit: "50",
    });
    if (period) params.set("period", period);
    if (selectedActivityType !== "all_activities") {
      params.set("activityType", selectedActivityType);
    }

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/tickets/requests?${params.toString()}`,
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
        setSearchRows(data?.tickets?.data ?? []);
        setIsSearching(false);
      })
      .catch((error) => {
        // An aborted request was replaced by a newer one; it owns the state now.
        if (error?.name === "AbortError") return;
        setSearchRows([]);
        setIsSearching(false);
      });

    return () => controller.abort();
  }, [
    term,
    session?.user.accessToken,
    selectedStatus,
    period,
    selectedActivityType,
  ]);

  /**
   * Changing a pill KEEPS the search term. The two narrow the same list
   * together, so the effect above simply re-runs against the new filters.
   *
   * The full-page loader is only for the server-rendered list; while a search is
   * active the rows come from the fetch above, which has its own inline spinner.
   */
  const navigate = (params: URLSearchParams) => {
    if (!isSearchActive) setIsLoading(true);
    router.push(`${pathname}?${params.toString()}`);
  };

  // `status` is always written to the URL, "all" included: an absent param
  // falls back to the page's PENDING default, so omitting it would turn
  // "All status" back into "Pending".
  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams();
    params.set("status", value);
    if (period) params.set("period", period);
    if (activityType) params.set("activityType", activityType);
    navigate(params);
  };

  const handlePeriodChange = (value: string) => {
    const params = new URLSearchParams();
    params.set("status", selectedStatus);
    if (value !== "all_period") params.set("period", value);
    if (activityType) params.set("activityType", activityType);
    navigate(params);
  };

  const handleActivityTypeChange = (value: string) => {
    const params = new URLSearchParams();
    params.set("status", selectedStatus);
    if (period) params.set("period", period);
    if (value !== "all_activities") params.set("activityType", value);
    navigate(params);
  };

  return (
    <>
      <PageLoader isLoading={isLoading} />
      <TicketsPageTopbar
        title={t("title")}
        filter={t("filters.period.actual")}
      />
      <div
        className={
          "grid grid-cols-2 lg:grid-cols-3 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <div className={"pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("total_sold")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.total}
          </p>
        </div>
        <div className={"pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("total_created")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.returned}
          </p>
        </div>
        <div className={"pl-0 lg:pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("checked-in")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.checkedIn}
          </p>
        </div>
      </div>
      {/* The list scrolls inside the page rather than the page itself, so the
          topbar and the stat tiles stay put. Same wrapper as the payments
          table. */}
      <div className="flex flex-col gap-8 overflow-scroll h-full">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h4 className="hidden font-medium lg:inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
              {t("tickets_list.title")}
            </h4>
            <div className="flex flex-col gap-4 w-full lg:w-auto lg:flex-row lg:items-center">
              <SearchInput
                value={term}
                onChange={setTerm}
                placeholder={t("filters.search")}
              />
              {/* On mobile the search owns its own full-width row and the pills
                  wrap together underneath, rather than each control stacking
                  onto a line of its own. `lg:contents` dissolves this wrapper at
                  desktop so the pills sit inline exactly as before. */}
              <div className="flex flex-wrap items-center gap-3 lg:contents">
                {/* Controlled, not defaultValue: the pills describe what is on
                screen, and they keep applying while a search is running. */}
                <Select
                  value={selectedActivityType}
                  onValueChange={handleActivityTypeChange}
                >
                  <SelectTrigger className={pillTrigger}>
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                    <SelectGroup>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="all_activities"
                      >
                        {t("filters.activity_type")}
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="event"
                      >
                        {t("filters.activity_event")}
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="raffle"
                      >
                        {t("filters.activity_raffle")}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className={pillTrigger}>
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
                        value="CHECKED"
                      >
                        Checked-In
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="PENDING"
                      >
                        Pending
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
                  value={period ?? "all_period"}
                  onValueChange={handlePeriodChange}
                >
                  <SelectTrigger className={pillTrigger}>
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
          {/* The results area owns the search loader: the header, stats and filters
          stay usable while a query is in flight. */}
          <div className="relative min-h-40">
            {isSearching && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-20 bg-white/70">
                <LoadingCircleSmall />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("tickets_list.table.transaction_id")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("tickets_list.table.attendee")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("tickets_list.table.activity_name")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("tickets_list.table.ticket_class")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("tickets_list.table.check-in")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("tickets_list.table.purchase")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              {history ? (
                <TableBody>
                  {rows.map((ticket) => (
                    <Drawer key={ticket.ticketId} direction="right">
                      <DrawerTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell
                            className={
                              "text-[1.5rem] py-6 leading-8 text-neutral-900"
                            }
                          >
                            <span className={"cursor-pointer"}>
                              {ticket.ticketName}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                            }
                          >
                            <span className={"cursor-pointer"}>
                              {ticket.fullName}
                            </span>
                          </TableCell>
                          {/* Clipped so a long activity name cannot widen the
                              column and squeeze the rest of the row. The full
                              value stays available on hover. */}
                          <TableCell
                            className={
                              "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                            }
                          >
                            <span
                              className="block max-w-[24rem] truncate"
                              title={ticket.activity?.name ?? undefined}
                            >
                              {ticket.activity?.name ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] font-medium leading-8 text-neutral-900"
                            }
                          >
                            <span
                              style={{
                                color: getTicketTypeColor(
                                  ticket.ticketType ?? "",
                                ),
                              }}
                              className="py-[0.3rem] px-2 bg-neutral-100 font-bold rounded-[30px] text-[11px] uppercase"
                            >
                              {ticket.ticketType}
                            </span>
                          </TableCell>
                          <TableCell className="py-6">
                            <span
                              className={`py-[0.3rem] px-2 cursor-pointer text-[1.1rem] font-bold text-center uppercase ${statusColors[ticket.status] ?? "text-neutral-600"} rounded-[30px] bg-neutral-100`}
                            >
                              {ticket.status}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                            }
                          >
                            {formatDate(ticket.createdAt as unknown as string)}
                          </TableCell>
                        </TableRow>
                      </DrawerTrigger>
                      <TicketDetails ticket={ticket} />
                    </Drawer>
                  ))}
                </TableBody>
              ) : null}
            </Table>
            {/* An empty search is not an empty system: the "nothing sold yet"
            illustration would be wrong while a query is narrowing the list. */}
            {!history &&
              !isSearching &&
              (isSearchActive ? (
                <p className="text-[1.8rem] text-neutral-600 leading-10 text-center mt-16">
                  {t("tickets_list.no_results", { term: term.trim() })}
                </p>
              ) : /* The stat tiles count every ticket ever sold, ignoring the
                     filters, so they say precisely which empty this is: nothing
                     sold yet, or nothing matching the current pills. Guessing
                     from the pills instead would be wrong, since the page opens
                     on a status filter by default. */
              stats.total > 0 ? (
                <p className="text-[1.8rem] text-neutral-600 leading-10 text-center mt-16">
                  {t("tickets_list.no_filtered")}
                </p>
              ) : (
                <div className="flex flex-col w-fit gap-12 items-center mt-8 self-center">
                  <div className="rounded-full bg-neutral-100 p-6 w-fit">
                    <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
                      <Image
                        src={TicketImage}
                        alt="no ticket history"
                        width={50}
                        height={50}
                      />
                    </div>
                  </div>
                  <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
                    {t("tickets_list.no_history")}
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
