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

interface Props {
  delta: number;
  fields: FieldArrayWithId<{ tickets: TicketFormData[] }, "tickets", "id">[];
  watchedTickets: TicketFormData[];
  ticketTypes: EventTicketType[];
  event: Event;
  isFree: boolean;
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
  isFree,
  selectedWithIndex,
  feeBreakdown,
  paymentType,
  setValue,
}: Props) {
  const t = useTranslations("Checkout");

  const [quantities, setQuantities] = useState<number[]>(() =>
    watchedTickets.map((t) => t.quantity),
  );

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
      className="flex flex-col gap-8 lg:overflow-y-auto lg:min-h-0"
    >
      <ul className="flex flex-col gap-8">
        {fields.map((field, index) => {
          const ticketType = ticketTypes[index];
          const quantity = quantities[index] ?? 0;
          const ticketLeft =
            ticketType.ticketTypeQuantity - ticketType.ticketTypeQuantitySold;

          return (
            <li
              key={field.id}
              className="border border-neutral-100 rounded-[15px] p-[15px] flex flex-col gap-4"
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
              {isFree ? (
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
              <div className="flex bg-neutral-100 items-center justify-between py-4 px-[1.5rem] rounded-[10px]">
                <span className="text-[1.5rem] text-neutral-900">
                  {t("ticket.quantity")}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={
                      isFree || event.eventType === "meet" || quantity === 0
                    }
                    className="w-[35px] h-[35px] disabled:cursor-not-allowed rounded-full bg-black flex items-center justify-center cursor-pointer"
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
                      isFree ||
                      event.eventType === "meet" ||
                      quantity === ticketLeft
                    }
                    className="w-[35px] h-[35px] disabled:cursor-not-allowed rounded-full bg-black flex items-center justify-center cursor-pointer"
                    onClick={() => increment(index, ticketLeft)}
                  >
                    <AddCircle size="20" color="#FFFFFF" variant="Bulk" />
                  </button>
                </div>
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
          isFree={isFree}
          feeBreakdown={feeBreakdown}
          paymentType={paymentType}
        />
      </div>
    </motion.div>
  );
}
