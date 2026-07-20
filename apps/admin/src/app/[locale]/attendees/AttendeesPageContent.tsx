"use client";
import AdminLayout from "@/components/Layouts/AdminLayout";
import AttendeesPageTopbar from "./AttendeesPageTopbar";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import User from "@ticketwaze/ui/assets/icons/user-square.svg";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AdminAttendeesRequest,
  AdminAttendeeStats,
  AdminUser,
} from "@ticketwaze/typescript-config";
import formatDate from "@/lib/FormatDate";
import { useState, useEffect, useRef } from "react";
import PageLoader from "@/components/PageLoader";
import SearchInput from "@/components/shared/SearchInput";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function AttendeesPageContent({
  users,
  stats,
  status,
  period,
  search,
}: {
  users: AdminAttendeesRequest;
  stats: AdminAttendeeStats;
  status?: string;
  period?: string;
  search?: string;
}) {
  const t = useTranslations("Attendees");
  const locale = useLocale();
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
  const [searchRows, setSearchRows] = useState<AdminUser[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isSearchActive = term.trim().length > 0;
  const data = searchRows ?? users.data;

  useEffect(() => {
    setIsLoading(false);
  }, [status, period, search]);

  /**
   * One request per keystroke, with the previous one aborted as the next goes
   * out. Aborting is what keeps the results honest: without it a slow early
   * request can land after a faster later one and overwrite the newer results
   * with stale rows.
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
    const params = new URLSearchParams({ search: trimmed, limit: "50" });

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/attendees?${params.toString()}`,
      {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then((response) => response.json())
      .then((response) => {
        setSearchRows(response?.users?.data ?? []);
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

  /**
   * Picking a filter ends the search — the two are alternative ways of choosing
   * rows, and leaving a stale term in the box would misdescribe what is listed.
   *
   * The push goes to `pathname` rather than a hardcoded "/attendees" so the
   * locale segment already in the URL survives the navigation.
   */
  const navigate = (params: URLSearchParams) => {
    abortRef.current?.abort();
    setTerm("");
    setSearchRows(null);
    setIsSearching(false);
    setIsLoading(true);
    router.push(`${pathname}?${params.toString()}`);
  };

  function handleStatusChange(value: string) {
    const params = new URLSearchParams();
    if (value !== "all") params.set("status", value);
    if (period) params.set("period", period);
    navigate(params);
  }

  function handlePeriodChange(value: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (value !== "all_period") params.set("period", value);
    navigate(params);
  }

  return (
    <AdminLayout>
      <PageLoader isLoading={isLoading} />
      <AttendeesPageTopbar
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
              "flex justify-between text-[14px] text-neutral-600 leading-8 pb-2"
            }
          >
            {t("total")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.total.toLocaleString()}
          </p>
        </div>
        <div className={"pl-10"}>
          <span
            className={
              "flex justify-between text-[14px] text-neutral-600 leading-8 pb-2"
            }
          >
            {t("active")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.active.toLocaleString()}
          </p>
        </div>
        <div className={"pl-0 lg:pl-10"}>
          <span
            className={
              "flex justify-between text-[14px] text-neutral-600 leading-8 pb-2"
            }
          >
            {t("guest")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.guest.toLocaleString()}
          </p>
        </div>
      </div>
      {/* The list scrolls inside the page rather than the page itself, so the
          topbar and the stat tiles stay put. Same wrapper as the payments and
          tickets tables. */}
      <div className="flex flex-col gap-8 overflow-scroll h-full">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
            <h4 className="font-medium inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
              {t("attendees_list.title")}
            </h4>
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
              <SearchInput
                value={term}
                onChange={setTerm}
                placeholder={t("filters.search")}
              />
              <div className="flex flex-row gap-4 w-full lg:w-auto">
                {/* Controlled, not defaultValue: a search runs against every record,
              so while one is active the pills have to show that no status or
              period narrowing is in effect. */}
                <Select
                  value={isSearchActive ? "all" : (status ?? "all")}
                  onValueChange={handleStatusChange}
                >
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
                        value="active"
                      >
                        {t("filters.status_active")}
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="suspended"
                      >
                        {t("filters.status_suspended")}
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
                    {t("attendees_list.table.name")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("attendees_list.table.email")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("attendees_list.table.activity_count")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("attendees_list.table.status")}
                  </TableHead>
                  <TableHead
                    className={
                      "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                    }
                  >
                    {t("attendees_list.table.joined")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              {data.length > 0 ? (
                <TableBody>
                  {data.map((attendee) => (
                    <TableRow
                      key={attendee.userId}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/attendees/${attendee.userId}`)
                      }
                    >
                      <TableCell
                        className={
                          "text-[1.5rem] py-6 leading-8 text-neutral-900"
                        }
                      >
                        <span className={"cursor-pointer"}>
                          {attendee.firstName} {attendee.lastName}
                        </span>
                      </TableCell>
                      <TableCell
                        className={
                          "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                        }
                      >
                        <span className={"cursor-pointer"}>
                          {attendee.email}
                        </span>
                      </TableCell>
                      <TableCell
                        className={
                          "text-[1.5rem] font-medium leading-8 text-neutral-900"
                        }
                      >
                        {attendee.userAnalytic?.eventAttended ?? 0}
                      </TableCell>
                      <TableCell
                        className={
                          "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                        }
                      >
                        {attendee.isSuspended ? (
                          <span className="py-[0.3rem] px-2 bg-neutral-100 text-failure font-bold rounded-[30px] text-[11px]">
                            {t("attendees_list.status.suspended")}
                          </span>
                        ) : attendee.isVerified ? (
                          <span className="py-[0.3rem] px-2 bg-neutral-100 text-success font-bold rounded-[30px] text-[11px]">
                            {t("attendees_list.status.active")}
                          </span>
                        ) : (
                          <span className="py-[0.3rem] px-2 bg-neutral-100 text-warning font-bold rounded-[30px] text-[11px]">
                            {t("attendees_list.status.pending")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={
                          "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                        }
                      >
                        {formatDate(attendee.createdAt, locale, "local")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              ) : null}
            </Table>
            {/* An empty search is not an empty system: the "no attendees"
          illustration would be wrong while a query is narrowing the list. */}
            {data.length === 0 &&
              !isSearching &&
              (isSearchActive ? (
                <p className="text-[1.8rem] text-neutral-600 leading-10 text-center mt-16">
                  {t("attendees_list.no_results", { term: term.trim() })}
                </p>
              ) : (
                <div className="flex flex-col w-fit gap-12 items-center mt-8 self-center">
                  <div className="rounded-full bg-neutral-100 p-6 w-fit">
                    <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
                      <Image
                        src={User}
                        alt="no attendee history"
                        width={50}
                        height={50}
                      />
                    </div>
                  </div>
                  <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
                    {t("attendees_list.no_history")}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div></div>
    </AdminLayout>
  );
}
