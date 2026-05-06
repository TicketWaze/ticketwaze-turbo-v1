"use client";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import Image from "next/image";
import Ticket from "@ticketwaze/ui/assets/icons/ticket-2.svg"
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
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useTranslations } from "next-intl";
import TicketsPageTopbar from "./TicketsPageTopbar";
import TicketDetails from "./TicketDetails";

export default function TicketPageContent() {
  const t = useTranslations("Tickets");
  const history = true;
  return (
    <AdminLayout>
      <TicketsPageTopbar
        title={t("title")}
        filter={t("filters.period.actual")}
      />
      <div
        className={
          "grid grid-cols-3 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <div className={"pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("total_sold")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            0
          </p>
        </div>
        <div className={"pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("total_created")}
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
            {t("checked-in")}
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
          {t("tickets_list.title")}
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
                  {t("filters.time")}
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
                  {t("filters.ticket_class")}
                </SelectItem>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="pending"
                >
                  General
                </SelectItem>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="pending"
                >
                  VIP
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
              {t("tickets_list.table.transaction_id")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("tickets_list.table.attendee")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("tickets_list.table.activity_name")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("tickets_list.table.ticket_class")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("tickets_list.table.check-in")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("tickets_list.table.purchase")}
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
                      <span className={"cursor-pointer"}>TCK12345GA</span>
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                      }
                    >
                      <span className={"cursor-pointer"}>
                        {/* {order.provider.toUpperCase()} */}
                        Marie Jean-Louis
                      </span>
                    </TableCell>
                    <TableCell
                      className={
                        "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                      }
                    >
                      {/* {order.tickets.length} */}
                      Global Events Hub
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] font-medium leading-8 text-neutral-900"
                      }
                    >
                      <span
                        className={`py-[0.3rem] px-2 bg-neutral-100 text-[#EF1870] font-bold rounded-[30px] text-[11px]`}
                      >
                        GENERAL
                      </span>
                    </TableCell>
                    <TableCell className="py-6">
                      <span
                        className={
                          "py-[0.3rem] px-2 cursor-pointer text-[1.1rem] font-bold text-center uppercase text-[#EA961C]  rounded-[30px] bg-neutral-100"
                        }
                      >
                        Pending
                      </span>
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                      }
                    >
                      Jan 16, 2025 12:21 PM
                    </TableCell>
                  </TableRow>
                </DrawerTrigger>
                <TicketDetails></TicketDetails>
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
                src={Ticket}
                alt="no ticket history"
                width={50}
                height={50}
              />
            </div>
          </div>
          <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
            {t("tickets_list.no_history")}
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
