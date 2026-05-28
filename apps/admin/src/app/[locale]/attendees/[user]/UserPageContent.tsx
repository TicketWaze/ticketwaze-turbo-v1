/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import AdminLayout from "@/components/Layouts/AdminLayout";
import BackButton from "@/components/shared/BackButton";

import { ButtonRed, ButtonPrimary } from "@/components/shared/buttons";
import Separator from "@/components/shared/Separator";
import { DateTime } from "luxon";
import Image from "next/image";
import image from "@ticketwaze/ui/assets/icons/image.svg";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import Informations from "./Informations";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { Input, TextArea } from "@/components/shared/Inputs";
import Rema from "@ticketwaze/ui/assets/images/rema.png";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Import } from "iconsax-reactjs";

export const mockEvents: any[] = [
  {
    eventId: "1",
    organisationId: "org-1",
    eventName: "Summer Festival",
    eventDescription: "Big summer event",
    address: "123 Street",
    state: "Ouest",
    city: "Port-au-Prince",
    country: "Haiti",
    location: { lat: 18.5944, lng: -72.3074 },
    eventImageUrl: Rema.src,
    eventType: "physical",
    eventCategory: "music",
    adminStatus: "approved",
    isActive: true,
    isFree: false,
    currency: "HTG",
    activityTags: ["party", "summer"],
    eventDays: [
      {
        eventDayId: "day-1",
        eventId: "1",
        organisationId: "org-1",
        dayNumber: 1,
        eventDate: new Date().toISOString(),
        timezone: "America/Port-au-Prince",
        startTime: "18:00",
        endTime: "23:00",
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
    ],
    eventTicketTypes: [],
    eventTagId: "tag-1",
    googleMeetLink: "",
    googleCalendarEventId: "",
    discountCodes: [],
    eventPerformers: [],
    eventAttendees: [],
    tickets: [],
    orders: [],
    organisation: {} as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    eventId: "2",
    organisationId: "org-1",
    eventName: "Tech Conference",
    eventDescription: "Learn tech",
    address: "456 Avenue",
    state: "Ouest",
    city: "Port-au-Prince",
    country: "Haiti",
    location: { lat: 18.55, lng: -72.33 },
    eventImageUrl: "/images/event2.jpg",
    eventType: "virtual",
    eventCategory: "tech",
    adminStatus: "approved",
    isActive: true,
    isFree: true,
    currency: "USD",
    activityTags: ["coding"],
    eventDays: [],
    eventTicketTypes: [],
    eventTagId: "tag-2",
    googleMeetLink: "https://meet.google.com/test",
    googleCalendarEventId: "",
    discountCodes: [],
    eventPerformers: [],
    eventAttendees: [],
    tickets: [],
    orders: [],
    organisation: {} as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function UserPageContent() {
  const t = useTranslations("Attendees.profile");

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 h-full overflow-hidden">
        <BackButton text={t("back")}></BackButton>
        <div className="mb-6 flex justify-between items-center">
          <h2 className="items-center font-primary leading-12 font-medium text-[2.6rem]">
            {t("title")}
          </h2>
          <div className="flex gap-4 items-center h-fit">
            <ButtonRed className="py-[7.5px]">{t("button.suspend")}</ButtonRed>
            <ButtonPrimary className="py-[7.5px]">
              {t("button.edit")}
            </ButtonPrimary>
          </div>
        </div>
        <main className="w-full grid grid-cols-[15fr_21fr] gap-16 min-h-0">
          <div className="w-full flex flex-col gap-8 overflow-y-auto min-h-0 ]">
            <form className="flex flex-col gap-12 w-full pb-4 overflow-x-hidden">
              <div className="w-full bg-primary-500 p-6 rounded-[20px] flex gap-10">
                <div className="w-40 h-40 rounded-[25px] bg-neutral-300"></div>
                <div className="flex flex-col justify-between">
                  <span className="text-[2.6rem] text-white font-medium leading-12 capitalize">
                    Jean Louis
                  </span>
                  <div className="bg-deep-100 flex gap-2 p-4 rounded-[100px] text-center text-white font-semibold text-[1.4rem]">
                    <Image src={image} alt="image" width={15} height={12} />
                    <span>{t("change_profile")}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <h3 className="text-deep-100 font-primary font-medium text-[1.8rem] leading-10">
                  {t("information")}
                </h3>

                <div className={"flex gap-6"}>
                  <Input type="text" disabled readOnly>
                    Jean
                  </Input>
                  <Input type="text" disabled readOnly>
                    Louis
                  </Input>
                </div>

                <Input type="email" disabled readOnly>
                  jeanlouis@gmail.com{" "}
                </Input>

                <Input type="text" disabled readOnly>
                  @jeanty
                </Input>

                <Input type="text" disabled readOnly>
                  15 Rue Toussaint Louverture
                </Input>

                <div className={"flex gap-6"}>
                  <Select defaultValue="first" disabled>
                    <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] p-8 border-none w-full text-[1.4rem] text-neutral-700 leading-8">
                      <SelectValue placeholder="Cap-Haïtien" />
                    </SelectTrigger>
                    <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                      <SelectGroup>
                        <SelectItem
                          className={"text-[1.4rem] text-deep-100"}
                          value="first"
                        >
                          Nord
                        </SelectItem>
                        <SelectItem
                          className={"text-[1.4rem] text-deep-100"}
                          value="second"
                        >
                          Ouest
                        </SelectItem>
                        <SelectItem
                          className={"text-[1.4rem] text-deep-100"}
                          value="third"
                        >
                          Sud
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="first" disabled>
                    <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] p-8 border-none w-full text-[1.4rem] text-neutral-700 leading-8">
                      <SelectValue placeholder="Cap-Haïtien" />
                    </SelectTrigger>
                    <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                      <SelectGroup>
                        <SelectItem
                          className={"text-[1.4rem] text-deep-100"}
                          value="first"
                        >
                          Cap-Haïtien
                        </SelectItem>
                        <SelectItem
                          className={"text-[1.4rem] text-deep-100"}
                          value="second"
                        >
                          P-au-P
                        </SelectItem>
                        <SelectItem
                          className={"text-[1.4rem] text-deep-100"}
                          value="third"
                        >
                          Les Cayes
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  type="date"
                  disabled
                  readOnly
                  children={undefined}
                ></Input>
                <Select defaultValue="first" disabled>
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] p-8 border-none w-full text-[1.4rem] text-neutral-700 leading-8">
                    <SelectValue placeholder="Male" />
                  </SelectTrigger>
                  <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                    <SelectGroup>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="first"
                      >
                        Male
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="second"
                      >
                        Female
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select defaultValue="first" disabled>
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] p-8 border-none w-full text-[1.4rem] text-neutral-700 leading-8">
                    <SelectValue placeholder="O+" />
                  </SelectTrigger>
                  <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                    <SelectGroup>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="first"
                      >
                        O-
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="second"
                      >
                        AB-
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="third"
                      >
                        AB+
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </form>
            <div></div>
            <div></div>
            <div></div>
          </div>

          <div className="min-h-[75vh]">
            <Tabs defaultValue="summary" className="w-full h-full">
              <TabsList className={"w-full lg:w-fit mx-auto lg:mx-0 mb-8"}>
                <TabsTrigger value="summary">{t("summary.title")}</TabsTrigger>
                <TabsTrigger value="ticket_history">
                  {t("ticket_history.title")}
                </TabsTrigger>
              </TabsList>
              <TicketHistory />
              <ActivitySummary />
            </Tabs>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}

