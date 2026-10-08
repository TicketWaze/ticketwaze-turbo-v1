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
  useWatch,
} from "react-hook-form";
import Image from "next/image";
import type { CreateMeetFormValues } from "./types";
import { useTranslations } from "next-intl";
import { Input } from "@/components/shared/Inputs";
import { KeyboardEvent, ChangeEvent } from "react";
import { CloseCircle, TickCircle, Warning2 } from "iconsax-reactjs";
import type { EventNameAvailability } from "@/hooks/useEventNameAvailability";
import RichTextEditor from "@/components/shared/RichTextEditor";
import UploadDocument from "@/assets/icons/document-upload.svg";
import ToggleIcon from "@/components/shared/ToggleIcon";
import EventDocumentField from "@/components/shared/EventDocumentField";
import type useEventDocumentField from "@/hooks/useEventDocumentField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Section } from "@/components/create/CreateParts";

// The counter promises the limit the input enforces; the minimum mirrors the
// schema's `eventName: z.string().min(10)`.
const NAME_MIN_CHARS = 10;
const NAME_MAX_CHARS = 50;

type Props = {
  register: UseFormRegister<CreateMeetFormValues>;
  control: Control<CreateMeetFormValues>;
  errors: any;
  imagePreview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setValue: UseFormSetValue<CreateMeetFormValues>;
  getValues: UseFormGetValues<CreateMeetFormValues>;
  isPrivate: boolean;
  setIsPrivate: React.Dispatch<React.SetStateAction<boolean>>;
  nameStatus: EventNameAvailability;
  /** The optional handout's state and rules. See `useEventDocumentField`. */
  document: ReturnType<typeof useEventDocumentField>;
  /** Rendered first — the unified create page's Physical/Virtual select. */
  topSlot?: React.ReactNode;
  /** Figma's "Event Link" card (platform, link, password). */
  linkSlot?: React.ReactNode;
  category?: string;
  onCategoryChange?: (value: string) => void;
  categories?: readonly string[];
  categoryError?: string;
};

