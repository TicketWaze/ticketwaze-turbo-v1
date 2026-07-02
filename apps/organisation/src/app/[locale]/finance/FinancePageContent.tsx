"use client";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight2, Money3, SearchNormal } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import FormatDate from "@/lib/FormatDate";
import {
  Order,
  Organisation,
  WithdrawalRequest,
} from "@ticketwaze/typescript-config";
import InitiateWithdrawalButton from "./InitiateWithdrawalButton";
import TruncateUrl from "@/lib/TruncateUrl";
import { Link } from "@/i18n/navigation";
import WithdrawalInformations from "./components/WithdrawalInformations";
import OrdersInformations from "./components/OrdersInformations";

export default function FinancePageContent({
  transactions,
  authorizedUpdate,
}: {
  transactions: {
    // tickets: OrganisationTicket[];
    orders: Order[];
    allOrders: Order[];
    organisation: Organisation;
    withdrawalRequests: WithdrawalRequest[];
  };
  authorizedUpdate: boolean;
}) {
  const t = useTranslations("Finance");
  const { data: session } = useSession();
  const currentOrganisation = transactions.organisation;
  const { orders, allOrders } = transactions;
  const total = allOrders.reduce((sum, order) => {
    const orderTotal = order.tickets.reduce(
      (s, ticket) =>
        s +
        (currentOrganisation?.currency === "HTG"
          ? ticket.ticketPrice
          : ticket.ticketUsdPrice),
      0,
    );
    return sum + orderTotal;
  }, 0);
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
            {orders.slice(0, 5).map((order) => {
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
                      <OrdersInformations
                        tickets={order.tickets}
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
                          {TruncateUrl(order.tickets[0].event.eventName, 20)}
                        </span>
                      </DrawerTrigger>
                      <OrdersInformations
                        tickets={order.tickets}
                        order={order as Order}
                      />
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell font-medium leading-8 text-neutral-900"
                    }
                  >
                    {order.tickets[0].event.currency === "USD"
                      ? order.tickets.reduce((sum, t) => sum + Number(t.ticketUsdPrice), 0)
                      : order.tickets.reduce((sum, t) => sum + Number(t.ticketPrice), 0)}{" "}
                    {order.tickets[0].event.currency}
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
                      order.tickets[0].event.eventDays[0].timezone,
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
        {orders.length > 5 && (
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
        )}
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
            {transactions.withdrawalRequests.slice(0, 5).map((request) => {
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
                      <WithdrawalInformations request={request} />
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={"text-[1.5rem] leading-8 text-neutral-900 py-6"}
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {TruncateUrl(request.bankName ?? "", 14)}
                        </span>
                      </DrawerTrigger>
                      <WithdrawalInformations request={request} />
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={"text-[1.5rem] leading-8 text-neutral-900"}
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {TruncateUrl(request.accountNumber ?? "", 14)}
                        </span>
                      </DrawerTrigger>
                      <WithdrawalInformations request={request} />
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell font-medium leading-8 text-neutral-900"
                    }
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {currentOrganisation?.currency === "USD"
                            ? request.usdAmount
                            : request.amount}{" "}
                          {currentOrganisation?.currency}
                        </span>
                      </DrawerTrigger>
                      <WithdrawalInformations request={request} />
                    </Drawer>
                  </TableCell>
                  <TableCell>
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
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
                          {request.status.toUpperCase() === "FAILED" && (
                            <span
                              className={
                                "py-[.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase text-failure px-4 rounded-[30px] bg-failure/20"
                              }
                            >
                              {t("filters.failed")}
                            </span>
                          )}
                        </span>
                      </DrawerTrigger>
                      <WithdrawalInformations request={request} />
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                    }
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {FormatDate(request.createdAt, locale, "local")}
                        </span>
                      </DrawerTrigger>
                      <WithdrawalInformations request={request} />
                    </Drawer>
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
        {transactions.withdrawalRequests.length > 5 && (
          <Link
            href={"/finance/withdrawal"}
            className={
              "text-primary-500 justify-end flex gap-4 items-center text-[1.5rem] leading-8"
            }
          >
            {t("withdrawal.more")}
            <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
          </Link>
        )}
        <div></div>
      </div>
    </div>
  );
}

export function Separator() {
  return (
    <div className={"w-full py-6"}>
      <div className={"bg-neutral-200 w-full h-[.2rem]"}></div>
    </div>
  );
}
