/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useLocale, useTranslations } from "next-intl";
import ActivitiesPageTopbar from "./ActivitiesPageTopbar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Event, Raffle, Restaurant, Sale } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { SaleStatusBadge } from "./sale/[id]/components/SaleStatusDialog";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import { useEffect, useState } from "react";
import PageLoader from "@/components/PageLoader";
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

function StatusFilterSelect({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}) {
  return (
    <Select value={value} onValueChange={(e) => onChange(e as StatusFilter)}>
      <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
        <SelectGroup>
          <SelectItem className={"text-[1.4rem] text-deep-100"} value="all">
            All
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
          <SelectItem className={"text-[1.4rem] text-deep-100"} value="approved">
            Approved
          </SelectItem>
          <SelectItem className={"text-[1.4rem] text-deep-100"} value="rejected">
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
}: {
  value: SaleStatusFilter;
  onChange: (value: SaleStatusFilter) => void;
}) {
  const options: { value: SaleStatusFilter; label: string }[] = [
    { value: "all", label: "All" },
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
      <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
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
  raffles = [],
  restaurants = [],
  sales = [],
}: {
  eventData: Event[];
  allEvents: Event[];
  status: string;
  raffles?: Raffle[];
  restaurants?: Restaurant[];
  sales?: Sale[];
}) {
  const t = useTranslations("Activities");
  const locale = useLocale();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState("events");
  const [raffleStatus, setRaffleStatus] = useState<StatusFilter>("all");
  const [restaurantStatus, setRestaurantStatus] = useState<StatusFilter>("all");
  const [saleStatus, setSaleStatus] = useState<SaleStatusFilter>("all");

  useEffect(() => {
    setIsLoading(false);
  }, [status]);

  // Events are filtered server-side (hydrated rows), so a status change
  // re-fetches through the URL. Raffles are filtered client-side for now.
  function handleEventStatusChange(value: StatusFilter) {
    setIsLoading(true);
    router.push(`/activities?status=${value}`);
  }

  const filteredRaffles =
    raffleStatus === "all"
      ? raffles
      : raffles.filter((raffle) => raffle.adminStatus === raffleStatus);

  const filteredRestaurants =
    restaurantStatus === "all"
      ? restaurants
      : restaurants.filter((r) => r.adminStatus === restaurantStatus);

  /**
   * Sales carry lifecycle and review in one status, so they cannot share the
   * approved/rejected/review filter the other three use. `pending_review` leads
   * because it is the only value that is somebody's job.
   */
  const filteredSales =
    saleStatus === "all"
      ? sales
      : sales.filter((sale) => sale.status === saleStatus);

  const pendingSaleCount = sales.filter(
    (sale) => sale.status === "pending_review",
  ).length;

  return (
    <div className="overflow-y-scroll flex flex-col gap-8">
      <PageLoader isLoading={isLoading} />
      <ActivitiesPageTopbar
        title={t("title")}
        filter={t("filters.period.actual")}
      />
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
            {allEvents.filter((event) => event.adminStatus === "approved")
              .length}
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
            {allEvents.filter((event) => event.adminStatus === "rejected")
              .length}
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

      <Tabs value={tab} onValueChange={setTab} className="gap-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <h4 className="font-medium inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
            {t("list.title")}
          </h4>
          <div className="flex items-center gap-4">
            <TabsList>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="raffles">Raffles</TabsTrigger>
              <TabsTrigger value="restaurants">Bar & Restaurant</TabsTrigger>
              {/* The count is the point of the tab: approval is the only way a
                  product goes on sale, so an unattended queue is sellers
                  waiting with no other route forward. */}
              <TabsTrigger value="sales">
                Products
                {pendingSaleCount > 0 && (
                  <span className="ml-2 rounded-[30px] bg-[#FEF3E2] px-2 py-[0.1rem] text-[1.1rem] font-bold text-[#EA961C]">
                    {pendingSaleCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            {tab === "events" ? (
              <StatusFilterSelect
                value={(status as StatusFilter) ?? "all"}
                onChange={handleEventStatusChange}
              />
            ) : tab === "restaurants" ? (
              <StatusFilterSelect
                value={restaurantStatus}
                onChange={setRestaurantStatus}
              />
            ) : tab === "sales" ? (
              <SaleStatusFilterSelect
                value={saleStatus}
                onChange={setSaleStatus}
              />
            ) : (
              <StatusFilterSelect
                value={raffleStatus}
                onChange={setRaffleStatus}
              />
            )}
          </div>
        </div>

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
              {eventData.map((event) => {
                const firstDay = event.eventDays?.find(
                  (day) => day.dayNumber === 1,
                );
                return (
                  <TableRow
                    key={event.eventId}
                    className="cursor-pointer"
                    onClick={() => router.push(`/activities/${event.eventId}`)}
                  >
                    <TableCell
                      className={
                        "text-[1.5rem] py-6 leading-8 text-neutral-900"
                      }
                    >
                      <span className={"cursor-pointer truncate"}>
                        {event.eventName}
                      </span>
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                      }
                    >
                      <span className={"cursor-pointer"}>
                        {event.organisation?.organisationName}
                      </span>
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
          {eventData.length === 0 && (
            <EmptyState message={t("list.noActivities")} />
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
                      <span className={"truncate"}>{raffle.title}</span>
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
            <EmptyState message={t("list.noActivities")} />
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
                      className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                    >
                      <span className={"truncate"}>{restaurant.name}</span>
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
            <EmptyState message={t("list.noActivities")} />
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
                  onClick={() => router.push(`/activities/sale/${sale.saleId}`)}
                >
                  <TableCell
                    className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                  >
                    <span className={"truncate"}>{sale.title}</span>
                  </TableCell>
                  <TableCell
                    className={
                      "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                    }
                  >
                    {sale.organisation?.organisationName ?? "-"}
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
            <EmptyState message={t("list.noActivities")} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
