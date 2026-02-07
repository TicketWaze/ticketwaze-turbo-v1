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
import { useTranslations } from "next-intl";
import FormatDate from "@/lib/FormatDate";
import TimesTampToDateTime from "@/lib/TimesTampToDateTime";
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

interface OrganisationTicket extends Ticket {
  event: Event;
}

export default function FinancePageContent({
  transactions,
}: {
  transactions: {
    tickets: OrganisationTicket[];
    orders: Order[];
    organisation: Organisation;
    withdrawalRequests: WithdrawalRequest[];
  };
}) {
  const t = useTranslations("Finance");
  const { data: session } = useSession();
  const currentOrganisation = transactions.organisation;
  const { orders, tickets } = transactions;
  const total = Object.values(orders).reduce(
    (acc, order) =>
      acc +
      (currentOrganisation?.currency === "HTG" ? order.amount : order.usdPrice),
    0,
  );
  const roundTotal = Math.round(total * 100) / 100;
  return (
    <div className={"flex flex-col gap-[3rem] overflow-y-scroll"}>
      <div
        className={
          "grid grid-cols-2 lg:grid-cols-3 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <div className={"pb-[30px]"}>
          <span
            className={"text-[14px] text-neutral-600 leading-[20px] pb-[5px]"}
          >
            {t("amounts.revenue")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-[30px] font-primary"
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
        <div className={"pl-[25px]"}>
          <span
            className={"text-[14px] text-neutral-600 leading-[20px] pb-[5px]"}
          >
            {t("amounts.pendingBalance")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-[30px] font-primary"
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
        <div className={"pl-0 lg:pl-[25px]"}>
          <span
            className={"text-[14px] text-neutral-600 leading-[20px] pb-[5px]"}
          >
            {t("amounts.availableBalance")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-[30px] font-primary"
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
      <div className="lg:hidden w-full py-[7.5px]">
        <InitiateWithdrawalButton organisation={transactions.organisation} />
      </div>
      <div className={"flex flex-col gap-8"}>
        <div
          className={
            "flex flex-col gap-8 lg:gap-0 lg:flex-row w-full items-center justify-between"
          }
        >
          <span
            className={
              "font-primary  w-full font-medium text-[18px] leading-[25px] text-black"
            }
          >
            {t("transactions.title")}
          </span>
          <div
            className={
              "bg-neutral-100 rounded-[30px] flex items-center gap-2 w-full lg:w-auto lg:min-w-[243px] px-[1.5rem] py-4"
            }
          >
            <input
              placeholder={t("search")}
              className={
                "text-black font-normal text-[1.4rem] leading-[20px] w-full outline-none"
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
                  "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("transactions.table.id")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("transactions.table.name")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("transactions.table.class")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("transactions.table.amount")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("transactions.table.status")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("transactions.table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
              const [order] = orders.filter(
                (order) => ticket.orderId === order.orderId,
              );
              return (
                <TableRow key={ticket.ticketId}>
                  <TableCell
                    className={
                      "text-[1.5rem] py-[15px] leading-8 text-neutral-900"
                    }
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {ticket.ticketName}
                        </span>
                      </DrawerTrigger>
                      <Informations ticket={ticket} order={order as Order} />
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={"text-[1.5rem] leading-8 text-neutral-900"}
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {ticket.event.eventName}
                        </span>
                      </DrawerTrigger>
                      <Informations ticket={ticket} order={order as Order} />
                    </Drawer>
                  </TableCell>
                  <TableCell className={"hidden lg:table-cell"}>
                    {ticket.ticketType.toUpperCase() === "GENERAL" && (
                      <span
                        className={
                          "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EF1870]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                        }
                      >
                        general
                      </span>
                    )}
                    {ticket.ticketType.toUpperCase() === "VIP" && (
                      <span
                        className={
                          "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#7A19C7]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                        }
                      >
                        vip
                      </span>
                    )}
                    {ticket.ticketType.toUpperCase() === "VVIP" && (
                      <span
                        className={
                          "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-deep-100  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                        }
                      >
                        Premium vip
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell font-medium leading-8 text-neutral-900"
                    }
                  >
                    {ticket.event.currency === "USD"
                      ? ticket.ticketUsdPrice
                      : ticket.ticketPrice}{" "}
                    {ticket.event.currency}
                  </TableCell>
                  <TableCell className={"hidden lg:table-cell"}>
                    {order?.status === "SUCCESSFUL" && (
                      <span
                        className={
                          "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                        }
                      >
                        {t("filters.successful")}
                      </span>
                    )}
                    {order?.status === "PENDING" && (
                      <span
                        className={
                          "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
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
                    {FormatDate(ticket.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {tickets.length === 0 && (
          <div
            className={
              "w-[330px] lg:w-[460px] mx-auto flex flex-col items-center gap-[5rem]"
            }
          >
            <div
              className={
                "w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100"
              }
            >
              <div
                className={
                  "w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200"
                }
              >
                <Money3 size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <div
              className={"flex flex-col gap-[3rem] items-center text-center"}
            >
              <p
                className={
                  "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
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
                "text-primary-500 justify-end flex gap-4 items-center text-[1.5rem] leading-[20px]"
              }
            >
              {t("transactions.more")}
              <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
            </Link>
          </div>
        )} */}
        <div></div>
      </div>
      <div className={"flex flex-col gap-8"}>
        <div
          className={
            "flex flex-col lg:flex-row gap-8 w-full lg:items-center justify-between"
          }
        >
          <span
            className={
              "font-primary font-medium text-left text-[18px] leading-[25px] text-black"
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
                  "text-black font-normal text-[1.4rem] leading-[20px] w-full outline-none"
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
                  "font-bold  text-[1.1rem] hidden lg:table-cell pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.id")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.name")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.account")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.amount")}
              </TableHead>
              <TableHead
                className={
                  "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                }
              >
                {t("withdrawal.table.status")}
              </TableHead>
              <TableHead
                className={
                  "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
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
                      "text-[1.5rem] hidden lg:table-cell py-[15px] leading-8 text-neutral-900"
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
                          "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[10px] rounded-[30px] bg-[#349C2E]/20"
                        }
                      >
                        {t("filters.successful")}
                      </span>
                    )}
                    {request.status.toUpperCase() === "PENDING" && (
                      <span
                        className={
                          "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[10px] rounded-[30px] bg-[#EA961C]/20"
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
                    {FormatDate(request.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {transactions.withdrawalRequests.length === 0 && (
          <div
            className={
              "w-[330px] lg:w-[460px] mx-auto flex flex-col items-center gap-[5rem]"
            }
          >
            <div
              className={
                "w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100"
              }
            >
              <div
                className={
                  "w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200"
                }
              >
                <Money3 size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <div
              className={"flex flex-col gap-[3rem] items-center text-center"}
            >
              <p
                className={
                  "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
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
        {/*    'text-primary-500 justify-end flex gap-4 items-center text-[1.5rem] leading-[20px]'*/}
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
                  {FormatDate(ticket.event.eventDays[0]?.dateTime ?? "")}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-[20px] text-neutral-600"
                }
              >
                {t("transactions.details.time")}{" "}
                <span className={"text-deep-100 font-medium leading-[20px]"}>
                  {`${TimesTampToDateTime(ticket.event.eventDays[0]?.dateTime ?? "").hour < 10 ? `0${TimesTampToDateTime(ticket.event.eventDays[0]?.dateTime ?? "").hour}` : TimesTampToDateTime(ticket.event.eventDays[0]?.dateTime ?? "").hour}:${TimesTampToDateTime(ticket.event.eventDays[0]?.dateTime ?? "").minute < 10 ? `0${TimesTampToDateTime(ticket.event.eventDays[0]?.dateTime ?? "").minute}` : TimesTampToDateTime(ticket.event.eventDays[0]?.dateTime ?? "").minute}`}
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

export function Separator() {
  return (
    <div className={"w-full py-[15px]"}>
      <div className={"bg-neutral-200 w-full h-[2px]"}></div>
    </div>
  );
}
