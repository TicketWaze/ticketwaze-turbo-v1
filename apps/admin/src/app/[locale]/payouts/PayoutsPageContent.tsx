/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import PayoutsPageTopbar from "./PayoutsPageTopbar";
import { useLocale, useTranslations } from "next-intl";
import MoneySend from "@ticketwaze/ui/assets/icons/money-send.svg";
import ArrowUp from "@ticketwaze/ui/assets/icons/arrow-up.svg";
import ArrowRight from "@ticketwaze/ui/assets/icons/arrow-right.svg";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import Image from "next/image";
import WithdrawalDetails from "./WithdrawalDetails";
import { OrganisationWithdrawalRequest } from "@ticketwaze/typescript-config";
import { useEffect, useState } from "react";
import PageLoader from "@/components/PageLoader";
import { Link } from "@/i18n/navigation";
import formatDate from "@/lib/FormatDate";

export default function PayoutsPageContent({
  requests,
  status,
}: {
  requests: OrganisationWithdrawalRequest;
  status: string;
}) {
  const t = useTranslations("Payouts");
  const locale = useLocale();
  const router = useRouter();
  const history = false;
  const payoutRequests = requests.data;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [status]);

  function goToPayoutPage(id: string) {
    setIsLoading(true);
    router.push(`/payouts/${id}`);
  }
  function handleStatusChange(value: string) {
    setIsLoading(true);
    router.push(`/payouts?status=${value}`);
  }
  return (
    <>
      <PageLoader isLoading={isLoading} />
      <PayoutsPageTopbar
        title={t("title")}
        filter={t("filters.period.actual")}
      />
      <div
        className={
          "grid grid-cols-3 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <div className={"pb-12"}>
          <span
            className={
              "flex text-[14px] text-neutral-600 leading-8 pb-2 justify-between"
            }
          >
            {t("total")}
            <span className="flex text-success gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10">
              80%
              <Image src={ArrowUp} alt="arrow up" width={20} height={20} />
            </span>
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            20,553,758,125.90 <span className="text-neutral-600">HTG</span>
          </p>
        </div>
        <div className={"pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("pending")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {payoutRequests.length}
          </p>
        </div>
        <div className={"pl-0 lg:pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("total_paid")}
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
      <div className="flex flex-col gap-8  overflow-scroll h-full">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between">
            <h4 className="font-medium inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
              {t("payout_request.title")}
            </h4>
            <div className="flex gap-4">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                  <SelectGroup>
                    <SelectItem
                      className={"text-[1.4rem] text-deep-100"}
                      value="PENDING"
                    >
                      {t("payout_request.table.request_status.pending")}
                    </SelectItem>
                    <SelectItem
                      className={"text-[1.4rem] text-deep-100"}
                      value="FAILED"
                    >
                      {t("payout_request.table.request_status.failed")}
                    </SelectItem>
                    {/* <SelectItem
                      className={"text-[1.4rem] text-deep-100"}
                      value="SUCCESSFUL"
                    >
                      {t("payout_request.table.request_status.approved")}
                    </SelectItem> */}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {/* search */}
              {/* .......... */}
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
                  {t("payout_request.table.withdrawal_id")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("payout_request.table.bank_name")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("payout_request.table.account_number")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("payout_request.table.amount")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("payout_request.table.request_status.title")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("payout_request.table.date")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {payoutRequests.slice(0, 5).map((request) => {
                return (
                  <TableRow
                    key={request.withdrawalRequestId}
                    onClick={() => goToPayoutPage(request.withdrawalRequestId)}
                    className="cursor-pointer"
                  >
                    <TableCell
                      className={
                        "text-[1.5rem] py-6 leading-8 text-neutral-900"
                      }
                    >
                      <span className={"cursor-pointer"}>
                        {request.organisation.organisationName}
                      </span>
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                      }
                    >
                      <span className={"cursor-pointer"}>
                        {request.bankName}
                      </span>
                    </TableCell>
                    <TableCell
                      className={
                        "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                      }
                    >
                      {request.accountNumber}
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] font-medium leading-8 text-neutral-900"
                      }
                    >
                      <span className={"cursor-pointer py-6"}>
                        {request.organisation.currency === "HTG"
                          ? request.amount
                          : request.usdAmount}{" "}
                        {request.organisation.currency}
                      </span>
                    </TableCell>
                    <TableCell className="py-6">
                      {request.status === "SUCCESSFUL" && (
                        <span
                          className={
                            "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                          }
                        >
                          {t("payout_request.table.request_status.approved")}
                        </span>
                      )}

                      {request.status === "PENDING" && (
                        <span
                          className={
                            "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                          }
                        >
                          {t("payout_request.table.request_status.pending")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                      }
                    >
                      {formatDate(request.createdAt, locale, "local")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {payoutRequests.length === 0 && (
            <div className="flex flex-col w-fit  gap-12 items-center mt-8 self-center">
              <div className="rounded-full bg-neutral-100 p-6 w-fit">
                <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
                  <Image
                    src={MoneySend}
                    alt="no payout requests"
                    width={50}
                    height={50}
                  />
                </div>
              </div>
              <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
                {t("payout_request.no_request")}
              </p>
            </div>
          )}
          {payoutRequests.length > 5 && (
            <div className="w-full flex justify-between ">
              <div></div>
              <Link
                href={"/payouts/requests"}
                className="flex gap-8 text-primary-500 text-[1.5rem] leading-8 items-center justify-end"
              >
                {t("view_all")}
                <Image
                  src={ArrowRight}
                  alt="arrow right"
                  width={20}
                  height={20}
                />
              </Link>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex justify-between">
            <h4 className="font-medium inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
              {t("payout_history.title")}
            </h4>
            <div className="flex gap-4">
              <Select defaultValue="all">
                <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
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
                      value="Checked-In"
                    >
                      Checked-In
                    </SelectItem>
                    <SelectItem
                      className={"text-[1.4rem] text-deep-100"}
                      value="pending"
                    >
                      Pending
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {/* search */}
              {/* .......... */}
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
                  {t("payout_history.table.withdrawal_id")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("payout_history.table.bank_name")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("payout_history.table.account_number")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("payout_history.table.amount")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("payout_history.table.transaction_status.title")}
                </TableHead>
              </TableRow>
            </TableHeader>

            {history ? (
              <TableBody>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Drawer key={index} direction="right">
                    <DrawerTrigger asChild>
                      <TableRow className="cursor-pointer">
                        <TableCell
                          className={
                            "text-[1.5rem] py-6 leading-8 text-neutral-900"
                          }
                        >
                          <Drawer direction={"right"}>
                            <DrawerTrigger>
                              <span className={"cursor-pointer"}>
                                TXN23456789
                              </span>
                            </DrawerTrigger>
                          </Drawer>
                        </TableCell>
                        <TableCell
                          className={
                            "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                          }
                        >
                          <Drawer direction={"right"}>
                            <DrawerTrigger>
                              <span className={"cursor-pointer"}>Sogebank</span>
                            </DrawerTrigger>
                          </Drawer>
                        </TableCell>
                        <TableCell
                          className={
                            "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                          }
                        >
                          0123456789
                        </TableCell>
                        <TableCell
                          className={
                            "text-[1.5rem] font-medium leading-8 text-neutral-900"
                          }
                        >
                          <Drawer direction={"right"}>
                            <DrawerTrigger>
                              <span className={"cursor-pointer py-6"}>
                                {/* {session?.user.userPreference.currency === "USD"
                        ? `${order.usdPrice} USD`
                        : `${order.amount} HTG`} */}
                                3500 HTG
                              </span>
                            </DrawerTrigger>
                          </Drawer>
                        </TableCell>
                        <TableCell className="py-6">
                          {/* {order?.status === "SUCCESFUL" && ( */}
                          <span
                            className={
                              "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                            }
                          >
                            {t(
                              "payout_history.table.transaction_status.succesful",
                            )}
                          </span>
                          {/* )} */}
                          {/* 
                        {order?.status === "Pending" && (
                          <span
                            className={
                              "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                            }
                          >
                            {t("list.filters.upcoming")}
                          </span>
                        )}
                      */}
                        </TableCell>
                      </TableRow>
                    </DrawerTrigger>
                    <WithdrawalDetails></WithdrawalDetails>
                  </Drawer>
                ))}
              </TableBody>
            ) : null}
          </Table>
          {!history && (
            <div className="flex flex-col w-fit  gap-12 items-center mt-8 self-center">
              <div className="rounded-full bg-neutral-100 p-6 w-fit">
                <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
                  <Image
                    src={MoneySend}
                    alt="no payout history"
                    width={50}
                    height={50}
                  />
                </div>
              </div>
              <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
                {t("payout_history.no_history")}
              </p>
            </div>
          )}
          <div className="w-full flex">
            <span className="flex w-full  gap-8 text-primary-500 text-[1.5rem] leading-8 items-center justify-end">
              {t("view_all")}
              <Image
                src={ArrowRight}
                alt="arrow right"
                width={20}
                height={20}
              />
            </span>
          </div>
        </div>
      </div>
      <div></div>
    </>
  );
}
