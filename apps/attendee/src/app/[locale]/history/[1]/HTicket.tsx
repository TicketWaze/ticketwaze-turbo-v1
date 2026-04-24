import Image from "next/image";
import ticketBG from "./ticket-bg.svg";
import Logo from "@ticketwaze/ui/assets/images/logo-simple-orange.svg";
import { useLocale, useTranslations } from "next-intl";
import FormatDate from "@/lib/FormatDate";
import { Warning2 } from "iconsax-reactjs";
import { Event, Ticket } from "@ticketwaze/typescript-config";
import Capitalize from "@/lib/Capitalize";
import formatTime from "@/lib/formatTime";

export default function HTicket({
  ticket,
  event,
}: {
  ticket: Ticket;
  event: Event;
}) {
  const t = useTranslations("Event");
  const locale = useLocale();
  const isFree = ticket.ticketPrice === 0 || ticket.ticketUsdPrice === 0;
  return (
    <div className="flex flex-col gap-8 h-200 bg-linear-to-b from-neutral-50/10 to-neutral-100/50  lg:h-[68.1rem] relative shadow-[0_15px_25px_0_rgba(0,0,0,0.05)]">
      <Image src={ticketBG} alt={"ticket bg"} className="h-full w-full" />
      <div
        className={
          "px-16 absolute top-0 w-full lg:px-4 left-[50%] -translate-x-[50%] flex flex-col items-center gap-8"
        }
      >
        <span
          className={
            "font-primary font-medium pt-4 text-[2.2rem] leading-12 text-black"
          }
        >
          {t("ticket")}
        </span>
        <div
          className={
            "w-full h-110 lg:h-136 relative rounded-[5px]  bg-neutral-100 p-6 pt-0 text-center font-mono text-[1.4rem] flex flex-col justify-between items-center "
          }
        >
          <Image
            src={Logo}
            alt="Ticketwaze"
            className="absolute w-full h-full opacity-10"
          />

          <div
            className={
              "flex items-center justify-between pt-6 gap-4 w-full"
            }
          >
            <span className="text-neutral-600">
              1x {Capitalize(ticket.ticketType)}
            </span>
            {isFree ? (
              <span className="text-deep-100 font-medium">{t("free")}</span>
            ) : (
              `${event.currency === "USD" ? ticket.ticketUsdPrice : ticket.ticketPrice} ${event.currency}`
            )}
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="h-[0.2rem] w-full rounded-[10px] bg-neutral-200"></div>
            <div className={"flex items-center justify-between gap-4 w-full"}>
              <span className="text-neutral-600">{t("ticketId")}</span>
              <span className="text-primary-500 font-medium">
                {ticket.ticketName}
              </span>
            </div>
            
            <div className="h-[0.2rem] w-full rounded-[10px] bg-neutral-200"></div>
            <div className={"flex items-center justify-between gap-4 w-full"}>
              <span className="text-neutral-600">{t("date")}</span>
              <span className="text-deep-100 font-medium">
                {FormatDate(
                  event.eventDays.filter((day) => day.dayNumber === 1)[0]
                    .eventDate,
                  locale,
                  event.eventDays.filter((day) => day.dayNumber === 1)[0]
                    .timezone,
                )}
              </span>
            </div>
            <div className={"flex items-center justify-between gap-4 w-full"}>
              <span className="text-neutral-600">{t("time")}</span>
              <span className="text-deep-100 font-medium">
                {formatTime(
                  event.eventDays.filter((day) => day.dayNumber === 1)[0]
                    .startTime,
                  event.eventDays.filter((day) => day.dayNumber === 1)[0]
                    .timezone,
                  locale,
                )}{" "}
                -{" "}
                {formatTime(
                  event.eventDays.filter((day) => day.dayNumber === 1)[0]
                    .endTime,
                  event.eventDays.filter((day) => day.dayNumber === 1)[0]
                    .timezone,
                  locale,
                )}
              </span>
            </div>
            {event.eventCategory !== "meet" && (
              <div className={"flex items-center justify-between gap-4 w-full"}>
                <span className="text-neutral-600">{t("location")}</span>
                <span className="text-deep-100 font-medium text-right">
                  {event.address}
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Your ticket is unique and linked to your personal access. Please do not
        share it with others, as it may compromise your entry or benefits. Keep
        it safe and secure. */}
      </div>
      <div
        className={
          "absolute bottom-[7%] h-[8.3rem] left-[50%] -translate-x-[50%] flex flex-col gap-8"
        }
      >
        <div className={"flex flex-col gap-4 justify-center flex-wrap"}>
          <span
            className={
              "text-primary-500 text-[1.4rem] leading-8 px-6 py-2 bg-primary-50 rounded-[20px]"
            }
          >
            {Capitalize(ticket.ticketType)}
          </span>
          {isFree ? (
            <span
              className={
                "font-primary text-center font-medium text-[28px] leading-[3.2rem] text-[#000]"
              }
            >
              {t("free")}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
