"use client";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";
import { Order, OrganisationTicket } from "@ticketwaze/typescript-config";
import { useLocale, useTranslations } from "next-intl";
import { Separator } from "../FinancePageContent";
import { ButtonAccent } from "@/components/shared/buttons";

export default function OrdersInformations({
  tickets,
  order,
}: {
  tickets: OrganisationTicket[];
  order: Order;
}) {
  const t = useTranslations("Finance");
  const locale = useLocale();
  return (
    <DrawerContent className={"my-6 p-12 rounded-[30px] w-full"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-16"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-12 text-black"
            }
          >
            Transaction Details
          </span>
        </DrawerTitle>
        <DrawerDescription asChild className="w-full">
          <div>
            <div className={"w-full flex flex-col gap-8"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("transactions.details.event_name")}{" "}
                <span
                  className={"text-deep-100 truncate font-medium leading-8"}
                >
                  {tickets[0].event.eventName}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("transactions.details.date")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {formatDate(
                    tickets[0].event.eventDays.filter(
                      (day) => day.dayNumber === 1,
                    )[0].eventDate,
                    locale,
                    tickets[0].event.eventDays.filter(
                      (day) => day.dayNumber === 1,
                    )[0].timezone,
                  )}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("transactions.details.time")}{" "}
                <span
                  className={"text-deep-100 truncate font-medium leading-8"}
                >
                  {formatTime(
                    tickets[0].event.eventDays.filter(
                      (day) => day.dayNumber === 1,
                    )[0].startTime,
                    tickets[0].event.eventDays.filter(
                      (day) => day.dayNumber === 1,
                    )[0].timezone,
                    locale,
                  )}{" "}
                  -{" "}
                  {formatTime(
                    tickets[0].event.eventDays.filter(
                      (day) => day.dayNumber === 1,
                    )[0].endTime,
                    tickets[0].event.eventDays.filter(
                      (day) => day.dayNumber === 1,
                    )[0].timezone,
                    locale,
                  )}
                </span>
              </p>
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("transactions.details.price")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {tickets[0].event.currency === "USD"
                    ? tickets.reduce((sum, t) => sum + Number(t.ticketUsdPrice), 0)
                    : tickets.reduce((sum, t) => sum + Number(t.ticketPrice), 0)}{" "}
                  {tickets[0].event.currency}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center truncate text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("transactions.table.id")}
                <span
                  className={"text-primary-500 font-bold truncate leading-8"}
                >
                  {order.orderName}
                </span>
              </p>
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8"}>
              {order.provider !== "free" && (
                <p
                  className={
                    "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                  }
                >
                  {t("transactions.details.payment_method")}{" "}
                  <span className={"text-deep-100 font-medium leading-8"}>
                    {order.provider}
                  </span>
                </p>
              )}
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("transactions.details.payment_date")}{" "}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {formatDate(order.createdAt, locale, "local")}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-start text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("transactions.details.transaction_status")}{" "}
                <span
                  className={
                    "text-deep-100 font-medium leading-8 max-w-[39.9rem] text-right"
                  }
                >
                  <span
                    className={`py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase ${order.status === "SUCCESSFUL" && "text-[#349C2E]"} ${order.status === "FAILED" && "text-warning"} ${order.status === "RETURNED" && "text-failure"}  px-2 rounded-[30px] bg-[#f5f5f5]`}
                  >
                    {order.status === "SUCCESSFUL" && t("filters.successful")}
                    {order.status === "RETURNED" && t("filters.returned")}
                    {order.status === "PENDING" && t("filters.pending")}
                  </span>
                </span>
              </p>
            </div>
            <Separator />
            <ul className={"w-full flex flex-col gap-8"}>
              {tickets.map((ticket) => {
                return (
                  <li
                    key={ticket.ticketId}
                    className={"w-full flex flex-col gap-8"}
                  >
                    <p
                      className={
                        "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                      }
                    >
                      {ticket.fullName}
                      <span className={"text-deep-100 font-medium leading-8"}>
                        1X - {ticket.ticketType}{" "}
                        <span className="text-neutral-500">|</span>{" "}
                        {ticket.event.currency === "USD"
                          ? ticket.ticketUsdPrice
                          : ticket.ticketPrice}{" "}
                        {ticket.event.currency}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </DrawerDescription>
      </div>

      <DrawerFooter>
        <div className={"flex gap-8"}>
          <DrawerClose asChild className={"flex-1 cursor-pointer"}>
            <ButtonAccent className={"w-full"}>
              {t("transactions.details.close")}
            </ButtonAccent>
          </DrawerClose>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
