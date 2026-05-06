"use client";
import { ButtonAccent } from "@/components/shared/buttons";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import formatDate from "@/lib/FormatDate";
import { WithdrawalRequest } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";

export default function WithdrawalInformations({
  request,
}: {
  request: WithdrawalRequest;
}) {
  const t = useTranslations("Finance");
  const locale = useLocale();
  const { data: session } = useSession();
  const currentOrganisation = session?.activeOrganisation;
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
                {t("withdrawal.table.id")}
                <span
                  className={"text-deep-100 truncate font-medium leading-8"}
                >
                  {request.withdrawalRequestId}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("withdrawal.table.name")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {request.bankName}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("withdrawal.table.accountName")}
                <span
                  className={"text-deep-100 truncate font-medium leading-8"}
                >
                  {request.accountName}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("withdrawal.table.account")}
                <span
                  className={"text-deep-100 truncate font-medium leading-8"}
                >
                  {request.accountNumber}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("withdrawal.table.amount")}
                <span
                  className={"text-deep-100 truncate font-medium leading-8"}
                >
                  {currentOrganisation?.currency === "USD"
                    ? request.usdAmount
                    : request.amount}{" "}
                  {currentOrganisation?.currency}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("withdrawal.table.status")}
                {request.status.toUpperCase() === "SUCCESSFUL" && (
                  <span
                    className={
                      "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-4 rounded-[30px] bg-[#349C2E]/20"
                    }
                  >
                    {t("filters.successful")}
                  </span>
                )}
                {request.status.toUpperCase() === "PENDING" && (
                  <span
                    className={
                      "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EA961C]  px-4 rounded-[30px] bg-[#EA961C]/20"
                    }
                  >
                    {t("filters.pending")}
                  </span>
                )}
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("withdrawal.table.date")}
                <span
                  className={"text-deep-100 truncate font-medium leading-8"}
                >
                  {formatDate(request.createdAt, locale, "local")}
                </span>
              </p>
            </div>
            {/* <div className={"w-full flex flex-col gap-8"}>
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
                  {FormatDate(order.createdAt, locale, "local")}
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
            </div> */}
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
