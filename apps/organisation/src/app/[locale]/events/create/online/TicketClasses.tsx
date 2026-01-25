"use client";
import React, { useState } from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { CreateMeetFormValues } from "./types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { Input } from "@/components/shared/Inputs";

type Props = {
  register: UseFormRegister<CreateMeetFormValues>;
  errors: any;
  ticketClasses: {
    ticketTypeName: string;
    ticketTypeDescription: string;
    ticketTypePrice: string;
    ticketTypeQuantity: string;
  }[];
  setValue: UseFormSetValue<CreateMeetFormValues>;
  setTicketClasses: React.Dispatch<
    React.SetStateAction<
      {
        ticketTypeName: string;
        ticketTypeDescription: string;
        ticketTypePrice: string;
        ticketTypeQuantity: string;
      }[]
    >
  >;
  isFree: boolean;
  isRefundable: boolean;
  setIsFree: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRefundable: React.Dispatch<React.SetStateAction<boolean>>;
  t: (s: string) => string;
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
}: Props) {
  const [currency, setCurrency] = useState("HTG");
  const [ticketClassDescriptionWordCount, setTicketClassDescriptionWordCount] =
    useState(0);
  function handleTicketClassWordCount(
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) {
    setTicketClassDescriptionWordCount(e.target.value.length);
  }
  return (
    <div className="flex flex-col gap-12">
      {/* set free */}
      <div className="max-w-[540px] w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100">
        <div className="flex items-center justify-between">
          <p className="text-[1.6rem] leading-[22px] text-deep-100 max-w-[380px]">
            {t("mark_as_free")}
          </p>
          <label className="relative inline-block h-[30px] w-[50px] cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:_transparent] has-[:checked]:bg-primary-500 has-[:disabled]:cursor-not-allowed">
            <input
              className="peer sr-only"
              id="free-event"
              type="checkbox"
              checked={isFree}
              onChange={() =>
                setIsFree((prev) => {
                  if (prev === true) {
                    setValue("ticketTypes", [
                      {
                        ticketTypeName: "",
                        ticketTypeDescription: "",
                        ticketTypePrice: "",
                        ticketTypeQuantity: "",
                      },
                    ]);
                    setCurrency("HTG");
                  } else {
                    setValue("ticketTypes", [
                      {
                        ticketTypeName: "general",
                        ticketTypeDescription: t("general_default"),
                        ticketTypePrice: "",
                        ticketTypeQuantity: "100",
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
      </div>
      {/* set refundable */}
      <div className="max-w-[540px] w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100">
        <div className="flex items-center justify-between">
          <p className="text-[1.6rem] leading-[22px] text-deep-100 max-w-[380px]">
            {t("mark_as_refundable")}
          </p>
          <label className="relative inline-block h-[30px] w-[50px] cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:_transparent] has-[:checked]:bg-primary-500 has-[:disabled]:cursor-not-allowed">
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

      {!isFree && (
        <div className="max-w-[540px] w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100">
          <span className="font-semibold text-[16px] leading-[22px] text-deep-100">
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
        <div className="max-w-[540px] w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100">
          <Input defaultValue={"General"} disabled readOnly>
            {t("class_name")}
          </Input>
          <textarea
            className="h-[150px] text-[1.5rem] placeholder:text-neutral-600 resize-none bg-neutral-100 w-full rounded-[2rem] p-8"
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
        <div className="max-w-[540px] w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[16px] leading-[22px] text-deep-100">
              {t("ticket_class")}
            </span>
          </div>

          <Input
            {...register(`ticketTypes.0.ticketTypeName`)}
            disabled
            readOnly
          >
            {t("class_name")}
          </Input>
          <div className="">
            <textarea
              className={
                "h-[150px] resize-none bg-neutral-100 w-full rounded-[2rem] p-8 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500 "
              }
              placeholder={t("class_description")}
              {...register(`ticketTypes.0.ticketTypeDescription`)}
              onChange={handleTicketClassWordCount}
              maxLength={100}
              minLength={20}
            />
            <div className="flex items-center justify-between">
              <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
                {errors &&
                  errors.ticketTypes?.[0]?.ticketTypeDescription?.message}
              </span>
              {ticketClassDescriptionWordCount > 0 && (
                <span
                  className={`text-[1.2rem] self-end px-8 py-2 ${ticketClassDescriptionWordCount < 20 ? "text-failure" : "text-success"}`}
                >
                  {ticketClassDescriptionWordCount} / 100
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
                  {...register(`ticketTypes.0.ticketTypePrice`)}
                />
                <span className="text-[1.5rem] text-neutral-600">
                  {currency}
                </span>
              </div>
              <span className="text-[1.2rem] lg:hidden px-8 py-2 text-failure">
                {errors.ticketTypes?.[0]?.ticketTypePrice?.message}
              </span>
            </div>
            <Input
              {...register(`ticketTypes.0.ticketTypeQuantity`)}
              className="flex-1"
              readOnly
              disabled
            >
              {t("quantity")}
            </Input>
          </div>
        </div>
      )}
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
