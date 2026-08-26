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
import { AddCircle, Trash, Warning2 } from "iconsax-reactjs";
import type { EditInPersonFormValues } from "./types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { TicketTypePricePreview } from "@/components/shared/AttendeePricePreview";
import AbsorbFeesToggle from "@/components/shared/AbsorbFeesToggle";
import { Input } from "@/components/shared/Inputs";
import { toast } from "sonner";
import { Event, MembershipTier } from "@ticketwaze/typescript-config";

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
  event: Event;
  membershipTier: MembershipTier;
};

export default function StepTicket({
  register,
  errors,
  isFree,
  setIsFree,
  isRefundable,
  setIsRefundable,
  t,
  setValue,
  control,
  event,
  membershipTier,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketTypes",
  });
  const [currency, setCurrency] = useState(event.currency);
  const [wordCounts, setWordCounts] = useState<number[]>(fields.map(() => 0));
  const absorbFees = Boolean(useWatch({ control, name: "absorbFees" }));
  const canEditFreeQuantity = membershipTier.membershipName !== "free";

  /**
   * WHERE THE FREE SWITCH LIVES.
   *
   * On a free plan it stays where it has always been: one switch over the whole
   * activity, which locks it to a single "General" tier at no charge.
   *
   * On Pro and above it moves INSIDE each ticket tier, so an organiser can run
   * a free activity that also sells something — free entry, pay for the food —
   * without the whole activity having to pick a side. Gated on the same plan
   * flag as custom tier names, because a mixed activity needs two tiers and a
   * plan that cannot have two tiers cannot have a mixed one either.
   */
  const perTicketFreeToggle = membershipTier.customTicketTypes;

  // Live tier values, so the sections below can react to a tier being switched
  // to free without waiting for a submit.
  const watchedTicketTypes =
    useWatch({ control, name: "ticketTypes" }) ?? [];
  const isTierFree = (index: number) =>
    Boolean(watchedTicketTypes[index]?.isFree);
  const hasPaidTier = perTicketFreeToggle
    ? watchedTicketTypes.some((ticket) => !ticket?.isFree)
    : !isFree;
  /** Nothing to price, nothing to refund: every tier is given away. */
  const everyTierFree = perTicketFreeToggle
    ? watchedTicketTypes.length > 0 &&
      watchedTicketTypes.every((ticket) => Boolean(ticket?.isFree))
    : isFree;

  /**
   * Seats still available from the plan's give-away budget, which every free
   * tier draws on together. Shown as the max on each free tier's quantity so
   * the ceiling is visible before the schema refuses the total.
   */
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
    } else {
      append({
        ticketTypeName: "",
        ticketTypeDescription: "",
        ticketTypePrice: "",
        ticketTypeQuantity: "",
        /**
         * A tier added on EDIT inherits the activity's own free-ness rather
         * than defaulting to paid.
         *
         * `events.is_free` is derived from the tiers, so a paid tier appended
         * to an all-free activity would move it — and the API refuses that
         * (`allFree !== event.isFree`) precisely because it would move every
         * buyer onto a different checkout. Inheriting keeps the shape fixed, so
         * the organiser can add another free tier to a free activity and
         * another paid tier to a paid one, and neither save is rejected.
         */
        isFree: event.isFree,
      });
      setWordCounts((prev) => [...prev, 0]);
    }
  }

  /**
   * FROZEN ON EDIT — deliberately no handler.
   *
   * Whether a tier is free is settled when the activity is created. Someone who
   * paid for a tier must not find that same tier free the next day, and someone
   * holding a free ticket must not find it retroactively priced. The API
   * refuses the flip outright (`findFlippedTier`); the switch is shown, and
   * disabled, so the setting is legible rather than mysteriously absent.
   *
   * Adding a whole new tier is refused for the same reason: it would move
   * `events.is_free`, which is what the attendee checkout branches on.
   */

  return (
    <div className="flex flex-col gap-12">
      {/* set free — whole activity. Free plans only; on Pro the switch lives
          inside each ticket tier instead. */}
      {!perTicketFreeToggle && (
        <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
          <div className="flex items-center justify-between">
            <p className="text-[1.6rem] leading-8 text-deep-100 max-w-152">
              {t("mark_as_free")}
            </p>
            <label className="relative inline-block h-12 w-20 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 has-disabled:cursor-not-allowed">
              <input
                className="peer sr-only"
                id="free-event"
                type="checkbox"
                checked={isFree}
                // Frozen after creation, the same as the per-tier switch above.
                disabled
                onChange={() =>
                  setIsFree((prev) => {
                    if (prev === true) {
                      setIsRefundable(false);
                      setValue("ticketTypes", [
                        {
                          ticketTypeName: "",
                          ticketTypeDescription: "",
                          ticketTypePrice: "",
                          ticketTypeQuantity: "",
                          isFree: false,
                        },
                      ]);
                      setCurrency("HTG");
                      setValue("isFree", false);
                    } else {
                      setIsRefundable(true);
                      setValue("isFree", true);
                      setValue("ticketTypes", [
                        {
                          ticketTypeName: "General",
                          ticketTypeDescription: t("general_default"),
                          ticketTypePrice: "",
                          ticketTypeQuantity: String(
                            membershipTier.freeTickets,
                          ),
                          isFree: true,
                        },
                      ]);
                    }
                    return !prev;
                  })
                }
              />
              <ToggleIcon />
            </label>
          </div>
          <div className="flex flex-col items-start gap-4 border p-4 rounded-2xl border-neutral-300">
            <Warning2 size="24" color="#737C8A" variant="Bulk" />
            <div>
              <p className="text-[1.2rem] leading-8 text-neutral-800">
                {t("freeTip")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* On Pro the same guidance still applies, so it stays — just detached
          from a switch that is no longer here. */}
      {perTicketFreeToggle && (
        <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
          <p className="text-[1.6rem] leading-8 text-deep-100 max-w-152">
            {t("mixed_tiers_title")}
          </p>
          <div className="flex flex-col items-start gap-4 border p-4 rounded-2xl border-neutral-300">
            <Warning2 size="24" color="#737C8A" variant="Bulk" />
            <div>
              <p className="text-[1.2rem] leading-8 text-neutral-800">
                {t("mixed_tiers_hint")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* set refundable — only meaningful while something is actually paid for */}
      {hasPaidTier && (
        <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
          <div className="flex items-center justify-between">
            <p className="text-[1.6rem] leading-8 text-deep-100 max-w-152">
              {t("mark_as_refundable")}
            </p>
            <label className="relative inline-block h-12 w-20 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 has-disabled:cursor-not-allowed">
              <input
                className="peer sr-only"
                id="refundable-event"
                type="checkbox"
                checked={isRefundable}
                onChange={() => setIsRefundable((prev) => !prev)}
              />
              <ToggleIcon />
            </label>
          </div>
        </div>
      )}

      {hasPaidTier && (
        <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
          <span className="font-semibold text-[16px] leading-8 text-deep-100">
            {t("currency")}
          </span>
          <RadioGroup
            defaultValue={event.currency}
            onValueChange={(e) => {
              setValue("eventCurrency", e);
              setCurrency(e);
            }}
            className="flex gap-6 w-full justify-around"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[1.4rem] text-deep-100">Gourdes</span>
              <RadioGroupItem defaultChecked value={"HTG"} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[1.4rem] text-deep-100">Dollard US</span>
              <RadioGroupItem value={"USD"} />
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Who pays the fees. Placed here deliberately: it follows from the
          currency above and it is a premise of every price typed below it.
          Hidden when nothing is being charged — there is no fee to absorb on a
          ticket nobody pays for. */}
      {hasPaidTier && (
        <AbsorbFeesToggle
          checked={absorbFees}
          onChange={(next) => setValue("absorbFees", next)}
          t={t}
          showEditNote
        />
      )}

      {everyTierFree && !perTicketFreeToggle ? (
        <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
          <Input defaultValue={"General"} disabled readOnly>
            {t("class_name")}
          </Input>
          <textarea
            className="h-60 text-[1.5rem] placeholder:text-neutral-600 resize-none bg-neutral-100 w-full rounded-4xl p-8"
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
                  className="flex-1 bg-neutral-100 text-[1.5rem] w-full rounded-[5rem] p-8"
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
              <Input defaultValue={membershipTier.freeTickets} readOnly disabled>
                {t("quantity")}
              </Input>
            )}
          </div>
        </div>
      ) : (
        <>
          {fields.map((field, index) => {
            const tierFree = perTicketFreeToggle && isTierFree(index);
            const freeSeatsLeft =
              membershipTier.freeTickets - freeQuantityUsedByOthers(index);

            return (
              <div
                key={field.id}
                className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[16px] leading-8 text-deep-100">
                    {t("ticket_class")}
                  </span>
                  {index > 0 && (
                    <Trash
                      variant={"Bulk"}
                      color={"#DE0028"}
                      className={"cursor-pointer"}
                      onClick={() => {
                        remove(index);
                        setWordCounts((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                      size={20}
                    />
                  )}
                </div>

                {/* The free switch, per tier. Same control as the activity-wide
                    one it replaces, so the two read as the same idea at
                    different scopes. */}
                {perTicketFreeToggle && (
                  <div className="flex items-center justify-between">
                    <p className="text-[1.6rem] leading-8 text-deep-100 max-w-152">
                      {t("mark_ticket_as_free")}
                    </p>
                    <label className="relative inline-block h-12 w-20 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 has-disabled:cursor-not-allowed">
                      <input
                        className="peer sr-only"
                        type="checkbox"
                        checked={tierFree}
                        disabled
                        readOnly
                      />
                      <ToggleIcon />
                    </label>
                  </div>
                )}

                <Input
                  {...register(`ticketTypes.${index}.ticketTypeName` as const)}
                  error={errors?.ticketTypes?.[index]?.ticketTypeName?.message}
                  disabled={!membershipTier.customTicketTypes}
                >
                  {t("class_name")}
                </Input>

                <div>
                  <textarea
                    className="h-60 text-[1.5rem] resize-none bg-neutral-100 w-full rounded-4xl p-8"
                    placeholder={t("class_description")}
                    maxLength={100}
                    minLength={20}
                    {...register(
                      `ticketTypes.${index}.ticketTypeDescription` as const,
                    )}
                    onChange={(e) =>
                      setWordCounts((prev) => {
                        const next = [...prev];
                        next[index] = e.target.value.length;
                        return next;
                      })
                    }
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
                      // Read-only rather than absent: the row keeps the same
                      // shape whichever way the tier is set, so switching it
                      // does not make the card jump.
                      <Input defaultValue={"Free"} disabled readOnly>
                        {t("price")}
                      </Input>
                    ) : (
                      <>
                        <div className="flex-1 bg-neutral-100 w-full rounded-[5rem] p-8 flex gap-2">
                          <input
                            className="outline-none text-[1.5rem]"
                            type="number"
                            placeholder={`${t("price")}`}
                            {...register(
                              `ticketTypes.${index}.ticketTypePrice` as const,
                            )}
                          />
                          <span className="text-[1.5rem] text-neutral-600">
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
                      className="flex-1 bg-neutral-100 text-[1.5rem] w-full rounded-[5rem] p-8"
                      type="number"
                      step="1"
                      min={1}
                      // Only free tiers draw on the plan's allowance; a paid
                      // tier has no ceiling.
                      max={tierFree ? freeSeatsLeft : undefined}
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

                {!tierFree && (
                  <TicketTypePricePreview
                    control={control}
                    index={index}
                    currency={currency}
                    absorbFees={absorbFees}
                  />
                )}
              </div>
            );
          })}

          {fields.length <= 2 && (
            <div className="w-full max-w-216 mx-auto flex justify-between ">
              <div></div>
              <button
                type="button"
                onClick={addClass}
                className=" cursor-pointer flex gap-4 items-center"
              >
                <AddCircle color={"#E45B00"} variant={"Bulk"} size={"20"} />
                <span className="text-[1.5rem] leading-8 text-primary-500">
                  {t("add_class")}
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Optional ticket-sales cutoff */}
      <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-4 border border-neutral-100">
        <span className="font-semibold text-[16px] leading-8 text-deep-100">
          {t("sales_end_at")}{" "}
          <span className="text-neutral-600 font-normal">({t("optional")})</span>
        </span>
        <input
          type="datetime-local"
          className="bg-neutral-100 text-[1.5rem] w-full rounded-[5rem] p-8 outline-none"
          {...register("ticketSalesEndAt" as const)}
        />
        <p className="text-[1.2rem] leading-6 text-neutral-600">
          {t("sales_end_at_hint")}
        </p>
      </div>

      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
