"use client";
import { motion } from "framer-motion";
import {
  ArrowRight2,
  Card,
  InfoCircle,
  MoneyRecive,
  ShieldSecurity,
} from "iconsax-reactjs";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Event, EventTicketType } from "@ticketwaze/typescript-config";
import moncash from "../moncash.svg";
import { FeeBreakdown, PaymentType, SelectedTicket } from "../checkout.types";
import TicketSummaryCard from "../TicketSummaryCard";

interface Props {
  delta: number;
  isFree: boolean;
  paymentType: PaymentType;
  onSelectPayment: (type: PaymentType) => void;
  selectedWithIndex: SelectedTicket[];
  ticketTypes: EventTicketType[];
  event: Event;
  feeBreakdown: FeeBreakdown;
}

export default function PaymentStep({
  delta,
  isFree,
  paymentType,
  onSelectPayment,
  selectedWithIndex,
  ticketTypes,
  event,
  feeBreakdown,
}: Props) {
  const t = useTranslations("Checkout");

  const optionClass = (type: PaymentType) =>
    `flex items-center justify-between cursor-pointer p-[15px] rounded-[15px] border transition-all ease-in-out duration-300 ${
      paymentType === type
        ? "border-2 border-primary-500 bg-primary-50"
        : "border-neutral-100 hover:border-primary-500"
    }`;

  return (
    <motion.div
      initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-8 lg:overflow-y-auto lg:min-h-0"
    >
      <div className="flex flex-col gap-4">
        {isFree ? (
          <div className="flex flex-col items-start gap-4 p-[15px] rounded-[15px] border border-neutral-100 text-[1.5rem] leading-12 text-neutral-700">
            <InfoCircle size="20" color="#E45B00" />
            {t("payment.nopayment")}
          </div>
        ) : (
          <>
            <button
              className={optionClass("wallet")}
              onClick={() => onSelectPayment("wallet")}
            >
              <div className="flex items-center gap-4">
                <MoneyRecive size="20" color="#0d0d0d" variant="Bulk" />
                <span className="font-semibold text-[1.6rem] leading-[22px] text-deep-100">
                  {t("payment.wallet")}
                </span>
              </div>
              <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
            </button>

            <button
              className={optionClass("moncash")}
              onClick={() => onSelectPayment("moncash")}
            >
              <div className="flex items-center gap-4">
                <Image src={moncash} alt="Logo of moncash" />
                <span className="font-semibold text-[1.6rem] leading-[22px] text-deep-100">
                  {t("payment.moncash")}
                </span>
              </div>
              <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
            </button>

            <button
              className={optionClass("card")}
              onClick={() => onSelectPayment("card")}
            >
              <div className="flex items-center gap-4">
                <Card size="20" color="#0d0d0d" variant="Bulk" />
                <span className="font-semibold text-[1.6rem] leading-[22px] text-deep-100">
                  {t("payment.card")}
                </span>
              </div>
              <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
            </button>

            <div className="flex flex-col items-start gap-4 p-[15px] rounded-[15px] border border-neutral-100 text-[1.2rem] leading-8 text-neutral-700">
              <ShieldSecurity size="20" color="#E45B00" />
              {t("payment.secured")}
            </div>
          </>
        )}
      </div>
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
