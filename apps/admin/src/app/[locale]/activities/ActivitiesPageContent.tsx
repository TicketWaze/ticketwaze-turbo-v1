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
import { AdminEventsRequest, Event } from "@ticketwaze/typescript-config";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import { useEffect, useState } from "react";
import PageLoader from "@/components/PageLoader";
import Image from "next/image";
import MoneySend from "@ticketwaze/ui/assets/icons/money-send.svg";

export default function ActivitiesPageContent({
  events,
  status,
  allEvents,
}: {
  events: AdminEventsRequest;
  status: string;
  allEvents: Event[];
}) {
  const t = useTranslations("Activities");
  const locale = useLocale();
  const router = useRouter();
  const data = events.data;
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(false);
  }, [status]);
  function handleStatusChange(value: string) {
    setIsLoading(true);
    router.push(`/activities?status=${value}`);
  }
  return (
    <>
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

        <div className={"pl-0 lg:pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("suspended")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            0
          </p>
        </div>
      </div>
      <div className="flex justify-between">
        <h4 className="font-medium inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
          {t("list.title")}
        </h4>
        <div className="flex gap-4">
          <Select
            defaultValue="requested"
            onValueChange={(e) => handleStatusChange(e)}
          >
            <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
              <SelectGroup>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="requested"
                >
                  Requested
                </SelectItem>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="review"
                >
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
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select defaultValue="all_period">
            <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
              <SelectGroup>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="all_period"
                >
                  {t("filters.list.period")}
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
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
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
          {data.map((event) => {
            return (
              <TableRow
                key={event.eventId}
                className="cursor-pointer"
                onClick={() => router.push(`/activities/${event.eventId}`)}
              >
                <TableCell
                  className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
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
                    {event.organisation.organisationName}
                  </span>
                </TableCell>
                <TableCell
                  className={
                    "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                  }
                >
                  {formatDate(
                    event.eventDays.filter((day) => day.dayNumber === 1)[0]
                      .eventDate,
                    locale,
                    "local",
                  )}{" "}
                  -{" "}
                  {formatTime(
                    event.eventDays.filter((day) => day.dayNumber === 1)[0]
                      .startTime,
                    event.eventDays.filter((day) => day.dayNumber === 1)[0]
                      .timezone,
                    locale,
                  )}
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] font-medium leading-8 text-neutral-900"
                  }
                >
                  <span className={"cursor-pointer py-6"}>
                    {event.tickets.length}
                  </span>
                </TableCell>
                <TableCell className="py-6">
                  {event.adminStatus === "requested" && (
                    <span
                      className={
                        "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-black  px-2 rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      requested
                    </span>
                  )}
                  {event.adminStatus === "approved" && (
                    <span
                      className={
                        "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      approved
                    </span>
                  )}
                  {event.adminStatus === "review" && (
                    <span
                      className={
                        "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-warning  px-2 rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      review
                    </span>
                  )}
                  {event.adminStatus === "rejected" && (
                    <span
                      className={
                        "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-failure  px-2 rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      rejected
                    </span>
                  )}
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
      {data.length === 0 && (
        <div className="flex flex-col w-fit  gap-12 items-center mt-8 self-center">
          <div className="rounded-full bg-neutral-100 p-6 w-fit">
            <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
              <Image src={MoneySend} alt="No Events" width={50} height={50} />
            </div>
          </div>
          <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
            {t("list.noActivities")}
          </p>
        </div>
      )}
    </>
  );
}
