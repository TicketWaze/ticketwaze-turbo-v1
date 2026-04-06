import AdminLayout from "@/components/Layouts/AdminLayout";
import BackButton from "@/components/shared/BackButton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ButtonBlack,
  ButtonPrimary,
  ButtonRed,
} from "@/components/shared/buttons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar2, Location, Clock } from "iconsax-reactjs";
import Information from "./Informations";
import Separator from "@/components/shared/Separator";
import { useTranslations } from "next-intl";
import Rema from "@ticketwaze/ui/assets/images/rema.png";
import Image from "next/image";
import More from "@ticketwaze/ui/assets/icons/more-circle.svg";
import Link from "next/link";
import Filter from "../filter";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

export default function ActivityPage() {
  const t = useTranslations("Activities");
  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 h-full overflow-hidden">
        <BackButton text={t("activity.back")}></BackButton>
        <div className="mb-6 flex justify-between items-center">
          <h2 className="items-center font-primary leading-12 font-medium text-[2.6rem]">
            {t("activity.name")}
          </h2>
          <div className="flex gap-4 items-center h-fit">
            <ButtonRed className="py-[7.5px]">
              {t("activity.button.suspend")}
            </ButtonRed>
            <ButtonPrimary className="py-[7.5px]">
              {t("activity.button.edit")}
            </ButtonPrimary>
          </div>
        </div>
        <main className="w-full gap-16 flex flex-col lg:grid lg:grid-cols-[15fr_21fr] lg:min-h-0">
          <div className="flex flex-col gap-8 overflow-y-auto min-h-0 max-h-[calc(100vh-200px)]">
            <div className="w-fit max-h-[29.8rem] overflow-hidden rounded-[10px] shrink-0">
              <Image
                src={Rema}
                width={400}
                height={298}
                alt="img"
                className="w-full"
              />
            </div>
            <Separator />
            <div className="flex flex-col gap-4">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("activity.about.title")}
              </span>
              <p className="text-[1.5rem] leading-12 text-neutral-700">
                {t("activity.about.description")}
              </p>
            </div>
            <Separator />
            <div className=" flex flex-col gap-8">
              <div className={"flex flex-col gap-8"}>
                <span
                  className={
                    "font-semibold text-[1.6rem] leading-8 text-deep-200"
                  }
                >
                  {t("activity.details.title")}
                </span>
                {/*  organizer*/}
                <div className={"flex items-center justify-between w-full"}>
                  <Link href={`#`} className={"flex items-center gap-4"}>
                    <div className="flex rounded-full w-14 h-14 bg-black justify-center items-center">
                      <p className="font-medium text-white leading-12 text-[2.2rem] font-primary">
                        C
                      </p>
                    </div>
                    <div className={"flex flex-col"}>
                      <span
                        className={
                          "font-normal text-[1.4rem] leading-8 text-deep-200"
                        }
                      >
                        {t("activity.details.organiser.name")}
                      </span>
                      <span
                        className={
                          "font-normal text-[1.3rem] leading-8 text-neutral-600"
                        }
                      >
                        {t("activity.details.organiser.followers")}
                      </span>
                    </div>
                  </Link>
                  <ButtonBlack className="w-fit">
                    {t("activity.details.button.view")}
                  </ButtonBlack>
                </div>
                <div className="flex justify-between">
                  {/*  date*/}
                  <div className={"flex items-center gap-2"}>
                    <div
                      className={
                        "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                      }
                    >
                      <Calendar2 size="20" color="#737c8a" variant="Bulk" />
                    </div>
                    <span
                      className={
                        "font-normal text-[1.4rem] leading-8 text-deep-200"
                      }
                    >
                      {/* {FormatDate(event.eventDays[0].dateTime)} */}
                      {t("activity.details.date")}
                    </span>
                    {/* {event.eventType !== "meet" && (
                    <AddToCalendar event={event} />
                  )} */}
                  </div>
                  {/*  time*/}
                  <div className={"flex items-center gap-2"}>
                    <div
                      className={
                        "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                      }
                    >
                      <Clock size="20" color="#737c8a" variant="Bulk" />
                    </div>
                    <span
                      className={
                        "font-normal text-[1.4rem] leading-8 text-deep-200"
                      }
                    >
                      {/* {`${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").hour < 10 ? `0${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").hour}` : TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").hour}:${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").minute < 10 ? `0${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").minute}` : TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").minute}`} */}
                      {t("activity.details.hour")}
                    </span>
                  </div>
                </div>
                {/*  address*/}
                {/* {event.eventType === "meet" && (
                  <div className={"flex items-center gap-[5px] "}>
                    <div
                      className={
                        "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                      }
                    >
                      <Google size="20" color="#737c8a" variant="Bulk" />
                    </div>
                    <span
                      className={
                        "font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[293px]"
                      }
                    >
                      Meet, Google
                    </span>
                  </div>
                )} */}
                {/* {event.eventType !== "meet" && ( */}
                <div className={"flex items-center gap-2"}>
                  <div
                    className={
                      "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
                    }
                  >
                    <Location size="20" color="#737c8a" variant="Bulk" />
                  </div>
                  <span
                    className={
                      "font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[29.3rem]"
                    }
                  >
                    {/* {event.address}, {event.city}, {Capitalize(event.state)},{" "}
                      {event.country} */}
                    {t("activity.details.address")}
                  </span>
                </div>
                {/* )} */}
              </div>
              {/* {event.eventType !== "meet" && (
                <>
                  <Separator />
                  <div className=" flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          "font-semibold text-[1.6rem] leading-8 text-deep-200"
                        }
                      >
                        {t("direction")}
                      </span>

                      <Link
                        href={googleMapsUrl}
                        target="_blank"
                        className="flex items-center gap-4 text-[1.6rem] leading-8 text-primary-500"
                      >
                        {t("open")}{" "}
                        <RouteSquare variant="Bulk" color="#E45B00" size={20} />
                      </Link>
                    </div>
                    <Map location={event.location} />
                    <div></div>
                  </div>
                </>
              )} */}
            </div>
            <div></div>
          </div>

          <div className="min-h-[75vh]">
            <Tabs defaultValue="performance" className="w-full h-full">
              <TabsList className={"w-full lg:w-fit mx-auto lg:mx-0 mb-8"}>
                <TabsTrigger value="performance">
                  {t("activity.resume.performance.title")}
                </TabsTrigger>
                <TabsTrigger value="attendance">
                  {t("activity.resume.attendance.title")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="performance" className="">
                <ul className="flex flex-col pt-4 gap-8 overflow-y-scroll">
                  <li className="flex justify-between">
                    <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
                      {t("activity.resume.performance.total")}
                    </span>
                    <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
                      7,789,670.90HTG
                    </span>
                  </li>

                  <li className="flex justify-between">
                    <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
                      {t("activity.resume.performance.tickets.sold")}
                    </span>
                    <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
                      9224/10,000
                    </span>
                  </li>

                  <li className="flex justify-between">
                    <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
                      {t("activity.resume.performance.tickets.left")}
                    </span>
                    <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
                      776/10,000
                    </span>
                  </li>

                  <li className="flex justify-between">
                    <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
                      {t("activity.resume.performance.counter")}
                    </span>
                    <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
                      3 days to go
                    </span>
                  </li>
                </ul>
              </TabsContent>
              <ActivityAttendances />
            </Tabs>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}

function ActivityAttendances() {
  const t = useTranslations("Activities");
  return (
    <TabsContent value="attendance" className="flex flex-col gap-8">
      <div className="flex justify-end">
        <div className="flex gap-4">
          <Filter filter={t("activity.resume.attendance.filters.status")} />
          <Filter filter={t("activity.resume.attendance.filters.period")} />
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
              {t("activity.resume.attendance.table.name")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("activity.resume.attendance.table.class")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("activity.resume.attendance.table.amount")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("activity.resume.attendance.table.status")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("activity.resume.attendance.table.purchase")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <TableRow>
                <TableCell
                  className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                >
                  <span className={"cursor-pointer"}>Marie Jean-Louis</span>
                </TableCell>
                <TableCell className="py-6">
                  <Drawer direction={"right"}>
                    <DrawerTrigger>
                      {/* {order?.status === "GENERAL" && ( */}
                      <span
                        className={
                          "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EF1870]  px-2 rounded-[30px] bg-[#f5f5f5]"
                        }
                      >
                        {t("activity.resume.attendance.tickets.general")}
                      </span>
                      {/* )} */}
                      {/* {order?.status === "VIP" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#7A19C7]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("activity.resume.attendance.tickets.vip")}
                    </span>
                  )}
                  {order?.status === "PREMIUM" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#2E3237]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("activity.resume.attendance.tickets.premium")}
                    </span>
                  )}
                 */}
                    </DrawerTrigger>
                  </Drawer>
                </TableCell>
                <TableCell
                  className={
                    "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                  }
                >
                  400 HTG
                </TableCell>
                <TableCell className="py-6">
                  {/* {order?.status === "ONGOING" && ( */}
                  <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("activity.resume.attendance.status.check-in")}
                  </span>
                  {/* )} */}
                  {/* {order?.status === "PAST" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#3F3F3F]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.past")}
                    </span>
                  )}
                  {order?.status === "UPCOMING" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.upcoming")}
                    </span>
                  )}
                  {order?.status === "ACTIVE" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.active")}
                    </span>
                  )} */}
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  Jan 16, 2025
                </TableCell>
              </TableRow>
            </DrawerTrigger>
            <Information></Information>
          </Drawer>

          <Drawer direction="right">
            <DrawerTrigger asChild>
              <TableRow>
                <TableCell
                  className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                >
                  <span className={"cursor-pointer"}>Marie Jean-Louis</span>
                </TableCell>
                <TableCell className="py-6">
                  {/* {order?.status === "GENERAL" && ( */}
                  {/* <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EF1870]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("activity.resume.attendance.tickets.general")}
                  </span> */}
                  {/* )} */}
                  {/* {order?.status === "VIP" && ( */}
                  <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#7A19C7]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("activity.resume.attendance.tickets.vip")}
                  </span>
                  {/* )} */}
                  {/* {order?.status === "PREMIUM" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#2E3237]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("activity.resume.attendance.tickets.premium")}
                    </span>
                  )} */}
                </TableCell>
                <TableCell
                  className={
                    "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                  }
                >
                  400 HTG
                </TableCell>
                <TableCell className="py-6">
                  {/* {order?.status === "ONGOING" && ( */}
                  <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("activity.resume.attendance.status.check-in")}
                  </span>
                  {/* )} */}
                  {/* {order?.status === "PAST" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#3F3F3F]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.past")}
                    </span>
                  )}
                  {order?.status === "UPCOMING" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.upcoming")}
                    </span>
                  )}
                  {order?.status === "ACTIVE" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.active")}
                    </span>
                  )} */}
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  Jan 16, 2025
                </TableCell>
              </TableRow>
            </DrawerTrigger>
            <Information></Information>
          </Drawer>

          <Drawer direction="right">
            <DrawerTrigger asChild>
              <TableRow>
                <TableCell
                  className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                >
                  <span className={"cursor-pointer"}>Marie Jean-Louis</span>
                </TableCell>
                <TableCell className="py-6">
                  {/* {order?.status === "GENERAL" && ( */}
                  {/* <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EF1870]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("activity.resume.attendance.tickets.general")}
                  </span> */}
                  {/* )} */}
                  {/* {order?.status === "VIP" && ( */}
                  <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#7A19C7]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("activity.resume.attendance.tickets.vip")}
                  </span>
                  {/* )} */}
                  {/* {order?.status === "PREMIUM" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#2E3237]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("activity.resume.attendance.tickets.premium")}
                    </span>
                  )} */}
                </TableCell>
                <TableCell
                  className={
                    "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                  }
                >
                  400 HTG
                </TableCell>
                <TableCell className="py-6">
                  {/* {order?.status === "ONGOING" && ( */}
                  <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("activity.resume.attendance.status.check-in")}
                  </span>
                  {/* )} */}
                  {/* {order?.status === "PAST" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#3F3F3F]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.past")}
                    </span>
                  )}
                  {order?.status === "UPCOMING" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.upcoming")}
                    </span>
                  )}
                  {order?.status === "ACTIVE" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.active")}
                    </span>
                  )} */}
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  Jan 16, 2025
                </TableCell>
              </TableRow>
            </DrawerTrigger>
            <Information></Information>
          </Drawer>

          <Drawer direction="right">
            <DrawerTrigger asChild>
              <TableRow>
                <TableCell
                  className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                >
                  <span className={"cursor-pointer"}>Marie Jean-Louis</span>
                </TableCell>
                <TableCell className="py-6">
                  {/* {order?.status === "GENERAL" && ( */}
                  {/* <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EF1870]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("activity.resume.attendance.tickets.general")}
                  </span> */}
                  {/* )} */}
                  {/* {order?.status === "VIP" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#7A19C7]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("activity.resume.attendance.tickets.vip")}
                    </span>
                  )} */}
                  {/* {order?.status === "PREMIUM" && ( */}
                  <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#2E3237]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("activity.resume.attendance.tickets.premium")}
                  </span>
                  {/* )} */}
                </TableCell>
                <TableCell
                  className={
                    "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                  }
                >
                  400 HTG
                </TableCell>
                <TableCell className="py-6">
                  {/* {order?.status === "ONGOING" && ( */}
                  <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("activity.resume.attendance.status.check-in")}
                  </span>
                  {/* )} */}
                  {/* {order?.status === "PAST" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#3F3F3F]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.past")}
                    </span>
                  )}
                  {order?.status === "UPCOMING" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.upcoming")}
                    </span>
                  )}
                  {order?.status === "ACTIVE" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.active")}
                    </span>
                  )} */}
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                  }
                >
                  Jan 16, 2025
                </TableCell>
              </TableRow>
            </DrawerTrigger>
            <Information></Information>
          </Drawer>
        </TableBody>
      </Table>
    </TabsContent>
  );
}
