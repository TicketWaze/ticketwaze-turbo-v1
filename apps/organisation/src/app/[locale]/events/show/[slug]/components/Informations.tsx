"use client";
import FormatDate from "@/lib/FormatDate";
import { Order, OrganisationTicket } from "@ticketwaze/typescript-config";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslations } from "next-intl";
import React from "react";
import Separator from "@/components/shared/Separator";
import { ButtonAccent } from "@/components/shared/buttons";

export default function Informations({
  ticket,
  order,
}: {
  ticket: OrganisationTicket;
  order: Order;
}) {
  const t = useTranslations("Finance");
  const checkingTime = new Date(ticket.updatedAt.toString());
  return (
    <DrawerContent className={"my-6 p-[30px] rounded-[30px] w-full"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-[40px]"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black"
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
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.name")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {ticket.fullName}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.email")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {ticket.email}
                </span>
              </p>
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.event_name")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {ticket.event.eventName}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.date")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {FormatDate(ticket.event.eventDays[0]?.startDate ?? "")}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.time")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {ticket.event.eventDays[0]?.startDate} -{" "}
                  {ticket.event.eventDays[0]?.endTime}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-start text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.location")}{" "}
                <span
                  className={
                    "text-deep-100 font-medium leading-[20px] max-w-[399px] text-right"
                  }
                >
                  {ticket.event.address}
                </span>
              </p>
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.ticket_class")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  1X{" "}
                  <span
                    className={`py-[3px] px-[5px] bg-[#f5f5f5] ${ticket.ticketType.toUpperCase() === "GENERAL" && "text-[#EF1870]"} ${ticket.ticketType.toUpperCase() === "VIP" && "text-[#7A19C7]"} ${ticket.ticketType.toUpperCase() === "VVIP" && "text-deep-100"} rounded-[30px]`}
                  >
                    {ticket.ticketType.toUpperCase()}
                  </span>
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.price")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {ticket.event.currency === "USD"
                    ? ticket.ticketUsdPrice
                    : ticket.ticketPrice}{" "}
                  {ticket.event.currency}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.ticket_id")}{" "}
                <span className={"text-primary-500 font-bold leading-[20px]"}>
                  {ticket.ticketName}
                </span>
              </p>
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8"}>
              {/* <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.payment_method")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {order.provider}
                </span>
              </p> */}
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.payment_date")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {FormatDate(order.createdAt)}
                </span>
              </p>
              {/* <p
              className={
                'flex justify-between items-start text-[1.4rem] leading-[20px] text-neutral-600'
              }
            >
              {t('transactions.details.transaction_status')}{' '}
              <span className={'text-deep-100 font-medium leading-[20px] max-w-[399px] text-right'}>
                <span
                  className={
                    'py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]'
                  }
                >
                  {t('filters.successful')}
                </span>
              </span>
            </p> */}
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.check_status")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  <span
                    className={`py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase ${ticket.status === "CHECKED" ? "text-success" : "text-warning"} px-[5px] rounded-[30px] bg-[#f5f5f5]`}
                  >
                    {ticket.status}
                  </span>
                </span>
              </p>
              {ticket.status === "CHECKED" && (
                <p
                  className={
                    "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                  }
                >
                  {t("transactions.details.check_time")}{" "}
                  <span className={"text-deep-100 font-medium leading-[20px]"}>
                    {checkingTime.toTimeString()}
                  </span>
                </p>
              )}
              <div></div>
            </div>
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
          {/* <ButtonPrimary className={"flex-1"}>
            {t("transactions.details.resend")}
          </ButtonPrimary> */}
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