export default function BasicDetails({
  register,
  control,
  errors,
  imagePreview,
  handleFileChange,
  setValue,
  getValues,
  isPrivate,
  setIsPrivate,
  nameStatus,
  document,
  topSlot,
  linkSlot,
  category,
  onCategoryChange,
  categories,
  categoryError,
}: Props) {
  const t = useTranslations("Events.create_event");
  const tCategory = useTranslations("Events.create_event.list.inPerson");
  const nameLength = (useWatch({ control, name: "eventName" }) ?? "").length;

  const [tags, setTags] = useState<string[]>(getValues("activityTags"));
  const [input, setInput] = useState<string>("");
  const addTag = (): void => {
    const tag = input.trim().replace("#", "").toLowerCase();
    if (!tag || tags.includes(tag)) return;
    setTags((prev) => [...prev, tag]);
    setValue("activityTags", [...tags, tag]);
    setInput("");
  };
  const removeTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    setValue("activityTags", next);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && input === "" && tags.length > 0) {
      e.preventDefault();
      const lastTag = tags[tags.length - 1];
      setTags((prev) => prev.slice(0, prev.length - 1));
      setValue("activityTags", tags.slice(0, tags.length - 1));
      setInput(lastTag);
    }
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void =>
    setInput(e.target.value);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-12">
      {topSlot}

      <Section title={t("event_details")}>
        <Input
          {...register("eventName")}
          type="text"
          maxLength={NAME_MAX_CHARS}
          charCount={nameLength}
          minChars={NAME_MIN_CHARS}
          maxChars={NAME_MAX_CHARS}
          error={
            errors.eventName?.message ??
            (nameStatus === "taken"
              ? t("errors.basicDetails.nameTaken")
              : nameStatus === "unknown"
                ? t("errors.basicDetails.nameCheckFailed")
                : undefined)
          }
          trailing={
            nameStatus === "checking" ? (
              <div className="w-8 h-8 border-3 border-t-primary-500 border-neutral-300 rounded-full animate-spin" />
            ) : nameStatus === "available" ? (
              <TickCircle size="20" color="#349C2E" variant="Bulk" />
            ) : nameStatus === "taken" ? (
              <CloseCircle size="20" color="#DE0028" variant="Bulk" />
            ) : nameStatus === "unknown" ? (
              <Warning2 size="20" color="#E45B00" variant="Bulk" />
            ) : null
          }
        >
          {t("event_name")}
        </Input>
        {categories && onCategoryChange && (
          <div>
            <Select value={category || undefined} onValueChange={onCategoryChange}>
              <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] data-[size=default]:h-[6rem] shadow-none focus-visible:ring-0 focus-visible:border-primary-500 px-8 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 data-[placeholder]:text-neutral-600">
                <SelectValue placeholder={t("category_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="text-[1.4rem] text-deep-100">
                    {tCategory(`categories.${c}.title`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryError && (
              <span className="text-[1.2rem] px-8 py-2 text-failure">{categoryError}</span>
            )}
          </div>
        )}
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
      </Section>

      {linkSlot}

      <Section>
        <div className="flex items-center justify-between gap-6">
          <p className="text-[1.6rem] leading-8 text-deep-100">{t("mark_as_private")}</p>
          <label className="relative inline-block h-12 w-20 shrink-0 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
            <input
              className="peer sr-only"
              id="private-event"
              type="checkbox"
              checked={isPrivate}
              onChange={() => setIsPrivate((prev) => !prev)}
            />
            <ToggleIcon />
          </label>
        </div>
        <p className="text-[1.2rem] leading-8 text-neutral-800">{t("private_tip")}</p>
      </Section>

      <Section title={t("event_tags")}>
        <div
          className="flex flex-wrap items-center gap-2 bg-neutral-100 w-full rounded-[5rem] min-h-[6rem] px-8 py-3 text-[1.5rem] leading-8 text-deep-200 border border-transparent focus-within:border-primary-500 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-2 bg-white border border-neutral-200 pl-4 pr-2 py-1 text-neutral-700 rounded-full text-[1.2rem] whitespace-nowrap"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="flex cursor-pointer"
              >
                <CloseCircle size="14" variant="Bulk" color="#737C8A" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
            placeholder={tags.length === 0 ? t("tagPlaceholder") : undefined}
            className="flex-1 outline-none min-w-48 bg-transparent placeholder:text-neutral-600"
          />
        </div>
        {errors.activityTags && (
          <span className="text-[1.2rem] px-8 text-failure">{errors.activityTags?.message}</span>
        )}
        <div className="flex flex-col items-start gap-4 border p-4 rounded-2xl border-neutral-300">
          <Warning2 size="24" color="#737C8A" variant="Bulk" />
          <p className="text-[1.2rem] leading-8 text-neutral-800">{t("tagTip.description")}</p>
        </div>
      </Section>

      <Section title={t("thumbnail")}>
        {imagePreview ? (
          <div className="relative w-full h-[18rem] rounded-[1rem] overflow-hidden group">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 z-10 opacity-0 cursor-pointer"
            />
          </div>
        ) : (
          <div className="py-20 px-[1.4rem] rounded-[.75rem] border border-[#e5e5e5] border-dashed bg-[#FBFBFB] hover:bg-primary-50/40 transition-colors flex items-center justify-center relative">
            <div className="flex flex-col gap-4 items-center">
              <Image src={UploadDocument} alt="" width={24} height={24} />
              <p className="text-[1.4rem] leading-6 text-neutral-500 text-center">
                {t("thumbnail_text")}{" "}
                <span className="font-medium text-primary-500">{t("browse")}</span>
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 z-10 opacity-0 cursor-pointer"
            />
          </div>
        )}
        {errors.eventImage?.message && (
          <span className="text-[1.2rem] px-8 py-2 text-failure">{errors.eventImage?.message}</span>
        )}
      </Section>

      {/* Optional handout, delivered to ticket holders once the event starts. */}
      <EventDocumentField
        file={document.file}
        onChange={document.choose}
        maxFileMb={document.maxFileMb}
        locked={document.locked}
        error={document.error}
      />
      <div className="h-24 lg:hidden" />
    </div>
  );
}
