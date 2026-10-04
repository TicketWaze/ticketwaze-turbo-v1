/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { AnimatePresence, motion } from "motion/react";
import NextDayHint from "@/components/shared/NextDayHint";
import type { CreateMeetFormValues, EventDay } from "./types";
import { AddCircle, Trash } from "iconsax-reactjs";
import { toast } from "sonner";
import { MembershipTier } from "@ticketwaze/typescript-config";
import { Section } from "@/components/create/CreateParts";
import { PickerField } from "@/components/create/FormFields";

type Props = {
  register: UseFormRegister<CreateMeetFormValues>;
  errors: any;
  eventDays: EventDay[];
  setEventDays: React.Dispatch<React.SetStateAction<EventDay[]>>;
  setValue: UseFormSetValue<CreateMeetFormValues>;
  t: (s: string) => string;
  control: Control<any>;
  membershipTier: MembershipTier;
};

/** Day cards (Figma "Day 1 / Day 2"): date, start and end time, add/remove. */
export default function StepDateTime({
  register,
  errors,
  eventDays,
  setEventDays,
  setValue,
  t,
  control,
  membershipTier,
}: Props) {
  const addDay = () => {
    if (membershipTier.membershipName === "free") {
      toast.info(t("pro"));
      return;
    }
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
      .map((day, i) => ({ ...day, dayNumber: i + 1 }));
    setValue("eventDays", updated, { shouldValidate: true });
    setEventDays(updated);
  };

  return (
    <div className="flex flex-col gap-12">
      <AnimatePresence initial={false}>
        {eventDays.map((eventDay, index) => (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            <Section
              title={`${t("day")} ${index + 1}`}
              action={
                index > 0 && (
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeDay(index)}
                    className="cursor-pointer flex"
                  >
                    <Trash variant="Bulk" color="#DE0028" size={20} />
                  </button>
                )
              }
            >
              <input type="hidden" {...register(`eventDays.${index}.dayNumber`)} />
              <input type="hidden" {...register(`eventDays.${index}.timezone`)} />

              <PickerField
                label={t("start_date")}
                type="date"
                inputProps={register(`eventDays.${index}.eventDate`)}
                error={errors.eventDays?.[index]?.eventDate?.message}
              />

              <div className="flex gap-4 items-start">
                <PickerField
                  label={t("start_time")}
                  type="time"
                  inputProps={register(`eventDays.${index}.startTime`)}
                  error={errors.eventDays?.[index]?.startTime?.message}
                />
                <div className="flex-1 min-w-0">
                  <PickerField
                    label={t("end_time")}
                    type="time"
                    inputProps={register(`eventDays.${index}.endTime`)}
                    error={errors.eventDays?.[index]?.endTime?.message}
                  />
                  <NextDayHint
                    control={control}
                    index={index}
                    label={t("errors.dateAndTime.endsNextDay")}
                  />
                </div>
              </div>

              <span className="text-neutral-500 text-[1.2rem] px-2">
                {eventDay.timezone}
              </span>
            </Section>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="w-full max-w-[54rem] mx-auto flex justify-end">
        <button
          type="button"
          onClick={addDay}
          className="cursor-pointer flex gap-3 items-center group"
        >
          <AddCircle
            color="#E45B00"
            variant="Bulk"
            size="20"
            className="transition-transform group-hover:rotate-90"
          />
          <span className="text-[1.5rem] leading-8 text-primary-500">
            {t("add_day")}
          </span>
        </button>
      </div>
      <div className="h-24 lg:hidden" />
    </div>
  );
}
