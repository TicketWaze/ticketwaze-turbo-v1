/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useRef, useState } from "react";
import {
  Controller,
  UseFormRegister,
  Control,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import type { CreateInPersonFormValues } from "./types";
import { useTranslations } from "next-intl";
import countries from "@/lib/Countries";
import { Input } from "@/components/shared/Inputs";
import { KeyboardEvent, ChangeEvent } from "react";
import { Warning2 } from "iconsax-reactjs";

type Props = {
  register: UseFormRegister<CreateInPersonFormValues>;
  control: Control<CreateInPersonFormValues>;
  errors: any;
  imagePreview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  setValue: UseFormSetValue<CreateInPersonFormValues>;
  getValues: UseFormGetValues<CreateInPersonFormValues>;
};

export default function BasicDetails({
  register,
  control,
  errors,
  imagePreview,
  handleFileChange,
  mapContainerRef,
  setValue,
  getValues,
}: Props) {
  const t = useTranslations("Events.create_event");
  const [wordCount, setWordCount] = useState(0);
  function handleWordCount(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setWordCount(e.target.value.length);
  }
  const availableCountries = countries.map((country) => country.name);
  const availableState = countries.map((country) => country.state).flat();
  const [selectedState, setSelectedState] = useState<string>();
  const cities = availableState.filter((state) => state.name === selectedState);

  // tags handler
  const [tags, setTags] = useState<string[]>(getValues("activityTags"));
  const [input, setInput] = useState<string>("");

  const addTag = (): void => {
    const tag = input.trim().replace("#", "").toLowerCase();

    if (!tag) return;
    if (tags.includes(tag)) return;

    setTags((prev) => [...prev, tag]);
    setValue("activityTags", [...tags, tag]);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    // Create tag
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault();
      addTag();
    }

    // Backspace editing
    if (e.key === "Backspace" && input === "" && tags.length > 0) {
      e.preventDefault();

      const lastTag = tags[tags.length - 1];

      setTags((prev) => prev.slice(0, prev.length - 1));
      setValue("activityTags", tags.slice(0, tags.length - 1));
      setInput(lastTag);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  };
  const inputRef = useRef<HTMLInputElement>(null);
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
              >
                <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] p-12 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500">
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
      <div className="max-w-[540px] w-full mx-auto p-[15px] rounded-[15px] flex flex-col gap-[15px] border border-neutral-100">
        <span className="font-semibold text-[16px] leading-[22px] text-deep-100">
          {t("event_tags")}
        </span>
        <div className="flex flex-col items-start gap-4 border p-4 rounded-2xl border-neutral-300">
          <Warning2 size="24" color="#737C8A" variant="Bulk" />
          <div>
            <p className="text-[1.2rem] leading-8 text-neutral-800">
              {t("tagTip.description")}
            </p>
          </div>
        </div>
        <div className="w-full">
          <div
            className="flex flex-wrap gap-2 bg-neutral-100 w-full rounded-[5rem] p-[20px] text-[1.5rem] leading-[20px] text-deep-200 outline-none border border-transparent focus-within:border-primary-500 cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 bg-primary-100/50 px-2 text-primary-500 rounded-full text-[1.4rem] whitespace-nowrap"
              >
                #{tag}
              </div>
            ))}

            <input
              ref={inputRef}
              value={input}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={t("tagPlaceholder")}
              className="flex-1 outline-none min-w-[120px] bg-transparent placeholder:text-neutral-600"
            />
          </div>
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
