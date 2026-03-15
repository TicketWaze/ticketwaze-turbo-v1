"use client";
import React from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { CreateInPersonFormValues } from "./types";
import { Trash } from "iconsax-reactjs";
import { toast } from "sonner";

type Props = {
  register: UseFormRegister<CreateInPersonFormValues>;
  errors: any;
  eventDays: { dateTime: string }[];
  setEventDays: React.Dispatch<React.SetStateAction<{ dateTime: string }[]>>;
  setValue: UseFormSetValue<CreateInPersonFormValues>;
  t: (s: string) => string;
};

export default function StepDateTime({
  register,
  errors,
  eventDays,
  setEventDays,
  setValue,
  t,
}: Props) {
  return (
    <div className="flex flex-col gap-12">
      {eventDays.map((eventDay, index) => (
        <div
          key={index}
          className="max-w-[540px] w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[16px] leading-[22px] text-deep-100">
              {t("day")} {index + 1}
            </span>
            {index > 0 && (
              <Trash
                variant={"Bulk"}
                color={"#DE0028"}
                className={"cursor-pointer"}
                onClick={() => {
                  const updated = eventDays.filter((_, i) => i !== index);
                  setValue("eventDays", updated, {
                    shouldValidate: true,
                  });
                  setEventDays(updated);
                }}
                size={20}
              />
            )}
          </div>

          <div>
            <div className="bg-neutral-100 w-full rounded-[5rem] py-4 px-8">
              <span className="text-neutral-600 text-[1.2rem]">
                {t("date_time")}
              </span>
              <input
                type="datetime-local"
                className="w-full outline-none text-[1.5rem]"
                {...register(`eventDays.${index}.dateTime` as const)}
              />
            </div>
            <span className="text-[1.2rem] px-8 py-2 text-failure">
              {errors.eventDays?.[index]?.dateTime?.message}
            </span>
          </div>
        </div>
      ))}

      <div className="w-full max-w-[540px] mx-auto flex justify-between ">
        <div />
        <button
          type="button"
          onClick={() => toast.info(t("coming"))}
          // onClick={() =>
          //   setEventDays((prev) => [
          //     ...prev,
          //     { dateTime: "" },
          //   ])
          // }
          className="cursor-pointer flex gap-4 items-center"
        >
          <span className="text-[1.5rem] leading-8 text-primary-500">
            {t("add_day")}
          </span>
        </button>
      </div>

      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
