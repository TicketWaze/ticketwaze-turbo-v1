"use client";
import AdminLayout from "@/components/Layouts/AdminLayout";
import BackButton from "@/components/shared/BackButton";
import { motion } from "framer-motion";
import { Event } from "@ticketwaze/typescript-config";

import { ButtonRed, ButtonPrimary } from "@/components/shared/buttons";
import Separator from "@/components/shared/Separator";
import { DateTime } from "luxon";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { Input, TextArea } from "@/components/shared/Inputs";
import ActivitySummary from "./ActivitySummary";
import Rema from "@ticketwaze/ui/assets/images/rema.png";

export const mockEvents: Event[] = [
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
  const t = useTranslations("Organisations.profile");

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
            <form className="flex flex-col gap-20 w-full pb-4 overflow-x-hidden">
              <div className="flex flex-col gap-6">
                <h3 className="text-deep-100 font-primary font-medium text-[1.8rem] leading-10">
                  {t("profile")}
                </h3>

                <Input type="email" disabled readOnly>
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

                <div className={"flex gap-6"}>
                  <TextArea
                    value="Bringing the soul of Cap-Haïtien’s music scene to life through unforgettable performances and cultural celebrations, connecting local and international music lovers alike."
                    className="w-full h-60"
                    disabled
                    readOnly
                  >
                    {" "}
                    d{" "}
                  </TextArea>
                </div>

                <Input type="email" disabled readOnly>
                  musicalliance@haitijazz.com{" "}
                </Input>

                <Input type="text" disabled readOnly>
                  +509-555-1234
                </Input>

                <Input type="url" disabled readOnly>
                  Capmusicalliance.ht
                </Input>
              </div>
              <div className="flex flex-col gap-6">
                <h3 className="text-deep-100 font-primary font-medium text-[1.8rem] leading-10">
                  {t("information")}
                </h3>

                <Input type="email" disabled readOnly>
                  jean.pierre.louis@capmusic.com
                </Input>

                <Input type="tel" disabled readOnly>
                  +509-555-1234
                </Input>
                <Input type="text" disabled readOnly>
                  English
                </Input>
                {/* <Select defaultValue="first" disabled>
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] p-8 border-none w-full text-[1.4rem] text-neutral-700 leading-8">
                    <SelectValue placeholder="English" />
                  </SelectTrigger>
                  <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
                    <SelectGroup>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="first"
                      >
                        English
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="second"
                      >
                        French
                      </SelectItem>
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        value="third"
                      >
                        Spanish
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select> */}
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
                <TabsTrigger value="finance">{t("finance.title")}</TabsTrigger>
              </TabsList>
              <ActivitySummary events={mockEvents} />
              <Finance />
            </Tabs>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}

function Finance() {
  const t = useTranslations("Organisations.profile");
  return (
    <TabsContent value="finance" className="">
      <ul className="flex flex-col pt-4 gap-8 overflow-y-scroll">
        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
            {t("finance.total_ticket_sold")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
            19,845
          </span>
        </li>

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
            {t("finance.total_revenue")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
            203,758,125.90 HTG
          </span>
        </li>

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
            {t("finance.total_profit")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
            193,570,219 HTG
          </span>
        </li>

        <Separator />

        <li className="flex justify-between">
          <span className="text-[1.6rem] text-neutral-600 leading-[22.5px] ">
            {t("finance.balance")}
          </span>
          <span className="text-[1.6rem] text-deep-100 font-medium leading-8 ">
            193,570,219 HTG
          </span>
        </li>
      </ul>
    </TabsContent>
  );
}
