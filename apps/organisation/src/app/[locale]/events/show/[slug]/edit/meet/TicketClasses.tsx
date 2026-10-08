/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import {
  UseFormRegister,
  UseFormSetValue,
  useFieldArray,
  useWatch,
  Control,
} from "react-hook-form";
import { Warning2 } from "iconsax-reactjs";
import type { EditMeetFormValues } from "./types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { TicketTypePricePreview } from "@/components/shared/AttendeePricePreview";
import AbsorbFeesToggle from "@/components/shared/AbsorbFeesToggle";
import { Input } from "@/components/shared/Inputs";
import { Event, MembershipTier } from "@ticketwaze/typescript-config";
import { Section } from "@/components/create/CreateParts";
import { SalesWindowFields } from "@/components/create/FormFields";

type Props = {
  register: UseFormRegister<EditMeetFormValues>;
  errors: any;
  setValue: UseFormSetValue<EditMeetFormValues>;
  isFree: boolean;
  isRefundable: boolean;
  setIsFree: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRefundable: React.Dispatch<React.SetStateAction<boolean>>;
  t: (s: string) => string;
  control: Control<EditMeetFormValues>;
  membershipTier: MembershipTier;
  /** Kept for parity with the physical form; the free switch is frozen. */
  event?: Event;
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  /** Absent for the frozen free switch, which renders disabled. */
  onChange?: () => void;
}) {
  return (
    <label className="relative inline-block h-12 w-20 shrink-0 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 has-disabled:cursor-not-allowed">
      <input
        className="peer sr-only"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        readOnly={!onChange}
        disabled={!onChange}
      />
      <ToggleIcon />
    </label>
  );
}

const fieldClass =
  "bg-neutral-100 text-[1.5rem] w-full rounded-[5rem] h-[6rem] px-8 outline-none border border-transparent focus:border-primary-500 placeholder:text-neutral-600";

/**
 * Online tickets: one class (an online checkout hands out one seat per buyer,
 * so there is no "free entry, pay for extras" to express), free or paid, with
 * its own sales window.
 */
