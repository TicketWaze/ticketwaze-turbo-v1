import AdminLayout from "@/components/Layouts/AdminLayout";
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
import PayoutsPageTopbar from "../payouts/PayoutsPageTopbar";
import TransactionDetails from "./TransactionDetails";
import Money from "@ticketwaze/ui/assets/icons/moneys.svg";
import ArrowUp from "@ticketwaze/ui/assets/icons/arrow-up.svg";
import Image from "next/image";

export default function PaymentsPageContent() {
  const t = useTranslations("Payments");
  const history = false;
  return (
    <AdminLayout>
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
            {t("total_revenue")}
            <span className="flex text-success gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10">
              80%
              <Image src={ArrowUp} alt="arrow up" width={20} height={20} />
            </span>
          </span>
          <p
            className={
              "font-medium text-[1.6rem] -mt-2 lg:text-[25px] leading-12 font-primary"
            }
          >
            20,553,758,125.90 <span className="text-neutral-600">HTG</span>
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
            0
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
            0 <span className="text-neutral-600">HTG</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-8  overflow-scroll h-full">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between">
            <h4 className="font-medium inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
              {t("transactions.title")}
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
                              <span className={"cursor-pointer"}>
                                Cap-Haïtien Music Fest{" "}
                              </span>
                            </DrawerTrigger>
                          </Drawer>
                        </TableCell>
                        <TableCell
                          className={
                            "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                          }
                        >
                          <span
                            className={`py-[0.3rem] px-2 bg-neutral-200 text-[#EF1870] font-bold rounded-[30px] text-[11px]`}
                          >
                            GENERAL
                          </span>
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
                              "transactions.table.transaction_status.succesful",
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
                            {t(
                              "transactions.table.transaction_status.succesful",
                            )}
                          </span>
                        )}
                      */}
                        </TableCell>
                      </TableRow>
                    </DrawerTrigger>
                    <TransactionDetails></TransactionDetails>
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
    </AdminLayout>
  );
}
