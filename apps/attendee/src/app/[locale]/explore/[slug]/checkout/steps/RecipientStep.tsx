"use client";
import React from "react";
import { motion } from "framer-motion";
import { Warning2 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Event, EventTicketType } from "@ticketwaze/typescript-config";
import Capitalize from "@/lib/Capitalize";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { Input } from "@/components/shared/Inputs";
import {
  AttendeeFormData,
  FeeBreakdown,
  GuestInfo,
  PaymentType,
  SelectedTicket,
} from "../checkout.types";
import TicketSummaryCard from "../TicketSummaryCard";

interface Props {
  delta: number;
  watchedAttendees: AttendeeFormData[];
  ticketTypes: EventTicketType[];
  event: Event;
  isFree: boolean;
  isGuest: boolean;
  guestInfo: GuestInfo;
  onGuestInfoChange: (info: GuestInfo) => void;
  selectedWithIndex: SelectedTicket[];
  feeBreakdown: FeeBreakdown;
  paymentType: PaymentType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: (name: string, options?: object) => any;
}

export default function RecipientStep({
  delta,
  watchedAttendees,
  ticketTypes,
  event,
  isFree,
  isGuest,
  guestInfo,
  onGuestInfoChange,
  selectedWithIndex,
  feeBreakdown,
  paymentType,
  register,
}: Props) {
  const t = useTranslations("Checkout");

  return (
    <motion.div
      initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-8 lg:overflow-y-auto lg:min-h-0"
    >
      {isGuest && (
        <div className="border border-neutral-100 rounded-[15px] flex flex-col gap-[1.5rem] p-[15px]">
          <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
            {t("recipient.your_info")}
          </span>
          <Input
            value={guestInfo.firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onGuestInfoChange({ ...guestInfo, firstName: e.target.value })
            }
          >
            {t("recipient.first_name")}
          </Input>
          <Input
            value={guestInfo.lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onGuestInfoChange({ ...guestInfo, lastName: e.target.value })
            }
          >
            {t("recipient.last_name")}
          </Input>
          <Input
            type="email"
            value={guestInfo.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onGuestInfoChange({ ...guestInfo, email: e.target.value })
            }
          >
            {t("recipient.email")}
          </Input>
        </div>
      )}
      <div className="flex flex-col gap-8">
        {watchedAttendees.map((attendee, attendeeIndex) => {
          const ticketType = ticketTypes.find(
            (tt) => tt.eventTicketTypeId === attendee?.ticketTypeId,
          );
          const sameTypeCount = watchedAttendees
            .slice(0, attendeeIndex)
            .filter((a) => a.ticketTypeId === attendee?.ticketTypeId).length;

          return (
            <div
              key={`attendee-${attendeeIndex}-${attendee.ticketTypeId}`}
              className="border border-neutral-100 rounded-[15px] flex flex-col gap-[1.5rem] p-[15px]"
            >
              <div className="flex items-center w-full justify-between font-semibold text-[1.6rem] leading-8 text-deep-100">
                <span>#{sameTypeCount + 1}</span>
                <span>
                  {ticketType
                    ? Capitalize(ticketType.ticketTypeName)
                    : "Unknown Ticket"}
                </span>
              </div>
              {isGuest ? (
                <div className="flex items-start gap-4 text-[1.2rem] leading-8 text-neutral-600 bg-neutral-100 rounded-[10px] py-4 px-[1.5rem]">
                  {t("recipient.guest_ticket_note")}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between py-4 px-[1.5rem] bg-neutral-100 rounded-[10px]">
                    <span className="text-[1.5rem] leading-12 text-neutral-900">
                      {t("recipient.someone")}
                    </span>
                    <label className="relative inline-block h-[30px] w-[50px] cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:_transparent] has-[:checked]:bg-primary-500">
                      <input
                        {...register(`attendees.${attendeeIndex}.isForSomeoneElse`)}
                        className="peer sr-only"
                        id={`attendee-${attendeeIndex}`}
                        type="checkbox"
                      />
                      <ToggleIcon />
                    </label>
                  </div>
                  {watchedAttendees[attendeeIndex]?.isForSomeoneElse && (
                    <div className="flex flex-col gap-3">
                      <Input {...register(`attendees.${attendeeIndex}.name`)}>
                        {t("recipient.name")}
                      </Input>
                      <Input {...register(`attendees.${attendeeIndex}.email`)}>
                        {t("recipient.email")}
                      </Input>
                      <div className="flex items-start gap-4 text-[1.2rem] leading-8 text-neutral-700">
                        <Warning2 size="20" color="#DE0028" />
                        {t("recipient.warning")}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
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