export default function StepTicket({
  register,
  errors,
  isFree,
  isRefundable,
  setIsRefundable,
  t,
  setValue,
  control,
  membershipTier,
}: Props) {
  const { fields } = useFieldArray({ control, name: "ticketTypes" });
  // Read from the form so remounting the step never resets it to HTG.
  const currency = useWatch({ control, name: "eventCurrency" }) || "HTG";
  const setCurrency = (next: string) => setValue("eventCurrency", next);
  const [wordCounts, setWordCounts] = useState<number[]>(fields.map(() => 0));
  const absorbFees = Boolean(useWatch({ control, name: "absorbFees" }));
  const canEditFreeQuantity = membershipTier.membershipName !== "free";

  /*
   * FROZEN ON EDIT: whether the class is free is settled when the activity is
   * created (the API refuses the flip), so the switch is shown, disabled.
   */
  // Free is set on the ticket class itself, like every other create form.
  // Online events sell one class, so it is also what makes the event free.
  const freeSwitch = (
    <div className="flex items-center justify-between gap-6">
      <p className="text-[1.6rem] leading-8 text-deep-100">
        {t("mark_ticket_as_free")}
      </p>
      <Toggle checked={isFree} />
    </div>
  );
  const lockedNote = (
    <p className="text-[1.2rem] leading-7 text-neutral-600 -mt-2">
      {t("free_locked")}
    </p>
  );

  return (
    <div className="flex flex-col gap-12">
      {!isFree && (
        <Section>
          <div className="flex items-center justify-between gap-6">
            <p className="text-[1.6rem] leading-8 text-deep-100">
              {t("mark_as_refundable")}
            </p>
            <Toggle
              checked={isRefundable}
              onChange={() => setIsRefundable((prev) => !prev)}
            />
          </div>
        </Section>
      )}

      {!isFree && (
        <Section title={t("currency")}>
          <RadioGroup
            value={currency}
            onValueChange={setCurrency}
            className="flex gap-6 w-full justify-around"
          >
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-[1.4rem] text-deep-100">Gourdes</span>
              <RadioGroupItem value={"HTG"} />
            </label>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-[1.4rem] text-deep-100">Dollard US</span>
              <RadioGroupItem value={"USD"} />
            </label>
          </RadioGroup>
        </Section>
      )}

      {!isFree && (
        <AbsorbFeesToggle
          checked={absorbFees}
          onChange={(next) => setValue("absorbFees", next)}
          t={t}
          showEditNote
        />
      )}

      {isFree ? (
        <Section title={t("ticket_class")}>
          {freeSwitch}
          {lockedNote}
          <div className="flex flex-col items-start gap-4 border p-4 rounded-2xl border-neutral-300">
            <Warning2 size="24" color="#737C8A" variant="Bulk" />
            <p className="text-[1.2rem] leading-8 text-neutral-800">
              {t("freeTip")}
            </p>
          </div>
          <Input defaultValue={"General"} disabled readOnly>
            {t("class_name")}
          </Input>
          <textarea
            className="h-60 text-[1.5rem] placeholder:text-neutral-600 resize-none bg-neutral-100 w-full rounded-[2rem] p-8"
            placeholder={t("general_default")}
            disabled
            readOnly
          />
          <div className="flex flex-col lg:flex-row gap-4">
            <Input defaultValue={"Free"} disabled readOnly>
              {t("price")}
            </Input>
            {canEditFreeQuantity ? (
              <div className="flex-1">
                <input
                  className={fieldClass}
                  type="number"
                  step="1"
                  min={1}
                  max={membershipTier.freeTickets}
                  placeholder={t("quantity")}
                  {...register("ticketTypes.0.ticketTypeQuantity" as const)}
                />
                <span className="text-[1.2rem] px-8 py-2 text-failure">
                  {errors?.ticketTypes?.[0]?.ticketTypeQuantity?.message}
                </span>
              </div>
            ) : (
              <Input
                defaultValue={membershipTier.freeTickets}
                readOnly
                disabled
              >
                {t("quantity")}
              </Input>
            )}
          </div>
          <SalesWindowFields
            startProps={register("ticketTypes.0.salesStartAt" as const)}
            endProps={register("ticketTypes.0.salesEndAt" as const)}
            endError={errors?.ticketTypes?.[0]?.salesEndAt?.message}
            t={t}
          />
        </Section>
      ) : (
        fields.map((field, index) => (
          <Section key={field.id} title={t("ticket_class")}>
            {freeSwitch}
            {lockedNote}
            <Input
              {...register(`ticketTypes.${index}.ticketTypeName` as const)}
              error={errors?.ticketTypes?.[index]?.ticketTypeName?.message}
              disabled={!membershipTier.customTicketTypes}
            >
              {t("class_name")}
            </Input>
            <div>
              <textarea
                className="h-60 text-[1.5rem] resize-none bg-neutral-100 w-full rounded-[2rem] p-8 outline-none border border-transparent focus:border-primary-500 placeholder:text-neutral-600"
                placeholder={t("class_description")}
                maxLength={100}
                minLength={20}
                // The counter rides on register's own onChange.
                {...register(
                  `ticketTypes.${index}.ticketTypeDescription` as const,
                  {
                    onChange: (e) =>
                      setWordCounts((prev) => {
                        const next = [...prev];
                        next[index] = e.target.value.length;
                        return next;
                      }),
                  },
                )}
                disabled={!membershipTier.customTicketTypes}
              />
              <div className="flex items-center justify-between">
                <span className="text-[1.2rem] px-8 py-2 text-failure">
                  {errors?.ticketTypes?.[index]?.ticketTypeDescription?.message}
                </span>
                {(wordCounts[index] ?? 0) > 0 && (
                  <span
                    className={`text-[1.2rem] text-nowrap self-end px-8 py-2 ${(wordCounts[index] ?? 0) < 20 ? "text-failure" : "text-success"}`}
                  >
                    {wordCounts[index]} / 100
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="bg-neutral-100 w-full rounded-[5rem] h-[6rem] px-8 flex items-center gap-2 border border-transparent focus-within:border-primary-500">
                  <input
                    className="flex-1 min-w-0 bg-transparent outline-none text-[1.5rem] placeholder:text-neutral-600"
                    type="number"
                    placeholder={t("price")}
                    {...register(
                      `ticketTypes.${index}.ticketTypePrice` as const,
                    )}
                  />
                  <span className="text-[1.5rem] font-medium text-deep-100">
                    {currency}
                  </span>
                </div>
                <span className="text-[1.2rem] px-8 py-2 text-failure">
                  {errors?.ticketTypes?.[index]?.ticketTypePrice?.message}
                </span>
              </div>
              <div className="flex-1">
                <input
                  className={fieldClass}
                  type="number"
                  step="1"
                  placeholder={t("quantity")}
                  {...register(
                    `ticketTypes.${index}.ticketTypeQuantity` as const,
                  )}
                />
                <span className="text-[1.2rem] px-8 py-2 text-failure">
                  {errors?.ticketTypes?.[index]?.ticketTypeQuantity?.message}
                </span>
              </div>
            </div>
            <SalesWindowFields
              startProps={register(
                `ticketTypes.${index}.salesStartAt` as const,
              )}
              endProps={register(`ticketTypes.${index}.salesEndAt` as const)}
              endError={errors?.ticketTypes?.[index]?.salesEndAt?.message}
              t={t}
            />
            <TicketTypePricePreview
              control={control}
              index={index}
              currency={currency}
              absorbFees={absorbFees}
            />
          </Section>
        ))
      )}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
