"use client";
import Slugify from "@/lib/Slugify";
import TimesTampToDateTime from "@/lib/TimesTampToDateTime";
import { Event } from "@ticketwaze/typescript-config";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Calendar2, Clock, Edit2, Location } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { LinkPrimary } from "@/components/shared/Links";

export default function EventDrawerContent({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event");
  const startDate = new Date(event.eventDays?.[0]?.dateTime ?? "");
  return (
    <DrawerContent className={"my-6 p-[30px] rounded-[30px]  lg:w-[580px]"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-[40px]"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black"
            }
          >
            {t("event_details")}
          </span>
        </DrawerTitle>
        <DrawerDescription className="sr-only">Event details</DrawerDescription>
        <div className={"w-full"}>
          <div className={"w-full gap-[30px] flex flex-col"}>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <Image
                alt={event.eventName}
                src={event.eventImageUrl}
                height={298}
                width={520}
                className={"rounded-[10px] h-[298px] object-cover object-top"}
              />
            </div>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <div className="flex items-center justify-between">
                <span
                  className={
                    "font-primary text-deep-100 font-medium text-[1.8rem]"
                  }
                >
                  {t("about")}
                </span>
              </div>
              <p className={"text-[1.5rem] text-neutral-700"}>
                {event.eventDescription}
              </p>
            </div>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <span
                className={
                  "font-primary text-deep-100 font-medium text-[1.8rem]"
                }
              >
                {t("event_details")}
              </span>
              <div className={"flex items-center gap-[5px]"}>
                <div
                  className={
                    "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                  }
                >
                  <Calendar2 size="20" color="#737c8a" variant="Bulk" />
                </div>
                <span
                  className={
                    "font-normal text-[1.4rem] leading-8 text-deep-200"
                  }
                >
                  {startDate.toDateString()}
                </span>
              </div>
              <div className={"flex items-center gap-[5px]"}>
                <div
                  className={
                    "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                  }
                >
                  <Clock size="20" color="#737c8a" variant="Bulk" />
                </div>
                <span
                  className={
                    "font-normal text-[1.4rem] leading-8 text-deep-200"
                  }
                >
                  {`${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").hour < 10 ? `0${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").hour}` : TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").hour}:${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").minute < 10 ? `0${TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").minute}` : TimesTampToDateTime(event.eventDays[0]?.dateTime ?? "").minute}`}
                </span>
              </div>
              <div className={"flex items-center gap-[5px] "}>
                <div
                  className={
                    "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                  }
                >
                  <Location size="20" color="#737c8a" variant="Bulk" />
                </div>
                <span
                  className={
                    "font-normal text-[1.4rem] leading-8 text-deep-200 max-w-[293px]"
                  }
                >
                  {event.address}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DrawerFooter className="lg:flex-row">
        <LinkPrimary
          href={`/events/show/${Slugify(event.eventName)}/edit/${event.eventType}`}
          className="flex-1 gap-4"
        >
          <Edit2 variant={"Bulk"} color={"#ffffff"} size={20} /> {t("edit")}
        </LinkPrimary>
        <DrawerClose className={" cursor-pointer w-full flex-1"}>
          <div
            className={
              "border-primary-500 text-primary-500 bg-primary-100 px-[3rem] py-[15px] border-2  rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-[20px] cursor-pointer transition-all duration-400 flex items-center justify-center "
            }
          >
            {t("close")}
          </div>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  );
}
