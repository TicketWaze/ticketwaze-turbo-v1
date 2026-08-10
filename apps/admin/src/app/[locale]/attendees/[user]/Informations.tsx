"use client";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslations, useLocale } from "next-intl";
import Separator from "@/components/shared/Separator";
import { ButtonAccent, ButtonPrimary } from "@/components/shared/buttons";
import { Ticket } from "@ticketwaze/typescript-config";
import { formatTicketPrice } from "./UserPageContent";
import formatDate from "@/lib/FormatDate";
import formatTime from "@/lib/formatTime";

export default function TicketDetails({ ticket }: { ticket: Ticket }) {
  const t = useTranslations("Attendees.profile");
  const locale = useLocale();

  const activity = ticket.activity;
  const order = ticket.order;
  const isRaffle = activity?.activityType === "raffle";
  // The normalized summary, not `ticket.event` — a raffle entry has no `events`
  // row, so that path left this drawer blank.
  const hasEventSchedule = Boolean(
    !isRaffle && activity?.eventDate && activity?.startTime && activity?.endTime,
  );
  const location = [activity?.address, activity?.city, activity?.country]
    .filter(Boolean)
    .join(", ");

  const ticketStatusColor =
    ticket.status === "CHECKED"
      ? "text-success"
      : ticket.status === "RETURNED"
        ? "text-failure"
        : "text-warning";

  return (
    <DrawerContent className={"my-8 p-12 rounded-[30px] w-full"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-16"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-12 text-black"
            }
          >
            {t("Ticket.details.title")}
          </span>
        </DrawerTitle>
        <DrawerDescription asChild className="w-full">
          <div>
            <div className={"w-full flex flex-col gap-8 pb-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("Ticket.details.attendee")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {ticket.fullName}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("Ticket.details.mail")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {ticket.email}
                </span>
              </p>
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8 py-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("Ticket.details.activity")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {activity?.name ?? "—"}
                </span>
              </p>
              {activity && (
                <p
                  className={
                    "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                  }
                >
                  {t("Ticket.details.activity_type")}
                  <span className={"text-deep-100 font-medium leading-8"}>
                    {isRaffle
                      ? t("Ticket.details.type_raffle")
                      : t("Ticket.details.type_event")}
                  </span>
                </p>
              )}
              {/* A draw is a single moment in the raffle's own zone, so it gets
                  one row instead of the event's date + start/end pair. */}
              {isRaffle && activity?.drawAt && (
                <p
                  className={
                    "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                  }
                >
                  {t("Ticket.details.draw_date")}
                  <span className={"text-deep-100 font-medium leading-8"}>
                    {new Date(activity.drawAt).toLocaleString(locale, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: activity.timezone ?? "UTC",
                    })}
                  </span>
                </p>
              )}
              {hasEventSchedule && (
                <ul className="flex flex-col gap-6 w-full">
                  <li>
                    <p
                      className={
                        "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                      }
                    >
                      {t("Ticket.details.date")}
                      <span className={"text-deep-100 font-medium leading-8"}>
                        {formatDate(activity!.eventDate!, locale, "local")}
                      </span>
                    </p>
                    <p
                      className={
                        "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                      }
                    >
                      {t("Ticket.details.time")}
                      <span className={"text-deep-100 font-medium leading-8"}>
                        {formatTime(
                          activity!.startTime!,
                          activity!.timezone ?? "UTC",
                          locale,
                        )}{" "}
                        -{" "}
                        {formatTime(
                          activity!.endTime!,
                          activity!.timezone ?? "UTC",
                          locale,
                        )}
                      </span>
                    </p>
                  </li>
                </ul>
              )}
              {/* A raffle has no venue — its optional location is a map pin. */}
              {!isRaffle && (
                <p
                  className={
                    "flex justify-between items-start text-[1.4rem] leading-8 text-neutral-600"
                  }
                >
                  {t("Ticket.details.location")}
                  <span
                    className={
                      "text-deep-100 font-medium leading-8 max-w-[39.9rem] text-right"
                    }
                  >
                    {location || "—"}
                  </span>
                </p>
              )}
            </div>
            <Separator />
            <div className={"w-full flex flex-col gap-8 py-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] text-neutral-600"
                }
              >
                {t("Ticket.details.class")}
                <span
                  className={
                    "text-deep-100 flex items-center gap-4 font-medium leading-6"
                  }
                >
                  <span
                    className={`py-[0.3rem] px-2 bg-neutral-200 text-[#EF1870] font-bold rounded-[30px] text-[11px]`}
                  >
                    {ticket.ticketType.toUpperCase()}
                  </span>
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("Ticket.details.price")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {formatTicketPrice(ticket, locale)}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("Ticket.details.id")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  #{ticket.ticketId.slice(0, 12).toUpperCase()}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("Ticket.details.total")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {formatTicketPrice(ticket, locale)}
                </span>
              </p>
            </div>
            {order && (
              <>
                <Separator />
                <div className={"w-full flex flex-col gap-8 py-6"}>
                  <p
                    className={
                      "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                    }
                  >
                    {t("Ticket.details.transaction_id")}
                    <span className={"text-deep-100 font-medium leading-8"}>
                      #{order.orderId.slice(0, 12).toUpperCase()}
                    </span>
                  </p>
                  <p
                    className={
                      "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                    }
                  >
                    {t("Ticket.details.payment_method")}
                    <span className={"text-deep-100 font-medium leading-8"}>
                      {order.provider}
                    </span>
                  </p>
                  <p
                    className={
                      "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                    }
                  >
                    {t("Ticket.details.payment_date")}
                    <span className={"text-deep-100 font-medium leading-8"}>
                      {formatDate(
                        order.createdAt as unknown as string,
                        locale,
                        "local",
                      )}
                    </span>
                  </p>
                  <p
                    className={
                      "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                    }
                  >
                    {t("Ticket.details.transaction_status")}
                    <span className={"text-deep-100 font-medium leading-8"}>
                      {order.status}
                    </span>
                  </p>
                </div>
              </>
            )}
            <Separator />
            <div className={"w-full flex flex-col gap-8 py-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("Ticket.details.check_status")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  <span
                    className={`py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase ${ticketStatusColor} px-2 rounded-[30px] bg-neutral-200`}
                  >
                    {ticket.status}
                  </span>
                </span>
              </p>
              <div></div>
            </div>
          </div>
        </DrawerDescription>
      </div>

      <DrawerFooter>
        <div className={"flex gap-8"}>
          <DrawerClose asChild className={"flex-1 cursor-pointer"}>
            <ButtonAccent className={"w-full"}>
              {t("Ticket.cta.close")}
            </ButtonAccent>
          </DrawerClose>
          <ButtonPrimary className={"flex-1"}>
            {t("Ticket.cta.resend")}
          </ButtonPrimary>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
