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
import { AnimatePresence, motion } from "motion/react";
import { AddCircle, Trash, Warning2 } from "iconsax-reactjs";
import type { EditInPersonFormValues } from "./types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { TicketTypePricePreview } from "@/components/shared/AttendeePricePreview";
import AbsorbFeesToggle from "@/components/shared/AbsorbFeesToggle";
import { Input } from "@/components/shared/Inputs";
import { toast } from "sonner";
import { Event, MembershipTier } from "@ticketwaze/typescript-config";
import { Section } from "@/components/create/CreateParts";
import { SalesWindowFields } from "@/components/create/FormFields";

type Props = {
  register: UseFormRegister<EditInPersonFormValues>;
  errors: any;
  setValue: UseFormSetValue<EditInPersonFormValues>;
  isFree: boolean;
  isRefundable: boolean;
  setIsFree: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRefundable: React.Dispatch<React.SetStateAction<boolean>>;
  t: (s: string) => string;
  control: Control<EditInPersonFormValues>;
  membershipTier: MembershipTier;
  event: Event;
};

function Toggle({
  checked,
  onChange,
  id,
  disabled = false,
}: {
  checked: boolean;
  onChange?: () => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <label className="relative inline-block h-12 w-20 shrink-0 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 has-disabled:cursor-not-allowed">
      <input
        className="peer sr-only"
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        readOnly={!onChange}
        disabled={disabled}
      />
      <ToggleIcon />
    </label>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 border p-4 rounded-2xl border-neutral-300">
      <Warning2 size="24" color="#737C8A" variant="Bulk" />
      <p className="text-[1.2rem] leading-8 text-neutral-800">{children}</p>
    </div>
  );
}

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
  event,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketTypes",
  });
  // Read from the form, not held locally: local state reset to HTG every time
  // this step remounted while the form kept the organiser's real choice.
  const currency = useWatch({ control, name: "eventCurrency" }) || "HTG";
  const setCurrency = (next: string) => setValue("eventCurrency", next);
  const [wordCounts, setWordCounts] = useState<number[]>(fields.map(() => 0));
  const absorbFees = Boolean(useWatch({ control, name: "absorbFees" }));
  const canEditFreeQuantity = membershipTier.membershipName !== "free";

  /**
   * WHERE THE FREE SWITCH LIVES. On a free plan: one switch over the whole
   * activity, locking it to a single "General" tier at no charge. On Pro and
   * above it moves inside each tier, so a free activity can also sell
   * something. Gated on the same plan flag as custom tier names.
   */
  const perTicketFreeToggle = membershipTier.customTicketTypes;

  const watchedTicketTypes = useWatch({ control, name: "ticketTypes" }) ?? [];
  const isTierFree = (index: number) =>
    Boolean(watchedTicketTypes[index]?.isFree);
  const hasPaidTier = perTicketFreeToggle
    ? watchedTicketTypes.some((ticket) => !ticket?.isFree)
    : !isFree;
  const everyTierFree = perTicketFreeToggle
    ? watchedTicketTypes.length > 0 &&
      watchedTicketTypes.every((ticket) => Boolean(ticket?.isFree))
    : isFree;

  /** Seats left in the plan's shared give-away budget, for a free tier's max. */
  const freeQuantityUsedByOthers = (index: number) =>
    watchedTicketTypes.reduce((total, ticket, i) => {
      if (i === index || !ticket?.isFree) return total;
      const quantity = parseInt(ticket?.ticketTypeQuantity ?? "", 10);
      return total + (isNaN(quantity) ? 0 : quantity);
    }, 0);

  function addClass() {
    if (membershipTier.membershipName === "free") {
      toast.info(t("pro"));
      return;
    }
    append({
      ticketTypeName: "",
      ticketTypeDescription: "",
      ticketTypePrice: "",
      ticketTypeQuantity: "",
      // A class added on EDIT inherits the activity's free-ness: `events.is_free`
      // is derived from the classes, and the API refuses a save that moves it
      // (it would move every buyer onto a different checkout).
      isFree: event.isFree,
      salesStartAt: "",
      salesEndAt: "",
    });
    setWordCounts((prev) => [...prev, 0]);
  }

  /**
   * FROZEN ON EDIT — the free switches are shown, disabled, with no handler.
   * Whether a class is free is settled when the activity is created: someone
   * who paid must not find the same class free the next day, nor a free ticket
   * priced afterwards. The API refuses the flip (`findFlippedTier`).
   */
  const lockedNote = (
    <p className="text-[1.2rem] leading-7 text-neutral-600 -mt-2">
      {t("free_locked")}
    </p>
  );

  return (
    <div className="flex flex-col gap-12">
      {/* Free is always switched on the ticket class itself. On Pro each class
          has its own switch (free entry beside paid extras); this explains it. */}
      {perTicketFreeToggle && (
        <Section>
          <p className="text-[1.6rem] leading-8 text-deep-100">
            {t("mixed_tiers_title")}
          </p>
          <Tip>{t("mixed_tiers_hint")}</Tip>
        </Section>
      )}

      {/* Refunds and money settings only matter while something is paid for. */}
      {hasPaidTier && (
        <Section>
          <div className="flex items-center justify-between gap-6">
            <p className="text-[1.6rem] leading-8 text-deep-100">
              {t("mark_as_refundable")}
            </p>
            <Toggle
              id="refundable-event"
              checked={isRefundable}
              onChange={() => setIsRefundable((prev) => !prev)}
            />
          </div>
        </Section>
      )}

      {hasPaidTier && (
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

      {/* Who pays the fees: follows from the currency, premise of every price. */}
      {hasPaidTier && (
        <AbsorbFeesToggle
          checked={absorbFees}
          onChange={(next) => setValue("absorbFees", next)}
          t={t}
          showEditNote
        />
      )}

      {everyTierFree && !perTicketFreeToggle ? (
        <Section title={t("ticket_class")}>
          <div className="flex items-center justify-between gap-6">
            <p className="text-[1.6rem] leading-8 text-deep-100">
              {t("mark_ticket_as_free")}
            </p>
            <Toggle id="free-event" checked={isFree} disabled />
          </div>
          {lockedNote}
          <Tip>{t("freeTip")}</Tip>
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
                  className="flex-1 bg-neutral-100 text-[1.5rem] w-full rounded-[5rem] h-[6rem] px-8 outline-none border border-transparent focus:border-primary-500"
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
        <>
          <AnimatePresence initial={false}>
            {fields.map((field, index) => {
              const tierFree = perTicketFreeToggle && isTierFree(index);
              const freeSeatsLeft =
                membershipTier.freeTickets - freeQuantityUsedByOthers(index);
              return (
                <motion.div
                  key={field.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                >
                  <Section
                    title={t("ticket_class")}
                    action={
                      index > 0 && (
                        <button
                          type="button"
                          aria-label="Remove"
                          className="cursor-pointer flex"
                          onClick={() => {
                            remove(index);
                            setWordCounts((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                          }}
                        >
                          <Trash variant="Bulk" color="#DE0028" size={20} />
                        </button>
                      )
                    }
                  >
                    {/* Free plans have a single class, so its switch is the
                        whole activity's; Pro switches each class on its own. */}
                    <div className="flex items-center justify-between gap-6">
                      <p className="text-[1.6rem] leading-8 text-deep-100">
                        {t("mark_ticket_as_free")}
                      </p>
                      <Toggle
                        checked={perTicketFreeToggle ? tierFree : isFree}
                        disabled
                      />
                    </div>
                    {lockedNote}

                    <Input
                      {...register(
                        `ticketTypes.${index}.ticketTypeName` as const,
                      )}
                      error={
                        errors?.ticketTypes?.[index]?.ticketTypeName?.message
                      }
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
                        // The counter rides on register's own onChange; a
                        // separate onChange prop would replace the form's.
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
                          {
                            errors?.ticketTypes?.[index]?.ticketTypeDescription
                              ?.message
                          }
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
                        {tierFree ? (
                          // Read-only rather than absent, so the card keeps
                          // its shape whichever way the tier is set.
                          <Input defaultValue={"Free"} disabled readOnly>
                            {t("price")}
                          </Input>
                        ) : (
                          <>
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
                              {
                                errors?.ticketTypes?.[index]?.ticketTypePrice
                                  ?.message
                              }
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          className="bg-neutral-100 text-[1.5rem] w-full rounded-[5rem] h-[6rem] px-8 outline-none border border-transparent focus:border-primary-500 placeholder:text-neutral-600"
                          type="number"
                          step="1"
                          min={1}
                          // Only free tiers draw on the plan's allowance.
                          max={tierFree ? freeSeatsLeft : undefined}
                          placeholder={t("quantity")}
                          {...register(
                            `ticketTypes.${index}.ticketTypeQuantity` as const,
                          )}
                        />
                        <span className="text-[1.2rem] px-8 py-2 text-failure">
                          {
                            errors?.ticketTypes?.[index]?.ticketTypeQuantity
                              ?.message
                          }
                        </span>
                      </div>
                    </div>

                    <SalesWindowFields
                      startProps={register(
                        `ticketTypes.${index}.salesStartAt` as const,
                      )}
                      endProps={register(
                        `ticketTypes.${index}.salesEndAt` as const,
                      )}
                      endError={
                        errors?.ticketTypes?.[index]?.salesEndAt?.message
                      }
                      t={t}
                    />

                    {!tierFree && (
                      <TicketTypePricePreview
                        control={control}
                        index={index}
                        currency={currency}
                        absorbFees={absorbFees}
                      />
                    )}
                  </Section>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {fields.length <= 2 && (
            <div className="w-full max-w-[54rem] mx-auto flex justify-end">
              <button
                type="button"
                onClick={addClass}
                className="cursor-pointer flex gap-3 items-center group"
              >
                <AddCircle
                  color="#E45B00"
                  variant="Bulk"
                  size="20"
                  className="transition-transform group-hover:rotate-90"
                />
                <span className="text-[1.5rem] leading-8 text-primary-500">
                  {t("add_class")}
                </span>
              </button>
            </div>
          )}
        </>
      )}
      {/* Room above the phone's pinned footer bar. */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
