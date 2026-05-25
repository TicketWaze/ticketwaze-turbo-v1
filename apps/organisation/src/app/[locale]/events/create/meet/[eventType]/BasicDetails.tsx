/* eslint-disable @next/next/no-img-element */
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
import Image from "next/image";
import type { CreateMeetFormValues } from "./types";
import { useTranslations } from "next-intl";
import { Input } from "@/components/shared/Inputs";
import { KeyboardEvent, ChangeEvent } from "react";
import { Warning2 } from "iconsax-reactjs";
import RichTextEditor from "@/components/shared/RichTextEditor";
import UploadDocument from "@/assets/icons/document-upload.svg";

type Props = {
  register: UseFormRegister<CreateMeetFormValues>;
  control: Control<CreateMeetFormValues>;
  errors: any;
  imagePreview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setValue: UseFormSetValue<CreateMeetFormValues>;
  getValues: UseFormGetValues<CreateMeetFormValues>;
};

export default function BasicDetails({
  register,
  control,
  errors,
  imagePreview,
  handleFileChange,
  setValue,
  getValues,
}: Props) {
  const t = useTranslations("Events.create_event");

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
      <div className="p-6 max-w-216 w-full mx-auto rounded-[15px] flex flex-col gap-6 border border-neutral-100">
        <span className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
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
        <Controller
          control={control}
          name="eventDescription"
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder={t("description")}
              error={errors.eventDescription?.message}
            />
          )}
        />
      </div>

      {/* tags */}
      <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
        <span className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
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
            className="flex flex-wrap gap-2 bg-neutral-100 w-full rounded-[5rem] p-8 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus-within:border-primary-500 cursor-text"
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
              className="flex-1 outline-none min-w-48 bg-transparent placeholder:text-neutral-600"
            />
          </div>
        </div>
        {errors.activityTags && (
          <span className={"text-[1.2rem] px-8 text-failure"}>
            {errors.activityTags?.message}
          </span>
        )}
      </div>

      {/* image */}
      <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
        <span className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
          {t("thumbnail")}
        </span>

        {imagePreview ? (
          <div className="relative w-full h-120">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-120 object-cover object-top rounded-2xl"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
            />
          </div>
        ) : (
          <div className="py-24 px-[1.4rem] rounded-[7px] border border-[#e5e5e5] border-dashed bg-[#FBFBFB] flex items-center justify-center relative">
            <div className="flex flex-col items-center gap-4 ">
              <div className="flex flex-col gap-4 items-center">
                <Image
                  src={UploadDocument}
                  alt="upload"
                  width={24}
                  height={24}
                />
                <p className="text-[1.5rem] leading-6 text-neutral-500 ">
                  {t("thumbnail_text")}{" "}
                  <span className="font-medium text-primary-500">
                    {t("browse")}
                  </span>
                </p>
              </div>
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
