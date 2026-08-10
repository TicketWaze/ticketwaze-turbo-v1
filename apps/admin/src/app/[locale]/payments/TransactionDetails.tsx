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
import { ButtonAccent } from "@/components/shared/buttons";
import { Order } from "@ticketwaze/typescript-config";

/**
 * An event date is a naive calendar day stored as midnight UTC, so it is read
 * back in UTC — formatting it in the viewer's zone slides it a day earlier
 * anywhere west of Greenwich.
 */
function formatDate(d: unknown, timeZone = "UTC") {
  return new Date(d as string).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  });
}

/**
 * For real instants (payment date, check-in time) the viewer's own zone is the
 * right frame, so `timeZone` is left off. A raffle draw passes its own zone.
 */
function formatDateTime(d: unknown, timeZone?: string) {
  const date = new Date(d as string);
  const zone = timeZone ? { timeZone } : {};
  return `${date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", ...zone })}, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", ...zone })}`;
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

export default function TransactionDetails({ order }: { order: Order }) {
  const t = useTranslations("Payments.transaction_details");

  const firstTicket = order.tickets?.[0];
  const activity = order.activity;
  const isRaffle = activity?.activityType === "raffle";

  const attendeeName = firstTicket?.fullName ?? "—";
  const attendeeEmail = firstTicket?.email ?? "—";

  /**
   * Read off the order's normalized activity. Every field here used to come
   * from `order.tickets[0].event`, which is null for a raffle order — that null
   * is what rendered this whole drawer as dashes.
   */
  const activityDate = isRaffle
    ? // A draw is a correct UTC instant, so it is CONVERTED into the raffle's
      // zone rather than re-labelled the way a naive event date is.
      activity?.drawAt
      ? formatDateTime(activity.drawAt, activity.timezone ?? "UTC")
      : "—"
    : activity?.eventDate
      ? formatDate(activity.eventDate)
      : "—";

  const eventTime =
    activity?.startTime && activity?.endTime
      ? `${activity.startTime} - ${activity.endTime}`
      : "—";

  const address =
    activity?.eventCategory === "meet"
      ? "Google Meet"
      : [activity?.address, activity?.city, activity?.state, activity?.country]
          .filter(Boolean)
          .join(", ") || "—";

  const currency = activity?.currency ?? "HTG";
  const orderTotal =
    currency === "HTG"
      ? order.amount.toLocaleString()
      : order.usdPrice.toLocaleString();

  const ticketPrice = firstTicket
    ? currency === "HTG"
      ? firstTicket.ticketPrice.toLocaleString()
      : firstTicket.ticketUsdPrice.toLocaleString()
    : "—";

  const ticketTypeColor = getTicketTypeColor(firstTicket?.ticketType ?? "");
  const txStatusStyle = getTransactionStatusStyle(order.status);

  const checkStatus = firstTicket?.status ?? "—";
  const checkTime =
    firstTicket?.status === "CHECKED"
      ? formatDateTime(firstTicket.updatedAt)
      : "—";

  return (
    <DrawerContent className={"my-8 p-12 rounded-[30px] w-full"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-16"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-12 text-black"
            }
          >
            {t("title")}
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
                {t("attendee")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {attendeeName}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("email")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {attendeeEmail}
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
                {t("activity")}
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
                  {t("activity_type")}
                  <span className={"text-deep-100 font-medium leading-8"}>
                    {isRaffle ? t("type_raffle") : t("type_event")}
                  </span>
                </p>
              )}
              <ul className="flex flex-col gap-6 w-full">
                <li>
                  <p
                    className={
                      "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                    }
                  >
                    {isRaffle ? t("draw_date") : t("date")}
                    <span className={"text-deep-100 font-medium leading-8"}>
                      {activityDate}
                    </span>
                  </p>
                  {/* A draw is a single moment and a raffle has no venue, so the
                      start/end and location rows are dropped rather than shown
                      as dashes. */}
                  {!isRaffle && (
                    <p
                      className={
                        "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                      }
                    >
                      {t("time")}
                      <span className={"text-deep-100 font-medium leading-8"}>
                        {eventTime}
                      </span>
                    </p>
                  )}
                </li>
              </ul>
              {!isRaffle && (
              <p
                className={
                  "flex justify-between items-start text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("location")}
                <span
                  className={
                    "text-deep-100 font-medium leading-8 max-w-[39.9rem] text-right"
                  }
                >
                  {address}
                </span>
              </p>
              )}
            </div>
            <Separator />
            {/* ticket info */}
            <div className={"w-full flex flex-col gap-8 py-6"}>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] text-neutral-600"
                }
              >
                {t("class")}
                <span
                  className={
                    "text-deep-100 flex items-center gap-4 font-medium leading-6"
                  }
                >
                  {order.tickets?.length ?? 1}X
                  <span
                    style={{ color: ticketTypeColor }}
                    className="py-[0.3rem] px-2 bg-neutral-200 font-bold rounded-[30px] text-[11px] uppercase"
                  >
                    {firstTicket?.ticketType ?? "—"}
                  </span>
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("price")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {ticketPrice} {currency}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("ticket_id")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {firstTicket?.ticketName ?? "—"}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("total")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {orderTotal} {currency}
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
                {t("transaction_id")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {order.orderName}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("payment_method")}
                <span
                  className={"text-deep-100 font-medium leading-8 capitalize"}
                >
                  {order.provider}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("payment_date")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  {formatDateTime(order.createdAt)}
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("transaction_status")}
                <span
                  style={{ color: txStatusStyle.color }}
                  className="py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-neutral-200"
                >
                  {order.status}
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
                {t("check_status")}
                <span className={"text-deep-100 font-medium leading-8"}>
                  <span
                    className={`py-[0.3rem] text-[1.1rem] font-bold leading-6 text-center uppercase px-2 rounded-[30px] bg-neutral-200 ${checkStatus === "CHECKED" ? "text-success" : "text-neutral-500"}`}
                  >
                    {checkStatus}
                  </span>
                </span>
              </p>
              <p
                className={
                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                }
              >
                {t("check_time")}
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
        <DrawerClose asChild className={"flex-1 cursor-pointer"}>
          <ButtonAccent className={"w-full"}>{t("close")}</ButtonAccent>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  );
}
