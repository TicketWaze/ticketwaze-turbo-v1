"use client";
import { motion } from "framer-motion";
import { Card, MoneyRecive, ShieldSecurity, Warning2 } from "iconsax-reactjs";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Event, EventTicketType } from "@ticketwaze/typescript-config";
import moncash from "../moncash.svg";
import Capitalize from "@/lib/Capitalize";
import { FeeBreakdown, PaymentType, SelectedTicket } from "../checkout.types";

interface Props {
  delta: number;
  event: Event;
  isFree: boolean;
  ticketTypes: EventTicketType[];
  selectedWithIndex: SelectedTicket[];
  paymentType: PaymentType;
  feeBreakdown: FeeBreakdown;
}

function PaymentMethodDisplay({
  type,
  label,
}: {
  type: PaymentType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-neutral-50 rounded-[12px] px-[1.5rem] py-[1.2rem]">
      {type === "wallet" && (
        <MoneyRecive size="18" color="#0d0d0d" variant="Bulk" />
      )}
      {type === "moncash" && (
        <Image src={moncash} alt="MonCash" className="h-[18px] w-auto" />
      )}
      {type === "card" && <Card size="18" color="#0d0d0d" variant="Bulk" />}
      <span className="text-[1.5rem] font-medium text-deep-100">{label}</span>
    </div>
  );
}

export default function SummaryStep({
  delta,
  event,
  isFree,
  ticketTypes,
  selectedWithIndex,
  paymentType,
  feeBreakdown,
}: Props) {
  const t = useTranslations("Checkout");
  const { subtotal, serviceFee, platformFee, total } = feeBreakdown;

  const paymentLabel =
    paymentType === "wallet"
      ? t("payment.wallet")
      : paymentType === "moncash"
        ? "MonCash"
        : paymentType === "card"
          ? t("payment.card")
          : "";

  return (
    <motion.div
      initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-8 lg:overflow-y-auto lg:min-h-0"
    >
      <div className="bg-white rounded-[20px] border border-neutral-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500/5 to-transparent border-b border-neutral-100 px-[2rem] py-[2rem]">
          <p className="text-[1.2rem] font-medium text-neutral-400 uppercase tracking-[0.08em]">
            {t("summary.title")}
          </p>
          <h3 className="font-primary font-semibold text-[2rem] text-deep-100 mt-[0.4rem] leading-snug">
            {event.eventName}
          </h3>
        </div>

        {/* Ticket items */}
        <div className="px-[2rem] py-[1.8rem] flex flex-col gap-[1.4rem] border-b border-dashed border-neutral-200">
          {selectedWithIndex.length > 0 ? (
            selectedWithIndex.map((ticket) => {
              const ticketType = ticketTypes.find(
                (tt) => tt.eventTicketTypeId === ticket.ticketTypeId,
              );
              const unitPrice = ticketType
                ? Number(
                    event.currency === "USD"
                      ? ticketType.usdPrice
                      : ticketType.ticketTypePrice,
                  )
                : 0;

              return (
                <div
                  key={ticket.ticketTypeId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-[28px] h-[28px] rounded-full bg-primary-50 text-primary-500 text-[1.2rem] font-semibold shrink-0">
                      {ticket.quantity}
                    </span>
                    <span className="text-[1.5rem] font-medium text-deep-100">
                      {ticketType
                        ? Capitalize(ticketType.ticketTypeName)
                        : "Unknown"}
                    </span>
                  </div>
                  {isFree ? (
                    <span className="text-[1.5rem] font-semibold text-primary-500">
                      {t("free")}
                    </span>
                  ) : (
                    <span className="text-[1.5rem] font-medium text-deep-100">
                      {(unitPrice * ticket.quantity).toFixed(2)}{" "}
                      {event.currency}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <span className="text-[1.4rem] text-neutral-400 text-center">
              No tickets selected
            </span>
          )}
        </div>

        {/* Fee breakdown — only for paid events */}
        {!isFree && selectedWithIndex.length > 0 && (
          <div className="px-[2rem] py-[1.8rem] flex flex-col gap-[1rem] border-b border-dashed border-neutral-200">
            <div className="flex items-center justify-between text-[1.4rem]">
              <span className="text-neutral-500">{t("summary.subtotal")}</span>
              <span className="text-deep-100 font-medium">
                {subtotal.toFixed(2)} {event.currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-[1.4rem]">
              <span className="text-neutral-500">
                {t("summary.service_fee")} (2.5%)
              </span>
              <span className="text-deep-100 font-medium">
                {serviceFee.toFixed(2)} {event.currency}
              </span>
            </div>
            {platformFee > 0 && (
              <div className="flex items-center justify-between text-[1.4rem]">
                <span className="text-neutral-500">
                  {t("summary.platform_fee")}
                </span>
                <span className="text-deep-100 font-medium">
                  {platformFee.toFixed(2)} {event.currency}
                </span>
              </div>
            )}
            {platformFee === 0 && (
              <div className="flex items-center justify-between text-[1.4rem]">
                <span className="text-neutral-500">
                  {t("summary.platform_fee")}
                </span>
                <span className="text-primary-500 font-medium text-[1.3rem]">
                  {t("summary.no_platform_fee")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <div className="px-[2rem] py-[2rem] flex items-center justify-between border-b border-neutral-100">
          <span className="font-primary font-semibold text-[1.8rem] text-deep-100">
            {t("summary.total")}
          </span>
          {isFree ? (
            <span className="font-primary font-bold text-[3rem] leading-none text-primary-500">
              {t("free")}
            </span>
          ) : (
            <span className="font-primary font-bold text-[3rem] leading-none text-primary-500">
              {total.toFixed(2)} {event.currency}
            </span>
          )}
        </div>

        {/* Payment method */}
        {!isFree && paymentType && (
          <div className="px-[2rem] py-[1.5rem] border-b border-neutral-100">
            <p className="text-[1.2rem] text-neutral-400 mb-[0.8rem] uppercase tracking-[0.06em]">
              {t("summary.via")}
            </p>
            <PaymentMethodDisplay type={paymentType} label={paymentLabel} />
          </div>
        )}

        {/* Non-refundable warning */}
        {ticketTypes[0] && !ticketTypes[0].isRefundable && (
          <div className="px-[2rem] py-[1.5rem] border-b border-neutral-100">
            <div className="flex items-start gap-3 text-[1.3rem] text-warning leading-7">
              <Warning2
                size="16"
                color="#ea961c"
                variant="TwoTone"
                className="mt-[0.2rem] shrink-0"
              />
              {t("ticket.ticketWarning")}
            </div>
          </div>
        )}

        {/* Security */}
        <div className="px-[2rem] py-[1.5rem] flex items-center gap-[0.8rem]">
          <ShieldSecurity size="15" color="#9ca3af" />
          <span className="text-[1.2rem] text-neutral-400">
            {t("summary.secured")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
