"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sms, Warning2 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Control, useWatch } from "react-hook-form";
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
  TicketFormData,
} from "../checkout.types";
import TicketSummaryCard from "../TicketSummaryCard";

interface AttendeeCardProps {
  attendeeIndex: number;
  ticketTypeName: string;
  sameTypeCount: number;
  isGuest: boolean;
  control: Control<{
    tickets: TicketFormData[];
    attendees: AttendeeFormData[];
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: (name: string, options?: object) => any;
}

function AttendeeCard({
  attendeeIndex,
  ticketTypeName,
  sameTypeCount,
  isGuest,
  control,
  register,
}: AttendeeCardProps) {
  const t = useTranslations("Checkout");

  // Subscribe directly to this attendee's toggle — bypasses prop-drilling re-render issue
  const isForSomeoneElse = useWatch({
    control,
    name: `attendees.${attendeeIndex}.isForSomeoneElse` as never,
  }) as unknown as boolean;

  return (
    <div className="border border-neutral-100 rounded-[15px] flex flex-col gap-6 p-6">
      <div className="flex items-center w-full justify-between font-semibold text-[1.6rem] leading-8 text-deep-100">
        <span>#{sameTypeCount + 1}</span>
        <span>{ticketTypeName}</span>
      </div>

      {isGuest ? (
        <div className="flex items-start gap-4 text-[1.2rem] leading-8 text-neutral-600 bg-neutral-100 rounded-[10px] py-4 px-6">
          {t("recipient.guest_ticket_note")}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between py-4 px-6 bg-neutral-100 rounded-[10px]">
            <span className="text-[1.5rem] leading-12 text-neutral-900">
              {t("recipient.someone")}
            </span>
            <label className="relative inline-block h-12 w-20 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
              <input
                {...register(`attendees.${attendeeIndex}.isForSomeoneElse`)}
                className="peer sr-only"
                id={`attendee-${attendeeIndex}`}
                type="checkbox"
              />
              <ToggleIcon />
            </label>
          </div>

          <AnimatePresence initial={false}>
            {isForSomeoneElse && (
              <motion.div
                key="someone-else-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 pt-1">
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
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

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
  control: Control<{
    tickets: TicketFormData[];
    attendees: AttendeeFormData[];
  }>;
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
  control,
}: Props) {
  const t = useTranslations("Checkout");

  return (
    <motion.div
      initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-8 lg:overflow-y-auto lg:min-h-0"
    >
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-[12px] p-6">
        <Sms
          size="20"
          color="#1d4ed8"
          variant="Bulk"
          className="shrink-0 mt-[0.2rem]"
        />
        <p className="text-[1.35rem] leading-7 text-blue-800">
          {t("recipient.email_info")}
        </p>
      </div>

      {isGuest && (
        <div className="border border-neutral-100 rounded-[15px] flex flex-col gap-6 p-6">
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
            <AttendeeCard
              key={`attendee-${attendeeIndex}-${attendee.ticketTypeId}`}
              attendeeIndex={attendeeIndex}
              ticketTypeName={
                ticketType
                  ? Capitalize(ticketType.ticketTypeName)
                  : "Unknown Ticket"
              }
              sameTypeCount={sameTypeCount}
              isGuest={isGuest}
              control={control}
              register={register}
            />
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
