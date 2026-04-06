/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { EditMeetFormValues, EventDay } from "./types";
import { Trash } from "iconsax-reactjs";
import { toast } from "sonner";

type Props = {
  register: UseFormRegister<EditMeetFormValues>;
  errors: any;
  eventDays: EventDay[];
  setEventDays: React.Dispatch<React.SetStateAction<EventDay[]>>;
  setValue: UseFormSetValue<EditMeetFormValues>;
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
  const addDay = () => {
    const newDay: EventDay = {
      dayNumber: eventDays.length + 1,
      eventDate: "",
      startTime: "",
      endTime: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const updated = [...eventDays, newDay];
    setValue("eventDays", updated, { shouldValidate: false });
    setEventDays(updated);
  };

  const removeDay = (index: number) => {
    const updated = eventDays
      .filter((_, i) => i !== index)
      .map((day, i) => ({ ...day, dayNumber: i + 1 })); // recalculate dayNumber
    setValue("eventDays", updated, { shouldValidate: true });
    setEventDays(updated);
  };

  return (
    <div className="flex flex-col gap-12">
      {eventDays.map((eventDay, index) => {
        return (
          <div
            key={index}
            className="max-w-[540px] w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[16px] leading-[22px] text-deep-100">
                {t("day")} {index + 1}
              </span>
              {index > 0 && (
                <Trash
                  variant="Bulk"
                  color="#DE0028"
                  className="cursor-pointer"
                  onClick={() => removeDay(index)}
                  size={20}
                />
              )}
            </div>

            {/* Hidden fields */}
            <input
              type="hidden"
              {...register(`eventDays.${index}.dayNumber`)}
            />
            <input type="hidden" {...register(`eventDays.${index}.timezone`)} />

            {/* Date */}
            <div>
              <div className="bg-neutral-100 w-full rounded-[5rem] py-4 px-8">
                <span className="text-neutral-600 text-[1.2rem]">
                  {t("start_date")}
                </span>
                <input
                  type="date"
                  defaultValue={eventDay.eventDate}
                  className="w-full outline-none text-[1.5rem]"
                  {...register(`eventDays.${index}.eventDate`)}
                />
              </div>
              <span className="text-[1.2rem] px-8 py-2 text-failure">
                {errors.eventDays?.[index]?.eventDate?.message}
              </span>
            </div>

            {/* Start time & End time */}
            <div className="flex gap-4 items-start">
              {/* Start time */}
              <div className="flex-1">
                <div className="bg-neutral-100 w-full rounded-[5rem] py-4 px-8 flex items-center">
                  <div className="flex-1">
                    <span className="text-neutral-600 text-[1.2rem]">
                      {t("start_time")}
                    </span>
                    <input
                      type="time"
                      className="w-full outline-none text-[1.5rem]"
                      {...register(`eventDays.${index}.startTime`)}
                    />
                  </div>
                </div>
                <span className="text-[1.2rem] px-8 py-2 text-failure">
                  {errors.eventDays?.[index]?.startTime?.message}
                </span>
              </div>

              {/* End time */}
              <div className="flex-1">
                <div className="bg-neutral-100 w-full rounded-[5rem] py-4 px-8 flex items-center">
                  <div className="flex-1">
                    <span className="text-neutral-600 text-[1.2rem]">
                      {t("end_time")}
                    </span>
                    <input
                      type="time"
                      className="w-full outline-none text-[1.5rem]"
                      {...register(`eventDays.${index}.endTime`)}
                    />
                  </div>
                </div>
                <span className="text-[1.2rem] px-8 py-2 text-failure">
                  {errors.eventDays?.[index]?.endTime?.message}
                </span>
              </div>
            </div>

            {/* Timezone display (read-only) */}
            <span className="text-neutral-400 text-[1.2rem] px-2">
              🌐 {eventDay.timezone}
            </span>
          </div>
        );
      })}

      {/* Add day */}
      <div className="w-full max-w-[540px] mx-auto flex justify-between">
        <div />
        <button
          type="button"
          onClick={() => toast.info(t("coming"))}
          className="cursor-pointer flex gap-4 items-center"
        >
          <span className="text-[1.5rem] leading-8 text-primary-500">
            {t("add_day")}
          </span>
        </button>
      </div>
    </div>
  );
}
