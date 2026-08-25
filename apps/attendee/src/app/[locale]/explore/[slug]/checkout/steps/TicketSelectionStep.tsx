"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { AddCircle, MinusCirlce } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Event, EventTicketType } from "@ticketwaze/typescript-config";
import { FieldArrayWithId } from "react-hook-form";
import Capitalize from "@/lib/Capitalize";
import {
  FeeBreakdown,
  PaymentType,
  SelectedTicket,
  TicketFormData,
} from "../checkout.types";
import TicketSummaryCard from "../TicketSummaryCard";
import TicketSalesCountdown from "@/components/shared/TicketSalesCountdown";
import { isFreeTicketType } from "../checkoutUtils";

interface Props {
  delta: number;
  fields: FieldArrayWithId<{ tickets: TicketFormData[] }, "tickets", "id">[];
  watchedTickets: TicketFormData[];
  ticketTypes: EventTicketType[];
  event: Event;
  /**
   * EVERY tier on this activity is free.
   *
   * Not "this tier is free" — that is read per row from the tier's own price,
   * because an activity may now offer a free tier beside paid ones. This flag
   * only decides whether a free row shows a fixed quantity of 1 (an all-free
   * activity, where the seat is preselected and there is nothing to choose) or
   * a 0/1 stepper (a mixed activity, where taking the free ticket is a choice).
   */
  eventIsAllFree: boolean;
  selectedWithIndex: SelectedTicket[];
  feeBreakdown: FeeBreakdown;
  paymentType: PaymentType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: (name: string, value: any, options?: object) => void;
}

export default function TicketSelectionStep({
  delta,
  fields,
  watchedTickets,
  ticketTypes,
  event,
  eventIsAllFree,
  selectedWithIndex,
  feeBreakdown,
  paymentType,
  setValue,
}: Props) {
  const t = useTranslations("Checkout");

  const [quantities, setQuantities] = useState<number[]>(() =>
    watchedTickets.map((t) => t.quantity),
  );

  /**
   * Is the CURRENT cart a free claim? Only used for the summary card below, so
   * it shows "Free" rather than a total of 0 with fee lines under it. Recomputed
   * here rather than passed down because the parent's copy describes the same
   * cart and this component already holds everything it needs.
   */
  const selectionIsFree =
    selectedWithIndex.length > 0 &&
    selectedWithIndex.every((selected) => {
      const ticketType = ticketTypes.find(
        (tt) => tt.eventTicketTypeId === selected.ticketTypeId,
      );
      return ticketType ? isFreeTicketType(ticketType) : false;
    });

  const increment = (index: number, ticketLeft: number) => {
    const current = quantities[index] ?? 0;
    if (current >= ticketLeft) return;
    const next = current + 1;
    setQuantities((prev) => prev.map((q, i) => (i === index ? next : q)));
    setValue(`tickets.${index}.quantity`, next, { shouldValidate: true });
  };

  const decrement = (index: number) => {
    const current = quantities[index] ?? 0;
    if (current <= 0) return;
    const next = current - 1;
    setQuantities((prev) => prev.map((q, i) => (i === index ? next : q)));
    setValue(`tickets.${index}.quantity`, next, { shouldValidate: true });
  };

  return (
    <motion.div
      initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-8 lg:h-full lg:min-h-0 lg:overflow-y-auto"
    >
      <TicketSalesCountdown endsAt={event.ticketSalesEndAt} variant="full" />
      <ul className="flex flex-col gap-8">
        {[...fields.map((field, index) => ({ field, index, ticketType: ticketTypes[index] }))]
          .sort((a, b) => {
            const priceA = event.currency === "USD" ? (a.ticketType.usdPrice ?? 0) : (a.ticketType.ticketTypePrice ?? 0);
            const priceB = event.currency === "USD" ? (b.ticketType.usdPrice ?? 0) : (b.ticketType.ticketTypePrice ?? 0);
            return priceA - priceB;
          })
          .map(({ field, index, ticketType }) => {
          const quantity = quantities[index] ?? 0;
          const ticketLeft =
            ticketType.ticketTypeQuantity - ticketType.ticketTypeQuantitySold;
          // Per TIER: the price is the whole answer. On a mixed activity some
          // rows here are free while `event.isFree` is false.
          const tierIsFree = isFreeTicketType(ticketType);
          // One free ticket per person, so a free row never goes past 1.
          const maxSelectable = tierIsFree ? Math.min(1, ticketLeft) : ticketLeft;

          return (
            <li
              key={field.id}
              className="border border-neutral-100 rounded-[15px] p-6 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[1.6rem] leading-10 text-deep-100">
                    {Capitalize(ticketType.ticketTypeName)}
                  </span>
                  {ticketLeft <= 100 && ticketLeft !== 0 && (
                    <span className="text-[1.2rem] text-warning">
                      {ticketLeft} {t("ticket.left")}
                    </span>
                  )}
                  {ticketLeft === 0 && (
                    <span className="text-[1.2rem] text-failure">
                      {t("ticket.soldout")}
                    </span>
                  )}
                </div>
                <p className="text-[1.5rem] leading-12 text-neutral-700">
                  {ticketType.ticketTypeDescription}
                </p>
              </div>
              {tierIsFree ? (
                <span className="font-primary font-bold text-[1.8rem] leading-12 text-primary-500">
                  {t("free")}
                </span>
              ) : (
                <span className="font-primary font-bold text-[1.8rem] leading-12 text-primary-500">
                  {event.currency === "USD"
                    ? ticketType.usdPrice
                    : ticketType.ticketTypePrice}{" "}
                  {event.currency}
                </span>
              )}
              <div className="flex bg-neutral-100 items-center justify-between py-4 px-6 rounded-[10px]">
                <span className="text-[1.5rem] text-neutral-900">
                  {t("ticket.quantity")}
                </span>
                {tierIsFree && eventIsAllFree ? (
                  <span className="text-[1.5rem] leading-12 text-neutral-900 font-medium">
                    1
                  </span>
                ) : (
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      disabled={event.eventCategory === "meet" || quantity === 0}
                      className="w-14 h-14 disabled:cursor-not-allowed rounded-full bg-black flex items-center justify-center cursor-pointer"
                      onClick={() => decrement(index)}
                    >
                      <MinusCirlce size="20" color="#FFFFFF" variant="Bulk" />
                    </button>
                    <span className="text-[1.5rem] leading-12 text-neutral-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={
                        event.eventCategory === "meet" ||
                        quantity === maxSelectable
                      }
                      className="w-14 h-14 disabled:cursor-not-allowed rounded-full bg-black flex items-center justify-center cursor-pointer"
                      onClick={() => increment(index, maxSelectable)}
                    >
                      <AddCircle size="20" color="#FFFFFF" variant="Bulk" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="lg:hidden flex flex-col gap-8">
        <TicketSummaryCard
          selectedWithIndex={selectedWithIndex}
          ticketTypes={ticketTypes}
          event={event}
          isFree={selectionIsFree}
          feeBreakdown={feeBreakdown}
          paymentType={paymentType}
        />
      </div>
    </motion.div>
  );
}
