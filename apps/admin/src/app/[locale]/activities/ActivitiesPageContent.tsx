/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Event, Raffle, Restaurant, Sale } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { SaleStatusBadge } from "./sale/[id]/components/SaleStatusDialog";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import PageLoader from "@/components/PageLoader";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import SearchInput from "@/components/shared/SearchInput";
import PageTitle, { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import Image from "next/image";
import MoneySend from "@ticketwaze/ui/assets/icons/money-send.svg";

// `pending_edit` is not an adminStatus — it is the separate "an organiser
// changed something on a live event" axis. Editing deliberately leaves
// adminStatus alone so the event keeps selling, so these rows would otherwise
// only ever be reachable buried in the approved list.
type StatusFilter =
  | "all"
  | "requested"
  | "review"
  | "approved"
  | "rejected"
  | "pending_edit";

/**
 * Shared by every tab's pill so the four filters are one control with one set
 * of dimensions, not four that happen to look alike. Matches the search field
 * and the pills on attendees/payments/tickets.
 */
const FILTER_TRIGGER_CLASS =
  "bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none flex-1 lg:flex-none w-full lg:w-fit min-w-0 text-[1.4rem] text-neutral-700 leading-8";

function StatusFilterSelect({
  value,
  onChange,
  allLabel,
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  /**
   * The resting state of the pill names what it is not filtering — "All
   * events" rather than a bare "All" — because the tab it belongs to is the
   * only other thing on the row that says which activity is on screen.
   */
  allLabel: string;
}) {
  return (
    <Select value={value} onValueChange={(e) => onChange(e as StatusFilter)}>
      <SelectTrigger className={FILTER_TRIGGER_CLASS}>
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
        <SelectGroup>
          <SelectItem className={"text-[1.4rem] text-deep-100"} value="all">
            {allLabel}
          </SelectItem>
          <SelectItem
            className={"text-[1.4rem] text-deep-100"}
            value="requested"
          >
            Requested
          </SelectItem>
          <SelectItem className={"text-[1.4rem] text-deep-100"} value="review">
            In Review
          </SelectItem>
          <SelectItem
            className={"text-[1.4rem] text-deep-100"}
            value="approved"
          >
            Approved
          </SelectItem>
          <SelectItem
            className={"text-[1.4rem] text-deep-100"}
            value="rejected"
          >
            Rejected
          </SelectItem>
          <SelectItem
            className={"text-[1.4rem] text-deep-100"}
            value="pending_edit"
          >
            Pending Edits
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/**
 * Sales do not share the other three activities' filter.
 *
 * Their `status` column carries the whole lifecycle rather than just a review
 * outcome, so there is no `approved`/`review` to filter on — a product is
 * `live` or it is somewhere on the way there.
 */
type SaleStatusFilter =
  | "all"
  | "pending_review"
  | "scanning"
  | "live"
  | "rejected"
  | "draft"
  | "unlisted";

function SaleStatusFilterSelect({
  value,
  onChange,
  allLabel,
}: {
  value: SaleStatusFilter;
  onChange: (value: SaleStatusFilter) => void;
  allLabel: string;
}) {
  const options: { value: SaleStatusFilter; label: string }[] = [
    { value: "all", label: allLabel },
    { value: "pending_review", label: "Awaiting review" },
    { value: "scanning", label: "Scanning" },
    { value: "live", label: "Live" },
    { value: "rejected", label: "Rejected" },
    { value: "draft", label: "Draft" },
    { value: "unlisted", label: "Unlisted" },
  ];

  return (
    <Select
      value={value}
      onValueChange={(e) => onChange(e as SaleStatusFilter)}
    >
      <SelectTrigger className={FILTER_TRIGGER_CLASS}>
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              className={"text-[1.4rem] text-deep-100"}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/**
 * The activity type was a TabsList, which laid four fixed-width triggers in a
 * row and overflowed the moment the viewport got narrow — "Products" was
 * clipped on mobile. As a select it costs one tap instead of none but it
 * cannot outgrow its row, and it now matches the status pill beside it.
 */
function ActivityTypeSelect({
  value,
  onChange,
  pendingSaleCount,
  labels,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Surfaced on the Products option because an unattended review queue is
   * sellers waiting with no other route to going live. */
  pendingSaleCount: number;
  labels: Record<string, string>;
}) {
  const options = ["events", "raffles", "restaurants", "sales"];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={FILTER_TRIGGER_CLASS}>
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option}
              // Radix mirrors the item's children into the trigger, so the
              // badge needs a plain-text twin for typeahead and a11y.
              textValue={labels[option]}
              className={"text-[1.4rem] text-deep-100"}
              value={option}
            >
              <span className="inline-flex items-center gap-2">
                {labels[option]}
                {option === "sales" && pendingSaleCount > 0 && (
                  <span className="rounded-[30px] bg-[#FEF3E2] px-2 py-[0.1rem] text-[1.1rem] font-bold text-[#EA961C]">
                    {pendingSaleCount}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function StatusBadge({
  status,
}: {
  status: "requested" | "review" | "approved" | "rejected";
}) {
  const styles: Record<typeof status, string> = {
    requested: "text-black",
    approved: "text-[#349C2E]",
    review: "text-warning",
    rejected: "text-failure",
  };
  return (
    <span
      className={`py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-[#f5f5f5] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/**
 * Sits alongside the status badge rather than replacing it: the activity is
 * still approved and still selling, it just has an unreviewed edit on it. Same
 * shape as StatusBadge so the pair reads as one control, not two designs.
 */
function PendingEditBadge({ fields }: { fields: string[] | null }) {
  return (
    <span
      title={fields?.length ? fields.join(", ") : undefined}
      className="py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-[#f5f5f5] text-warning"
    >
      edited
    </span>
  );
}

/**
 * The name column is the only free-text column and the only one whose content
 * has no bound, so it is the one that pushes the fixed columns off the row.
 * Truncating needs `block` — `truncate` alone does nothing to an inline span —
 * and the full name stays reachable on hover.
 */
function ActivityName({ name }: { name: string }) {
  return (
    <span
      title={name}
      className="block max-w-[16rem] lg:max-w-[28rem] truncate cursor-pointer"
    >
      {name}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col w-fit  gap-12 items-center mt-8 self-center">
      <div className="rounded-full bg-neutral-100 p-6 w-fit">
        <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
          <Image src={MoneySend} alt="No Activities" width={50} height={50} />
        </div>
      </div>
      <p className="max-w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
        {message}
      </p>
    </div>
  );
}

export default function ActivitiesPageContent({
  eventData,
  allEvents,
  status,
  search,
  raffles = [],
  restaurants = [],
  sales = [],
}: {
  eventData: Event[];
  allEvents: Event[];
  status: string;
  search?: string;
  raffles?: Raffle[];
  restaurants?: Restaurant[];
  sales?: Sale[];
}) {
  const t = useTranslations("Activities");
  const locale = useLocale();
  const router = useRouter();

  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState("events");
  const [raffleStatus, setRaffleStatus] = useState<StatusFilter>("all");
  const [restaurantStatus, setRestaurantStatus] = useState<StatusFilter>("all");
  const [saleStatus, setSaleStatus] = useState<SaleStatusFilter>("all");
  const [term, setTerm] = useState(search ?? "");

  /**
   * Events and products are searched in the database, so their hits arrive
   * beside the server-rendered rows rather than being sieved out of them:
   * null means "not searching", and clearing the box restores the list already
   * on screen without a round trip.
   *
   * Raffles and venues are absent here on purpose — their endpoints return
   * every row, so narrowing those on the client already searches the whole
   * table rather than just what is displayed.
   */
  const [eventRows, setEventRows] = useState<Event[] | null>(null);
  const [saleRows, setSaleRows] = useState<Sale[] | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setIsLoading(false);
  }, [status, search]);

  // One box, four lists: the term is scoped to whichever tab is open rather
  // than searching across all of them, so a hit is always a row you can see.
  // Clearing it on the switch avoids the empty table a term carried over from
  // another activity type would produce.
  function handleTabChange(value: string) {
    abortRef.current?.abort();
    setTab(value);
    setTerm("");
    setEventRows(null);
    setSaleRows(null);
    setIsSearchLoading(false);
  }

  const query = term.trim().toLowerCase();
  const isSearching = query.length > 0;

  function matches(...fields: (string | null | undefined)[]) {
    if (!isSearching) return true;
    return fields.some((field) => field?.toLowerCase().includes(query));
  }

  /**
   * One request per keystroke, with the previous one aborted as the next goes
   * out. Aborting is what keeps the results honest: without it a slow early
   * request can land after a faster later one and overwrite newer results with
   * stale rows. Same shape as the attendee search.
   */
  useEffect(() => {
    abortRef.current?.abort();

    const trimmed = term.trim();
    const searchesInDatabase = tab === "events" || tab === "sales";
    if (!trimmed || !searchesInDatabase) {
      setEventRows(null);
      setSaleRows(null);
      setIsSearchLoading(false);
      return;
    }

    const token = session?.user.accessToken;
    if (!token) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearchLoading(true);

    // Searching deliberately ignores the status pill so it runs against every
    // record, not just the ones the current filter admits.
    const endpoint =
      tab === "events"
        ? `/admin/events?status=all&limit=50&search=${encodeURIComponent(trimmed)}`
        : `/admin/sales?status=ALL&limit=50&search=${encodeURIComponent(trimmed)}`;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((response) => {
        if (tab === "events") setEventRows(response?.events?.data ?? []);
        else setSaleRows(response?.sales?.data ?? []);
        setIsSearchLoading(false);
      })
      .catch((error) => {
        // An aborted request was replaced by a newer one; it owns the state now.
        if (error?.name === "AbortError") return;
        if (tab === "events") setEventRows([]);
        else setSaleRows([]);
        setIsSearchLoading(false);
      });

    return () => controller.abort();
  }, [term, tab, session?.user.accessToken]);

  /**
   * Picking a status ends the search — the two are alternative ways of choosing
   * rows, and leaving a stale term in the box would misdescribe what is listed.
   */
  function handleEventStatusChange(value: StatusFilter) {
    abortRef.current?.abort();
    setTerm("");
    setEventRows(null);
    setIsSearchLoading(false);
    setIsLoading(true);
    router.push(`/activities?status=${value}`);
  }

  const filteredEvents = eventRows ?? eventData;

  const filteredRaffles = raffles
    .filter(
      (raffle) => raffleStatus === "all" || raffle.adminStatus === raffleStatus,
    )
    .filter((raffle) => matches(raffle.title));

  const filteredRestaurants = restaurants
    .filter(
      (r) => restaurantStatus === "all" || r.adminStatus === restaurantStatus,
    )
    .filter((r) => matches(r.name, r.city));

  /**
   * Sales carry lifecycle and review in one status, so they cannot share the
   * approved/rejected/review filter the other three use. `pending_review` leads
   * because it is the only value that is somebody's job.
   */
  // A search already ran against every product in the database, so the status
  // pill does not get a second say over its results.
  const filteredSales =
    saleRows ??
    sales.filter((sale) => saleStatus === "all" || sale.status === saleStatus);

  const pendingSaleCount = sales.filter(
    (sale) => sale.status === "pending_review",
  ).length;

  return (
    <div className={`${PAGE_SCROLLER} overflow-x-hidden min-w-0`}>
      <PageLoader isLoading={isLoading} />
      <PageTitle>{t("title")}</PageTitle>
      <div
        className={
          "grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <div className={"pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("total")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {allEvents.length}
          </p>
        </div>
        <div className={"pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("active")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {
              allEvents.filter((event) => event.adminStatus === "approved")
                .length
            }
          </p>
        </div>
        <div className={"pl-0 lg:pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("suspended")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {
              allEvents.filter((event) => event.adminStatus === "rejected")
                .length
            }
          </p>
        </div>

        {/* Was a second "suspended" tile hardcoded to 0. Reused for the review
            queue: edits leave adminStatus alone, so this count is the only
            at-a-glance signal that work is waiting — and the way into it. */}
        <div
          className={"pl-0 lg:pl-10 cursor-pointer"}
          onClick={() => router.push("/activities/revisions")}
        >
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("pending_edits")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {allEvents.filter((event) => event.pendingReviewAt).length}
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="gap-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between min-w-0">
          <h4 className="font-medium inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
            {t("list.title")}
          </h4>
          {/* Two pills on one row, search on the next. Both rows go full
              width on mobile so neither can push the other out of the page. */}
          <div className="flex flex-col gap-4 w-full lg:w-auto min-w-0">
            <div className="flex flex-row items-center gap-4 w-full lg:w-auto min-w-0">
              <ActivityTypeSelect
                value={tab}
                onChange={handleTabChange}
                pendingSaleCount={pendingSaleCount}
                labels={{
                  events: t("filters.type.events"),
                  raffles: t("filters.type.raffles"),
                  restaurants: t("filters.type.restaurants"),
                  sales: t("filters.type.sales"),
                }}
              />
              {tab === "events" ? (
                <StatusFilterSelect
                  value={(status as StatusFilter) ?? "all"}
                  onChange={handleEventStatusChange}
                  allLabel={t("filters.all.events")}
                />
              ) : tab === "restaurants" ? (
                <StatusFilterSelect
                  value={restaurantStatus}
                  onChange={setRestaurantStatus}
                  allLabel={t("filters.all.restaurants")}
                />
              ) : tab === "sales" ? (
                <SaleStatusFilterSelect
                  value={saleStatus}
                  onChange={setSaleStatus}
                  allLabel={t("filters.all.sales")}
                />
              ) : (
                <StatusFilterSelect
                  value={raffleStatus}
                  onChange={setRaffleStatus}
                  allLabel={t("filters.all.raffles")}
                />
              )}
            </div>
            <SearchInput
              value={term}
              onChange={setTerm}
              placeholder={t(`filters.search.${tab}`)}
              className="lg:w-full"
            />
          </div>
        </div>

        {/* The results area owns the search loader so the heading, stat tiles
            and filters stay usable while a query is in flight. */}
        <div className="relative min-h-40">
          {isSearchLoading && (
            <div className="absolute inset-0 z-10 flex items-start justify-center pt-20 bg-white/70">
              <LoadingCircleSmall />
            </div>
          )}

          {/* Events tab */}
          <TabsContent value="events" className="flex flex-col gap-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.name")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.organizer")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.start")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.sold")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.status")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.created")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredEvents.map((event) => {
                  const firstDay = event.eventDays?.find(
                    (day) => day.dayNumber === 1,
                  );
                  return (
                    <TableRow
                      key={event.eventId}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/activities/${event.eventId}`)
                      }
                    >
                      <TableCell
                        className={
                          "text-[1.5rem] py-6 leading-8 text-neutral-900"
                        }
                      >
                        <ActivityName name={event.eventName} />
                      </TableCell>
                      <TableCell
                        className={
                          "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                        }
                      >
                        <ActivityName
                          name={event.organisation?.organisationName ?? "-"}
                        />
                      </TableCell>
                      <TableCell
                        className={
                          "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                        }
                      >
                        {firstDay &&
                          `${formatDate(firstDay.eventDate, locale, "local")} - ${formatTime(firstDay.startTime, firstDay.timezone, locale)}`}
                      </TableCell>
                      <TableCell
                        className={
                          "text-[1.5rem] font-medium hidden lg:table-cell leading-8 text-neutral-900"
                        }
                      >
                        <span className={"cursor-pointer py-6"}>
                          {event.tickets?.length ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={event.adminStatus} />
                          {event.pendingReviewAt && (
                            <PendingEditBadge
                              fields={event.pendingReviewReason}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={
                          "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                        }
                      >
                        {formatDate(event.createdAt, locale, "local")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredEvents.length === 0 && (
              <EmptyState
                message={
                  isSearching ? t("list.noResults") : t("list.noActivities")
                }
              />
            )}
          </TabsContent>

          {/* Raffles tab */}
          <TabsContent value="raffles" className="flex flex-col gap-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.name")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.start")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    Draw date
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.status")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.created")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRaffles.map((raffle) => {
                  return (
                    <TableRow
                      key={raffle.raffleId}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/activities/raffle/${raffle.raffleId}`)
                      }
                    >
                      <TableCell
                        className={
                          "text-[1.5rem] py-6 leading-8 text-neutral-900"
                        }
                      >
                        <ActivityName name={raffle.title} />
                      </TableCell>
                      <TableCell
                        className={
                          "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                        }
                      >
                        {formatDate(raffle.salesStartAt, locale, "local")}
                      </TableCell>
                      <TableCell
                        className={
                          "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                        }
                      >
                        {formatDate(raffle.drawAt, locale, "local")}
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={raffle.adminStatus} />
                          {raffle.pendingReviewAt && (
                            <PendingEditBadge
                              fields={raffle.pendingReviewReason}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={
                          "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                        }
                      >
                        {formatDate(raffle.createdAt, locale, "local")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredRaffles.length === 0 && (
              <EmptyState
                message={
                  isSearching ? t("list.noResults") : t("list.noActivities")
                }
              />
            )}
          </TabsContent>

          {/* Bar & Restaurant tab. A venue never ends, so instead of dates the
            useful columns are where it is and whether it is actually live —
            which needs suspension, not just review status. */}
          <TabsContent value="restaurants" className="flex flex-col gap-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.name")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    City
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    Type
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.status")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.created")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRestaurants.map((restaurant) => {
                  return (
                    <TableRow
                      key={restaurant.restaurantId}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/activities/restaurant/${restaurant.restaurantId}`,
                        )
                      }
                    >
                      <TableCell
                        className={
                          "text-[1.5rem] py-6 leading-8 text-neutral-900"
                        }
                      >
                        <ActivityName name={restaurant.name} />
                      </TableCell>
                      <TableCell
                        className={
                          "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                        }
                      >
                        {restaurant.city}
                      </TableCell>
                      <TableCell
                        className={
                          "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900 capitalize"
                        }
                      >
                        {restaurant.establishmentType.replace("_", " ")}
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={restaurant.adminStatus} />
                          {restaurant.suspendedAt && (
                            <span className="text-failure text-[1.1rem] font-bold uppercase">
                              Suspended
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={
                          "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                        }
                      >
                        {formatDate(restaurant.createdAt, locale, "local")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredRestaurants.length === 0 && (
              <EmptyState
                message={
                  isSearching ? t("list.noResults") : t("list.noActivities")
                }
              />
            )}
          </TabsContent>

          {/* Products tab */}
          <TabsContent value="sales" className="flex flex-col gap-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.name")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    Seller
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    Price
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.status")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("list.table.created")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow
                    key={sale.saleId}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/activities/sale/${sale.saleId}`)
                    }
                  >
                    <TableCell
                      className={
                        "text-[1.5rem] py-6 leading-8 text-neutral-900"
                      }
                    >
                      <ActivityName name={sale.title} />
                    </TableCell>
                    <TableCell
                      className={
                        "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                      }
                    >
                      <ActivityName
                        name={sale.organisation?.organisationName ?? "-"}
                      />
                    </TableCell>
                    <TableCell
                      className={
                        "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                      }
                    >
                      {formatMoney(sale.price, sale.currencyCode, locale)}
                    </TableCell>
                    <TableCell className="py-6">
                      <SaleStatusBadge status={sale.status} />
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                      }
                    >
                      {formatDate(sale.createdAt, locale, "local")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredSales.length === 0 && (
              <EmptyState
                message={
                  isSearching ? t("list.noResults") : t("list.noActivities")
                }
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
