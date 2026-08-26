"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardText } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import type {
  Event,
  EventTicketType,
  PublicEventFormQuestion,
} from "@ticketwaze/typescript-config";
import Capitalize from "@/lib/Capitalize";
import {
  AttendeeFormData,
  FeeBreakdown,
  PaymentType,
  SeatAnswers,
  SelectedTicket,
} from "../checkout.types";
import TicketSummaryCard from "../TicketSummaryCard";

/**
 * THE ORGANISER'S QUESTIONS, ASKED ONCE PER SEAT.
 *
 * Per seat rather than per order because a ticket belongs to a person and these
 * are questions about that person — the step beside it already collects a name
 * and email the same way. Someone buying three tickets fills three cards.
 *
 * Only rendered when the activity actually has questions, so the step does not
 * exist at all for the overwhelming majority of checkouts.
 */

function OtherInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <input
        autoFocus
        value={value}
        maxLength={280}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 ml-11 w-[calc(100%-2.75rem)] bg-neutral-100 text-[1.5rem] rounded-[5rem] px-8 py-5 outline-none"
      />
    </motion.div>
  );
}

function QuestionField({
  question,
  seatIndex,
  value,
  onChange,
}: {
  question: PublicEventFormQuestion;
  seatIndex: number;
  value: { answer: string; isOther: boolean } | undefined;
  onChange: (next: { answer: string; isOther: boolean }) => void;
}) {
  const t = useTranslations("Checkout.questions");
  const answer = value?.answer ?? "";
  const isOther = value?.isOther ?? false;

  if (question.questionType === "text") {
    return (
      <div className="flex flex-col gap-3">
        <label className="text-[1.5rem] leading-8 text-deep-100">
          {question.label}
          {question.isRequired && <span className="text-primary-500"> *</span>}
        </label>
        <textarea
          value={answer}
          maxLength={500}
          rows={3}
          placeholder={t("text_placeholder")}
          onChange={(e) => onChange({ answer: e.target.value, isOther: false })}
          className="bg-neutral-100 text-[1.5rem] w-full rounded-[2rem] p-6 resize-none outline-none"
        />
      </div>
    );
  }

  /**
   * A real radio group: one `name` per question PER SEAT, so choosing an option
   * on the second ticket cannot clear the first. Getting that name wrong is the
   * bug this whole step is most likely to have, hence the seat index in it.
   */
  const groupName = `q-${question.eventFormQuestionId}-seat-${seatIndex}`;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[1.5rem] leading-8 text-deep-100">
        {question.label}
        {question.isRequired && <span className="text-primary-500"> *</span>}
      </span>

      <div className="flex flex-col gap-2">
        {question.options.map((option) => {
          const checked = !isOther && answer === option;
          return (
            <label
              key={option}
              className={`flex items-center gap-4 rounded-[1.5rem] border px-6 py-4 cursor-pointer transition-colors ${
                checked
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 hover:border-primary-500"
              }`}
            >
              <input
                type="radio"
                name={groupName}
                checked={checked}
                onChange={() => onChange({ answer: option, isOther: false })}
                className="w-6 h-6 accent-[#E45B00] shrink-0"
              />
              <span className="text-[1.4rem] leading-8 text-deep-100">
                {option}
              </span>
            </label>
          );
        })}

        {question.allowOther && (
          <>
            <label
              className={`flex items-center gap-4 rounded-[1.5rem] border px-6 py-4 cursor-pointer transition-colors ${
                isOther
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 hover:border-primary-500"
              }`}
            >
              <input
                type="radio"
                name={groupName}
                checked={isOther}
                // Selecting "Other" clears any previously chosen option: the
                // answer is now whatever they type, and carrying the old value
                // over would submit a choice they just moved away from.
                onChange={() => onChange({ answer: "", isOther: true })}
                className="w-6 h-6 accent-[#E45B00] shrink-0"
              />
              <span className="text-[1.4rem] leading-8 text-deep-100">
                {t("other")}
              </span>
            </label>
            <AnimatePresence initial={false}>
              {isOther && (
                <OtherInput
                  value={answer}
                  placeholder={t("other_placeholder")}
                  onChange={(next) => onChange({ answer: next, isOther: true })}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

export default function QuestionsStep({
  delta,
  questions,
  watchedAttendees,
  ticketTypeNames,
  answers,
  onAnswerChange,
  event,
  ticketTypes,
  isFree,
  selectedWithIndex,
  feeBreakdown,
  paymentType,
}: {
  delta: number;
  questions: PublicEventFormQuestion[];
  watchedAttendees: AttendeeFormData[];
  /** ticketTypeId → display name, so each card can say which seat it is. */
  ticketTypeNames: Record<string, string>;
  answers: SeatAnswers[];
  onAnswerChange: (
    seatIndex: number,
    questionId: string,
    value: { answer: string; isOther: boolean },
  ) => void;
  event: Event;
  ticketTypes: EventTicketType[];
  isFree: boolean;
  selectedWithIndex: SelectedTicket[];
  feeBreakdown: FeeBreakdown;
  paymentType: PaymentType;
}) {
  const t = useTranslations("Checkout.questions");

  return (
    <motion.div
      initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-8 lg:h-full lg:min-h-0 lg:overflow-y-auto"
    >
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-[12px] p-6">
        <ClipboardText
          size="20"
          color="#1d4ed8"
          variant="Bulk"
          className="shrink-0 mt-[0.2rem]"
        />
        <p className="text-[1.35rem] leading-7 text-blue-800">
          {watchedAttendees.length > 1 ? t("intro_many") : t("intro_one")}
        </p>
      </div>

      {watchedAttendees.map((attendee, seatIndex) => {
        // "#2 VIP" — which of several identical seats this card is for. Counted
        // within the type, matching how the recipient step numbers them.
        const sameTypeCount = watchedAttendees
          .slice(0, seatIndex)
          .filter((other) => other.ticketTypeId === attendee.ticketTypeId).length;

        return (
          <div
            key={`${attendee.ticketTypeId}-${seatIndex}`}
            className="border border-neutral-100 rounded-[15px] flex flex-col gap-8 p-6"
          >
            <div className="flex items-center w-full justify-between font-semibold text-[1.6rem] leading-8 text-deep-100">
              <span>#{sameTypeCount + 1}</span>
              <span>
                {Capitalize(ticketTypeNames[attendee.ticketTypeId] ?? "")}
              </span>
            </div>

            {questions.map((question) => (
              <QuestionField
                key={question.eventFormQuestionId}
                question={question}
                seatIndex={seatIndex}
                value={answers[seatIndex]?.[question.eventFormQuestionId]}
                onChange={(next) =>
                  onAnswerChange(seatIndex, question.eventFormQuestionId, next)
                }
              />
            ))}
          </div>
        );
      })}

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
