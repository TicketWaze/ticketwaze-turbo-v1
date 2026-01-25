"use client";
import React, { useState } from "react";
import {
  Controller,
  UseFormRegister,
  Control,
  UseFormSetValue,
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import type { EditInPersonFormValues } from "./types";
import { useLocale, useTranslations } from "next-intl";
import { englishEventTags, frenchEventTags } from "@/lib/EventTags";
import countries from "@/lib/Countries";
import { Event } from "@ticketwaze/typescript-config";
import { Input } from "@/components/shared/Inputs";

type Props = {
  register: UseFormRegister<EditInPersonFormValues>;
  control: Control<EditInPersonFormValues>;
  errors: any;
  imagePreview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  setValue: UseFormSetValue<EditInPersonFormValues>;
  event: Event;
};

export default function BasicDetails({
  register,
  control,
  errors,
  imagePreview,
  handleFileChange,
  mapContainerRef,
  setValue,
  event,
}: Props) {
  const t = useTranslations("Events.create_event");
  const [wordCount, setWordCount] = useState(event.eventDescription.length);
  function handleWordCount(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setWordCount(e.target.value.length);
  }
  const locale = useLocale();
  const eventTags = locale === "fr" ? frenchEventTags : englishEventTags;
  const availableCountries = countries.map((country) => country.name);
  const availableState = countries.map((country) => country.state).flat();
  const [selectedState, setSelectedState] = useState<string>(event.state);
  const cities = availableState.filter((state) => state.name === selectedState);
  return (
    <div className="flex flex-col gap-12">
      {/* Event details */}
      <div className="p-[15px] max-w-[540px] w-full mx-auto rounded-[15px] flex flex-col gap-[15px] border border-neutral-100">
        <span className="font-semibold text-[16px] leading-[22px] text-deep-100">
          {t("event_details")}
        </span>
        <Input
          {...register("eventName")}
          type="text"
          maxLength={50}
          error={errors.eventName?.message}
        >
          {t("event_name")}
        </Input>
        <div>
          <textarea
            {...register("eventDescription")}
            className={
              "bg-neutral-100 w-full rounded-[2rem] h-[150px] resize-none p-8 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500"
            }
            placeholder={t("description")}
            minLength={150}
            maxLength={350}
            onChange={handleWordCount}
          />
          <div className="flex items-center justify-between">
            <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
              {errors.eventDescription?.message}
            </span>
            {wordCount > 0 && (
              <span
                className={`text-[1.2rem] text-nowrap px-8 py-2 ${wordCount < 150 ? "text-failure" : "text-success"}`}
              >
                {wordCount} / 350
              </span>
            )}
          </div>
        </div>
      </div>

      {/* location */}
      <div className="max-w-[540px] w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100">
        <span className="font-semibold text-[16px] leading-[22px] text-deep-100">
          {t("location")}
        </span>
        <Input
          {...register("address")}
          type="text"
          error={errors.address?.message}
        >
          {t("address")}
        </Input>

        <div className="flex flex-col lg:flex-row w-full gap-[15px] items-center justify-between">
          <div className="flex-1 w-full">
            <Controller
              control={control}
              name="state"
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value}
                  onValueChange={(e) => {
                    field.onChange(e);
                    setSelectedState(e);
                    setValue("city", "");
                  }}
                  defaultValue={"sud"}
                  disabled
                >
                  <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] p-12 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500 z">
                    <SelectValue placeholder={t("state")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableState.map((state, i) => {
                      return (
                        <SelectItem
                          className={"text-[1.4rem] text-deep-100"}
                          key={i}
                          value={state.name}
                        >
                          {state.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.state && (
              <span className="text-[1.2rem] px-8 py-2 text-failure">
                {errors.state?.message}
              </span>
            )}
          </div>
          <div className="flex-1 w-full">
            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled
                >
                  <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] p-12 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500 z">
                    <SelectValue placeholder={t("city")} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities[0]?.cities.map((city, i) => {
                      return (
                        <SelectItem
                          className={"text-[1.4rem] text-deep-100"}
                          key={i}
                          value={city}
                        >
                          {city}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.city && (
              <span className="text-[1.2rem] px-8 py-2 text-failure">
                {errors.city?.message}
              </span>
            )}
          </div>
        </div>

        <div>
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <Select
                {...field}
                value={field.value}
                onValueChange={field.onChange}
                defaultValue={availableCountries[0]}
                disabled
              >
                <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] p-12 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500 z">
                  <SelectValue placeholder={t("country")} />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => {
                    return (
                      <SelectItem
                        className={"text-[1.4rem] text-deep-100"}
                        key={country}
                        value={country}
                      >
                        {country}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
          <span className="text-[1.2rem] px-8 py-2 text-failure">
            {errors.country?.message}
          </span>
        </div>
        <div className="w-full h-[300px] relative">
          <div
            style={{ height: "100%" }}
            ref={mapContainerRef}
            className="map-container"
          />
          <span className="text-[1.2rem] px-8 py-2 text-failure">
            {errors.longitude?.message}
          </span>
        </div>
      </div>

      {/* tags */}
      <div className="max-w-[540px]  w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100">
        <span className="font-semibold text-[16px] leading-[22px] text-deep-100">
          {t("event_tags")}
        </span>
        <div>
          <Controller
            control={control}
            name="eventTagId"
            render={({ field }) => (
              <Select
                {...field}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] p-12 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500 z">
                  <SelectValue placeholder={t("select_tags")} />
                </SelectTrigger>
                <SelectContent>
                  {eventTags.map((tag, i) => (
                    <SelectItem
                      key={tag.id}
                      value={tag.id}
                      className="text-[1.5rem] leading-[20px] border-b border-neutral-100 mb-3 pb-3"
                    >
                      {tag.tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <span className="text-[1.2rem] px-8 py-2 text-failure">
            {errors.eventTagId?.message}
          </span>
        </div>
      </div>

      {/* image */}
      <div className="max-w-[540px] w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100">
        <span className="font-semibold text-[16px] leading-[22px] text-deep-100">
          {t("thumbnail")}
        </span>

        {imagePreview ? (
          <div className="relative w-full h-[300px]">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-[300px] object-cover object-top rounded-[1rem]"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
            />
          </div>
        ) : (
          <div className="py-[6rem] px-[1.4rem] rounded-[7px] border border-[#e5e5e5] border-dashed bg-[#FBFBFB] flex items-center justify-center relative">
            <div className="flex flex-col items-center gap-4 ">
              <p className="text-[1.5rem] leading-[20px] text-neutral-500 ">
                {t("thumbnail_text")}{" "}
                <span className="font-medium text-primary-500">
                  {t("browse")}
                </span>
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        )}

        <span className="text-[1.2rem] px-8 py-2 text-failure">
          {errors.eventImage?.message}
        </span>
      </div>

      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
