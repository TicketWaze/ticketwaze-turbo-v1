"use client";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslations } from "next-intl";
import Separator from "@/components/shared/Separator";
import { ButtonAccent, ButtonPrimary } from "@/components/shared/buttons";
import { Ticket } from "@ticketwaze/typescript-config";

function formatDate(d: unknown) {
  return new Date(d as string).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(d: unknown) {
  const date = new Date(d as string);
  return `${date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

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

export default function TicketDetails({ ticket }: { ticket: Ticket }) {
  const t = useTranslations("Tickets");

  const event = ticket.event;
  const order = ticket.order;
  const firstDay = event?.eventDays?.[0];

  const eventDate = firstDay ? formatDate(firstDay.eventDate) : "—";
  const eventTime = firstDay
    ? `${firstDay.startTime} - ${firstDay.endTime}`
    : "—";
  const address =
    event?.eventCategory === "meet"
      ? "Google Meet"
      : [event?.address, event?.city, event?.state, event?.country]
          .filter(Boolean)
          .join(", ") || "—";

  const currency = event?.currency ?? "HTG";
  const displayPrice =
    currency === "HTG"
      ? ticket.ticketPrice.toLocaleString()
      : ticket.ticketUsdPrice.toLocaleString();

  const ticketTypeColor = getTicketTypeColor(ticket.ticketType ?? "");
  const txStatusStyle = order
    ? getTransactionStatusStyle(order.status)
    : { color: "#737c8a" };
  const checkTime =
    ticket.status === "CHECKED" ? formatDateTime(ticket.updatedAt) : "—";

  return (
    <DrawerContent className={"my-8 p-12 rounded-[30px] w-full"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-16"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-12 text-black"
            }
          >
            {t("ticket_details.title")}
          </span>
        </DrawerTitle>
        <DrawerDescription asChild className="w-full">
          <div>
            {/* attendee */}
            <div className={"w-full flex flex-col gap-8 pb-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.attendee")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {ticket.fullName}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.email")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {ticket.email}
                </span>
              </p>
            </div>
            <Separator />
            {/* event */}
            <div className={"w-full flex flex-col gap-8 py-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.activity")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {event?.eventName ?? "—"}
                </span>
              </p>
              <ul className="flex flex-col gap-6 w-full">
                <li>
                  <p
                    className={
                      "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                    }
                  >
                    {t("ticket_details.date")}
                    <span className={"text-deep-100 font-medium leading-8"}>
                      {eventDate}
                    </span>
                  </p>
                  <p
                    className={
                      "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                    }
                  >
                    {t("ticket_details.time")}
                    <span className={"text-deep-100 font-medium leading-8"}>
                      {eventTime}
                    </span>
                  </p>
                </li>
              </ul>
              <p
                className={
                  "flex justify-between items-start text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.location")}
                <span
                  className={
                    "text-deep-100 font-medium leading-8 max-w-[39.9rem] text-right"
                  }
                >
                  {address}
                </span>
              </p>
            </div>
            <Separator />
            {/* ticket info */}
            <div className={"w-full flex flex-col gap-8 py-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] text-neutral-600"
                }
              >
                {t("ticket_details.class")}
                <span
                  className={
                    "text-deep-100 flex items-center gap-4 font-medium leading-6"
                  }
                >
                  1X
                  <span
                    style={{ color: ticketTypeColor }}
                    className="py-[0.3rem] px-2 bg-neutral-200 font-bold rounded-[30px] text-[11px] uppercase"
                  >
                    {ticket.ticketType}
                  </span>
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.price")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {displayPrice} {currency}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.ticket_id")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  #{ticket.ticketId}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.total")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {displayPrice} {currency}
                </span>
              </p>
            </div>
            <Separator />
            {/* payment */}
            <div className={"w-full flex flex-col gap-8 py-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.transaction_id")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {order ? `#${order.orderId}` : "—"}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.payment_method")}
                <span
                  className={"text-deep-100 font-medium leading-8 capitalize"}
                >
                  {order?.provider ?? "—"}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.payment_date")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {order ? formatDateTime(order.createdAt) : "—"}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.transaction_status")}
                <span
                  style={{ color: txStatusStyle.color }}
                  className="py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-neutral-200"
                >
                  {order?.status ?? "—"}
                </span>
              </p>
            </div>
            <Separator />
            {/* check-in */}
            <div className={"w-full flex flex-col gap-8 py-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.check_status")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  <span
                    className={`py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-neutral-200 ${ticket.status === "CHECKED" ? "text-success" : "text-neutral-500"}`}
                  >
                    {ticket.status}
                  </span>
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_details.check_time")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {checkTime}
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
              {t("ticket_details.close")}
            </ButtonAccent>
          </DrawerClose>
          <ButtonPrimary className={"flex-1"}>
            {t("ticket_details.resend")}
          </ButtonPrimary>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