function ActivitySummary() {
  const t = useTranslations("Attendees.profile");
  return (
    <TabsContent value="summary" className="">
      <ul className="flex flex-col pt-4 gap-8 overflow-y-scroll">
        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
            {t("summary.count")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
            5
          </span>
        </li>

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
            {t("summary.total_ticket_bought")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
            12
          </span>
        </li>

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
            {t("summary.missed")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
            0
          </span>
        </li>

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
            {t("summary.total_spent")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
            7,320 HTG
          </span>
        </li>

        <Separator />

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
            {t("summary.joined_on")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
            20th August 2024
          </span>
        </li>
      </ul>
    </TabsContent>
  );
}

function TicketHistory() {
  const t = useTranslations("Attendees.profile.ticket_history");
  return (
    <TabsContent value="ticket_history" className="flex flex-col gap-8">
      <div className="flex justify-end">
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
                  {t("filters.period")}
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
              {t("table.name")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.class")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.amount")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.status")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("table.purchase")}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: 4 }).map((_, index) => (
            <Drawer key={index} direction="right">
              <DrawerTrigger asChild>
                <TableRow>
                  <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                    <span className="cursor-pointer">Marie Jean-Louis</span>
                  </TableCell>
                  <TableCell className="py-6">
                    <span className="py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#EF1870] px-2 rounded-[30px] bg-[#f5f5f5]">
                      {t("tickets.general")}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900">
                    400 HTG
                  </TableCell>
                  <TableCell className="py-6">
                    <span className="py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E] px-2 rounded-[30px] bg-[#f5f5f5]">
                      {t("status.check-in")}
                    </span>
                  </TableCell>
                  <TableCell className="text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900">
                    Jan 16, 2025
                  </TableCell>
                </TableRow>
              </DrawerTrigger>
              <Informations />
            </Drawer>
          ))}
        </TableBody>
      </Table>
    </TabsContent>
  );
}
