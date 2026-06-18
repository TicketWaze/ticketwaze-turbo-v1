"use client";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import TransactionDetails from "./TransactionDetails";
import Money from "@ticketwaze/ui/assets/icons/moneys.svg";
import ArrowUp from "@ticketwaze/ui/assets/icons/arrow-up.svg";
import Image from "next/image";
import PaymentsPageTopbar from "./PaymentsPageTopbar";
import { Order } from "@ticketwaze/typescript-config";

function getTicketTypeColor(ticketType: string) {
  const upper = ticketType.toUpperCase();
  if (upper.includes("PREMIUM")) return "#2E3237";
  if (upper.includes("VIP")) return "#7A19C7";
  return "#EF1870";
}

function getTransactionStatusStyle(status: string) {
  switch (status) {
    case "SUCCESSFUL":
      return { color: "#349C2E" };
    case "FAILED":
      return { color: "#EF1870" };
    case "RETURNED":
      return { color: "#3F3F3F" };
    default:
      return { color: "#EA961C" };
  }
}

function formatOrderAmount(order: Order) {
  const currency = order.tickets?.[0]?.event?.currency ?? "HTG";
  const amount =
    currency === "HTG"
      ? order.amount.toLocaleString()
      : order.usdPrice.toLocaleString();
  return `${amount} ${currency}`;
}

function getOrderTicketTypes(order: Order): string {
  const types = [
    ...new Set((order.tickets ?? []).map((t) => t.ticketType).filter(Boolean)),
  ];
  return types.join(" + ") || "—";
}

type PaymentStats = {
  totalRevenue: number;
  totalTransactions: number;
  revenueGrowth: number;
  platformFees: number;
};

export default function PaymentsPageContent({
  orders,
  stats,
  activeStatus,
}: {
  orders: Order[];
  stats: PaymentStats;
  activeStatus: string;
}) {
  const t = useTranslations("Payments");
  const router = useRouter();
  const pathname = usePathname();
  const history = orders.length > 0;

  const selectDefaultStatus = [
    "PENDING",
    "SUCCESSFUL",
    "FAILED",
    "RETURNED",
  ].includes(activeStatus)
    ? activeStatus
    : "SUCCESSFUL";

  const handleStatusChange = (value: string) => {
    router.push(
      value === "all" ? pathname : `${pathname}?status=${value}`,
    );
  };

  const growthPositive = stats.revenueGrowth >= 0;

  return (
    <>
      <PaymentsPageTopbar
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
              "flex text-[14px] text-neutral-600 leading-8 pb-2 justify-between"
            }
          >
            {t("total_revenue")}
            <span
              className={`flex gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10 ${growthPositive ? "text-success" : "text-[#EF1870]"}`}
            >
              {Math.abs(stats.revenueGrowth)}%
              <Image src={ArrowUp} alt="trend" width={20} height={20} />
            </span>
          </span>
          <p
            className={
              "font-medium text-[1.6rem] -mt-2 lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.totalRevenue.toLocaleString()}{" "}
            <span className="text-neutral-600">HTG</span>
          </p>
        </div>
        <div className={"pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("total_transactions")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.totalTransactions.toLocaleString()}
          </p>
        </div>
        <div className={"pl-0 lg:pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("fees")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            {stats.platformFees.toLocaleString()}{" "}
            <span className="text-neutral-600">HTG</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-8 overflow-scroll h-full">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between">
            <h4 className="hidden font-medium lg:inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
              {t("transactions.title")}
            </h4>
            <div className="flex gap-4">
              <Select
                defaultValue={selectDefaultStatus}
                onValueChange={handleStatusChange}
              >
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
                      value="SUCCESSFUL"
                    >
                      Successful
                    </SelectItem>
                    <SelectItem
                      className={"text-[1.4rem] text-deep-100"}
                      value="PENDING"
                    >
                      Pending
                    </SelectItem>
                    <SelectItem
                      className={"text-[1.4rem] text-deep-100"}
                      value="FAILED"
                    >
                      Failed
                    </SelectItem>
                    <SelectItem
                      className={"text-[1.4rem] text-deep-100"}
                      value="RETURNED"
                    >
                      Returned
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
                  {t("transactions.table.transaction_id")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("transactions.table.activity_name")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("transactions.table.ticket_class")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("transactions.table.amount_paid")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
                  }
                >
                  {t("transactions.table.transaction_status.title")}
                </TableHead>
              </TableRow>
            </TableHeader>

            {history ? (
              <TableBody>
                {orders.map((order) => {
                  const statusStyle = getTransactionStatusStyle(order.status);
                  const firstTicket = order.tickets?.[0];
                  const ticketTypes = getOrderTicketTypes(order);
                  const firstTicketTypeColor = getTicketTypeColor(
                    firstTicket?.ticketType ?? "",
                  );
                  return (
                    <Drawer key={order.orderId} direction="right">
                      <DrawerTrigger asChild>
                        <TableRow className="cursor-pointer">
                          <TableCell
                            className={
                              "text-[1.5rem] py-6 leading-8 text-neutral-900"
                            }
                          >
                            <span className="cursor-pointer">
                              {order.orderId.slice(0, 8).toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                            }
                          >
                            {firstTicket?.event?.eventName ?? "—"}
                          </TableCell>
                          <TableCell
                            className={
                              "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                            }
                          >
                            <span
                              style={{ color: firstTicketTypeColor }}
                              className="py-[0.3rem] px-2 bg-neutral-200 font-bold rounded-[30px] text-[11px] uppercase"
                            >
                              {ticketTypes}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] font-medium leading-8 text-neutral-900"
                            }
                          >
                            {formatOrderAmount(order)}
                          </TableCell>
                          <TableCell className="py-6">
                            <span
                              style={{ color: statusStyle.color }}
                              className="py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-[#f5f5f5]"
                            >
                              {order.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      </DrawerTrigger>
                      <TransactionDetails order={order} />
                    </Drawer>
                  );
                })}
              </TableBody>
            ) : null}
          </Table>
          {!history && (
            <div className="flex flex-col w-fit gap-12 items-center mt-8 self-center">
              <div className="rounded-full bg-neutral-100 p-6 w-fit">
                <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
                  <Image
                    src={Money}
                    alt="no payment history"
                    width={50}
                    height={50}
                  />
                </div>
              </div>
              <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
                {t("transactions.no_history")}
              </p>
            </div>
          )}
        </div>
      </div>
      <div></div>
    </>
  );
}
