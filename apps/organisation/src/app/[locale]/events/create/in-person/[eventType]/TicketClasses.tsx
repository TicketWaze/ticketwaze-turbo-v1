/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import {
  UseFormRegister,
  UseFormSetValue,
  useFieldArray,
  Control,
} from "react-hook-form";
import { AddCircle, Trash, Warning2 } from "iconsax-reactjs";
import type { CreateInPersonFormValues } from "./types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { Input } from "@/components/shared/Inputs";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type Props = {
  register: UseFormRegister<CreateInPersonFormValues>;
  errors: any;
  setValue: UseFormSetValue<CreateInPersonFormValues>;
  isFree: boolean;
  isRefundable: boolean;
  setIsFree: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRefundable: React.Dispatch<React.SetStateAction<boolean>>;
  t: (s: string) => string;
  control: Control<CreateInPersonFormValues>;
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
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketTypes",
  });
  const [currency, setCurrency] = useState("HTG");
  const [wordCounts, setWordCounts] = useState<number[]>(fields.map(() => 0));
  const { data: session } = useSession();
  function addClass() {
    if (session?.activeOrganisation.membershipTier.membershipName === "free") {
      toast.info(t("pro"));
      return;
    } else {
      append({
        ticketTypeName: "",
        ticketTypeDescription: "",
        ticketTypePrice: "",
        ticketTypeQuantity: "",
      });
      setWordCounts((prev) => [...prev, 0]);
    }
  }
  return (
    <div className="flex flex-col gap-12">
      {/* set free */}
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
                          session?.activeOrganisation.membershipTier
                            .freeTickets,
                        ),
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
      {/* set refundable */}
      {!isFree && (
        <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
          <div className="flex items-center justify-between">
            <p className="text-[1.6rem] leading-8 text-deep-100 max-w-152">
              {t("mark_as_refundable")}
            </p>
            <label className="relative inline-block h-12 w-20 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 has-disabled:cursor-not-allowed">
              <input
                className="peer sr-only"
                id="free-event"
                type="checkbox"
                checked={isRefundable}
                onChange={() => setIsRefundable((prev) => !prev)}
              />
              <ToggleIcon />
            </label>
          </div>
        </div>
      )}

      {!isFree && (
        <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
          <span className="font-semibold text-[16px] leading-8 text-deep-100">
            {t("currency")}
          </span>
          <RadioGroup
            defaultValue="HTG"
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

      {isFree ? (
        <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
          <Input defaultValue={"general"} disabled readOnly>
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
            <Input defaultValue="100" readOnly disabled>
              {t("quantity")}
            </Input>
          </div>
        </div>
      ) : (
        <>
          {fields.map((field, index) => (
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

              <Input
                {...register(`ticketTypes.${index}.ticketTypeName` as const)}
                error={errors?.ticketTypes?.[index]?.ticketTypeName?.message}
                disabled={
                  !session?.activeOrganisation.membershipTier.customTicketTypes
                }
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
                  disabled={
                    !session?.activeOrganisation.membershipTier
                      .customTicketTypes
                  }
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
                  <span className="text-[1.2rem] lg:hidden px-8 py-2 text-failure">
                    {errors?.ticketTypes?.[index]?.ticketTypePrice?.message}
                  </span>
                </div>

                <div className="flex-1">
                  <input
                    className="flex-1 bg-neutral-100 text-[1.5rem] w-full rounded-[5rem] p-8"
                    type="number"
                    step="1"
                    placeholder={t("quantity")}
                    {...register(
                      `ticketTypes.${index}.ticketTypeQuantity` as const,
                    )}
                  />
                  <span className="text-[1.2rem] lg:hidden px-8 py-2 text-failure">
                    {errors?.ticketTypes?.[index]?.ticketTypeQuantity?.message}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {!isFree && fields.length <= 2 && (
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
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
