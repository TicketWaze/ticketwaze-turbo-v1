"use client";
import AdminLayout from "@/components/Layouts/AdminLayout";
import OrganisationsPageTopbar from "./OrganisationsPageTopbar";
import { useTranslations } from "next-intl";
import Image from "next/image";
import ArrowUp from "@ticketwaze/ui/assets/icons/arrow-up.svg";
import User from "@ticketwaze/ui/assets/icons/user-square.svg";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

export default function OrganisationsPageContent() {
  const t = useTranslations("Organisations");
  const history = true;
  const router = useRouter();
  return (
    <AdminLayout>
      <OrganisationsPageTopbar
        title={t("title")}
        filter={t("filters.period.actual")}
      />
      <div
        className={
          "grid grid-cols-3 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <div className={"pb-12"}>
          <span className={"flex justify-between text-[14px] text-neutral-600 leading-8 pb-2"}>
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
            250,000
          </p>
        </div>
        <div className={"pl-10"}>
          <span className={"flex justify-between text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("active")}
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
            242,538
          </p>
        </div>
        <div className={"pl-0 lg:pl-10"}>
          <span className={"flex justify-between text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("new")}
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
            10,300
          </p>
        </div>
      </div>
      <div className="flex justify-between">
        <h4 className="font-medium inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
          {t("organisations_list.title")}
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
              {t("organisations_list.table.name")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("organisations_list.table.email")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("organisations_list.table.status")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("organisations_list.table.activity_count")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("organisations_list.table.revenue")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("organisations_list.table.joined")}
            </TableHead>
          </TableRow>
        </TableHeader>
        {history ? (
          <TableBody>
            {Array.from({ length: 4 }).map((_, index) => (
              <TableRow
                key={index}
                className="cursor-pointer"
                onClick={() => router.push("/organisations/[user]")}
              >
                <TableCell
                  className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                >
                  <span className={"cursor-pointer"}>Global Events Hub</span>
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  <span className={"cursor-pointer"}>org@geh.com</span>
                </TableCell>
                <TableCell
                  className={
                    "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                  }
                >
                  <span
                    className={`py-[0.3rem] px-2 bg-neutral-100 text-success font-bold rounded-[30px] text-[11px]`}
                  >
                    ACTIVE
                  </span>
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] font-medium leading-8 text-neutral-900"
                  }
                >
                  3
                </TableCell>
                <TableCell className="text-[1.5rem] font-medium leading-8 text-neutral-900">
                  1,230,000 HTG
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  Jan 16, 2025 12:21 PM
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        ) : null}
      </Table>
      {!history && (
        <div className="flex flex-col w-fit  gap-12 items-center mt-8 self-center">
          <div className="rounded-full bg-neutral-100 p-6 w-fit">
            <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
              <Image
                src={User}
                alt="no attendee history"
                width={50}
                height={50}
              />
            </div>
          </div>
          <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
            {t("organisations_list.no_history")}
          </p>
        </div>
      )}
    </AdminLayout>
  );
}
