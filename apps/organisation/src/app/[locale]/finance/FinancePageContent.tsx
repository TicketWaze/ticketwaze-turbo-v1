"use client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Money3, SearchNormal } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import FormatDate from "@/lib/FormatDate";
import {
  Event,
  Order,
  Organisation,
  Ticket,
  WithdrawalRequest,
} from "@ticketwaze/typescript-config";
import { ButtonAccent } from "@/components/shared/buttons";
import InitiateWithdrawalButton from "./InitiateWithdrawalButton";
import TruncateUrl from "@/lib/TruncateUrl";
import formatTime from "@/lib/formatTime";

interface OrganisationTicket extends Ticket {
  event: Event;
}

export default function FinancePageContent({
  transactions,
  authorizedUpdate,
}: {
  transactions: {
    tickets: OrganisationTicket[];
    orders: Order[];
    organisation: Organisation;
    withdrawalRequests: WithdrawalRequest[];
  };
  authorizedUpdate: boolean;
}) {
  const t = useTranslations("Finance");
  const { data: session } = useSession();
  const currentOrganisation = transactions.organisation;
  const { orders, tickets } = transactions;
  const total = Object.values(tickets)
    .filter((ticket) => ticket.status !== "RETURNED")
    .reduce(
      (acc, ticket) =>
        acc +
        (currentOrganisation?.currency === "HTG"
          ? ticket.ticketPrice
          : ticket.ticketUsdPrice),
      0,
    );
  const roundTotal = Math.round(total * 100) / 100;
  const locale = useLocale();
  return (
    <div className={"flex flex-col gap-12 overflow-y-scroll overflow-x-hidden"}>
      <div
        className={
          "grid grid-cols-2 lg:grid-cols-3 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <div className={"pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("amounts.revenue")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {roundTotal}{" "}
            <span
              className={
                "font-normal text-[1.6rem] lg:text-[20px] text-neutral-500"
              }
            >
              {session?.activeOrganisation.currency}
            </span>
          </p>
        </div>
        <div className={"pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("amounts.pendingBalance")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {currentOrganisation?.currency === "HTG"
              ? transactions.organisation.pendingBalance
              : transactions.organisation.usdPendingBalance}
            <span
              className={
                "font-normal text-[1.6rem] lg:text-[20px] text-neutral-500"
              }
            >
              {" "}
              {session?.activeOrganisation.currency}
            </span>
          </p>
        </div>
        <div className={"pl-0 lg:pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("amounts.availableBalance")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {currentOrganisation?.currency === "HTG"
              ? transactions.organisation.availableBalance
              : transactions.organisation.usdAvailableBalance}
            <span
              className={
                "font-normal text-[1.6rem] lg:text-[20px] text-neutral-500"
              }
            >
              {" "}
              {session?.activeOrganisation.currency}
            </span>
          </p>
        </div>
      </div>
      {authorizedUpdate && (
        <div className="lg:hidden w-full py-[7.5px]">
          <InitiateWithdrawalButton organisation={transactions.organisation} />
        </div>
      )}

      <div className={"flex flex-col gap-8"}>
        <div
          className={
            "flex flex-col gap-8 lg:gap-0 lg:flex-row w-full items-center justify-between"
          }
        >
          <span
            className={
              "font-primary  w-full font-medium text-[18px] leading-10 text-black"
            }
          >
            {t("transactions.title")}
          </span>
          <div
            className={
              "bg-neutral-100 rounded-[30px] flex items-center gap-2 w-full lg:w-auto lg:min-w-[24.3rem] px-6 py-4"
            }
          >
            <input
              placeholder={t("search")}
              className={
                "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
              }
            />
            <SearchNormal size="20" color="#737c8a" variant="Bulk" />
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
                {t("transactions.table.id")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("transactions.table.name")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("transactions.table.amount")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("transactions.table.status")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("transactions.table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const transactionsTicket = tickets.filter(
                (ticket) => ticket.orderId === order.orderId,
              );
              return (
                <TableRow key={order.orderId}>
                  <TableCell
                    className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {TruncateUrl(order.orderName, 15)}
                        </span>
                      </DrawerTrigger>
                      <Informations
                        tickets={transactionsTicket}
                        order={order as Order}
                      />
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={"text-[1.5rem] leading-8 text-neutral-900"}
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {TruncateUrl(
                            transactionsTicket[0].event.eventName,
                            20,
                          )}
                        </span>
                      </DrawerTrigger>
                      <Informations
                        tickets={transactionsTicket}
                        order={order as Order}
                      />
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell font-medium leading-8 text-neutral-900"
                    }
                  >
                    {transactionsTicket[0].event.currency === "USD"
                      ? order.usdPrice
                      : order.amount}{" "}
                    {transactionsTicket[0].event.currency}
                  </TableCell>
                  <TableCell className={"hidden lg:table-cell"}>
                    {order?.status === "SUCCESSFUL" && (
                      <span
                        className={
                          "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                        }
                      >
                        {t("filters.successful")}
                      </span>
                    )}
                    {order?.status === "RETURNED" && (
                      <span
                        className={
                          "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-failure  px-2 rounded-[30px] bg-failure/10"
                        }
                      >
                        {t("filters.returned")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                    }
                  >
                    {FormatDate(
                      order.createdAt,
                      locale,
                      transactionsTicket[0].event.eventDays[0].timezone,
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {orders.length === 0 && (
          <div
            className={
              "w-132 lg:w-184 mx-auto flex flex-col items-center gap-20"
            }
          >
            <div
              className={
                "w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100"
              }
            >
              <div
                className={
                  "w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200"
                }
              >
                <Money3 size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <div className={"flex flex-col gap-12 items-center text-center"}>
              <p
                className={
                  "text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]"
                }
              >
                {t("transactions.description")}
              </p>
            </div>
          </div>
        )}
        {/* {tickets.length > 0 && (
          <div className={"w-full flex justify-end"}>
            <Link
              href={"/finance/transactions"}
              className={
                "text-primary-500 justify-end flex gap-4 items-center text-[1.5rem] leading-8"
              }
            >
              {t("transactions.more")}
              <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
            </Link>
          </div>
        )} */}
        <div></div>
      </div>
      {/* WITHDRAWAL */}
      <div className={"flex flex-col gap-8"}>
        <div
          className={
            "flex flex-col lg:flex-row gap-8 w-full lg:items-center justify-between"
          }
        >
          <span
            className={
              "font-primary font-medium text-left text-[18px] leading-10 text-black"
            }
          >
            {t("withdrawal.title")}
          </span>
          {/* <div className={"flex items-center gap-4"}>
            <div
              className={
                "bg-neutral-100 rounded-[30px] flex items-center gap-2 w-full lg:w-auto lg:min-w-[243px] px-[1.5rem] py-4"
              }
            >
              <input
                placeholder={t("search")}
                className={
                  "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
                }
              />
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </div>
          </div> */}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className={
                  "font-bold  text-[1.1rem] hidden lg:table-cell pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.id")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.name")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.account")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.amount")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.status")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.withdrawalRequests.map((request) => {
              return (
                <TableRow key={request.withdrawalRequestId}>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell py-6 leading-8 text-neutral-900"
                    }
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {TruncateUrl(request.withdrawalRequestId, 14)}
                        </span>
                      </DrawerTrigger>
                      {/* <Informations ticket={ticket} order={order as Order} /> */}
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={"text-[1.5rem] leading-8 text-neutral-900"}
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {request.accountType === "bank" &&
                            TruncateUrl(
                              currentOrganisation?.bankName ?? "",
                              14,
                            )}
                        </span>
                      </DrawerTrigger>
                      {/* <Informations ticket={ticket} order={order as Order} /> */}
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={"text-[1.5rem] leading-8 text-neutral-900"}
                  >
                    {request.accountType === "bank" && (
                      <span className={"cursor-pointer"}>
                        {TruncateUrl(
                          currentOrganisation?.bankAccountNumber ?? "",
                          14,
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell font-medium leading-8 text-neutral-900"
                    }
                  >
                    {currentOrganisation?.currency === "USD"
                      ? request.usdAmount
                      : request.amount}{" "}
                    {currentOrganisation?.currency}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                    }
                  >
                    {FormatDate(request.createdAt, locale, "local")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {transactions.withdrawalRequests.length === 0 && (
          <div
            className={
              "w-132 lg:w-184 mx-auto flex flex-col items-center gap-20"
            }
          >
            <div
              className={
                "w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100"
              }
            >
              <div
                className={
                  "w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200"
                }
              >
                <Money3 size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <div className={"flex flex-col gap-12 items-center text-center"}>
              <p
                className={
                  "text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]"
                }
              >
                {t("withdrawal.description")}
              </p>
            </div>
          </div>
        )}
        {/*<Link*/}
        {/*  href={'#'}*/}
        {/*  className={*/}
        {/*    'text-primary-500 justify-end flex gap-4 items-center text-[1.5rem] leading-8'*/}
        {/*  }*/}
        {/*>*/}
        {/*  {finance.transactions.more}*/}
        {/*  <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />*/}
        {/*</Link>*/}
        <div></div>
      </div>
    </div>
  );
}

function Informations({
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
                  {FormatDate(
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
                    ? order.usdPrice
                    : order.amount}{" "}
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

export function Separator() {
  return (
    <div className={"w-full py-6"}>
      <div className={"bg-neutral-200 w-full h-[.2rem]"}></div>
    </div>
  );
}
