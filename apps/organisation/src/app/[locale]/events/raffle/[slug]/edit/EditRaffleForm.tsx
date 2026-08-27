/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DateTime } from "luxon";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useFieldArray,
  Controller,
  SubmitHandler,
} from "react-hook-form";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { AddCircle, InfoCircle, Trash, Warning2 } from "iconsax-reactjs";
import { useRouter } from "@/i18n/navigation";
import { UpdateRaffle } from "@/actions/EventActions";
import BackButton from "@/components/shared/BackButton";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import RichTextEditor from "@/components/shared/RichTextEditor";
import ToggleIcon from "@/components/shared/ToggleIcon";
import UploadDocument from "@/assets/icons/document-upload.svg";
import LocationPicker from "@/lib/LocationPicker";
import { compressImage } from "@/lib/compressImage";
import { MAX_UPLOAD_BYTES, formDataSize } from "@/lib/uploadLimit";
import PrizeImagePicker from "@/components/shared/PrizeImagePicker";
import { Raffle } from "@ticketwaze/typescript-config";
import { slugify } from "@/lib/Slugify";
import useRaffleTitleAvailability from "@/hooks/useRaffleTitleAvailability";
import AttendeePricePreview from "@/components/shared/AttendeePricePreview";
import CharCounter from "@/components/shared/CharCounter";

// The counter has to promise the limit the input actually enforces, so the
// `maxLength` attribute and the counter's denominator read from one constant.
// The minimum mirrors the schema's `name: z.string().min(10)`.
const NAME_MIN_CHARS = 10;
const NAME_MAX_CHARS = 80;

const inputClass =
  "bg-neutral-100 w-full rounded-[1.5rem] p-6 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";
const cardClass =
  "max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100";
const sectionTitle = "font-semibold text-[1.6rem] leading-8 text-deep-100";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function makeRaffleSchema(t: TranslateFn) {
  return z
    .object({
      name: z.string().min(10, t("errors.name")),
      description: z.string().min(20, t("errors.description")),
      ticketPrice: z.coerce.number().gt(0, t("errors.price")),
      currency: z.enum(["HTG", "USD"]),
      absorbFees: z.boolean(),
      unlimited: z.boolean(),
      totalTickets: z.coerce.number().optional(),
      activityTags: z.array(z.string()),
      location: z.object({ lat: z.number(), lng: z.number() }).optional(),
      salesStart: z.string().min(1, t("errors.sales_start")),
      salesEnd: z.string().min(1, t("errors.sales_end")),
      drawDate: z.string().min(1, t("errors.draw_date")),
      drawMode: z.enum(["automatic", "manual"]),
      prizes: z
        .array(
          z.object({
            title: z.string().min(1, t("errors.prize_title")),
            description: z.string().min(1, t("errors.prize_description")),
            // Carried through the form so an edit that does not touch a prize
            // keeps its existing picture. Cleared when the organiser removes it.
            imageKey: z.string().nullable().optional(),
            imageUrl: z.string().nullable().optional(),
          }),
        )
        .min(1, t("errors.prize_min")),
    })
    .refine(
      (d) =>
        !d.salesEnd ||
        !d.drawDate ||
        new Date(d.salesEnd) <= new Date(d.drawDate),
      { message: t("errors.sales_window"), path: ["salesEnd"] },
    )
    .refine((d) => d.unlimited || (d.totalTickets ?? 0) >= d.prizes.length, {
      message: t("errors.total_tickets"),
      path: ["totalTickets"],
    });
}

function Field({
  label,
  error,
  counter,
  children,
}: {
  label: string;
  error?: string;
  /** Optional <CharCounter>, shown opposite the error on the same row. */
  counter?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[1.4rem] font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {(error || counter) && (
        <div className="flex items-center justify-between">
          <span className="text-[1.2rem] text-failure">{error}</span>
          {counter}
        </div>
      )}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] bg-primary-500/10 border border-primary-500/20 px-5 py-4">
      <InfoCircle
        size="20"
        color="#E45B00"
        variant="Bulk"
        className="shrink-0 mt-[2px]"
      />
      <p className="text-[1.3rem] leading-7 text-neutral-700">{children}</p>
    </div>
  );
}

// ISO timestamp -> value for <input type="datetime-local">, shown in the
// raffle's own timezone (falls back to the browser zone for legacy raffles).
function toLocalInput(iso: string, zone?: string | null) {
  const dt = DateTime.fromISO(iso).setZone(zone || DateTime.local().zoneName);
  return dt.isValid ? dt.toFormat("yyyy-MM-dd'T'HH:mm") : "";
}

export default function EditRaffleForm({ raffle }: { raffle: Raffle }) {
  const t = useTranslations("Events.create_event.raffle");
  const tr = useTranslations("Raffles.single_raffle");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const [submitting, setSubmitting] = useState(false);

  const schema = makeRaffleSchema((k, values) => t(k, values));
  type TFormIn = z.input<typeof schema>;
  type TFormOut = z.output<typeof schema>;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TFormIn, any, TFormOut>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: raffle.title,
      description: raffle.description,
      ticketPrice:
        raffle.currency === "USD" ? raffle.usdPrice : raffle.ticketPrice,
      currency: raffle.currency as "HTG" | "USD",
      absorbFees: raffle.absorbFees === true,
      unlimited: raffle.totalTicketsLimit === null,
      totalTickets: raffle.totalTicketsLimit ?? undefined,
      activityTags: raffle.activityTags ?? [],
      location: raffle.location ?? undefined,
      salesStart: toLocalInput(raffle.salesStartAt, raffle.timezone),
      salesEnd: toLocalInput(raffle.salesEndAt, raffle.timezone),
      drawDate: toLocalInput(raffle.drawAt, raffle.timezone),
      drawMode: raffle.drawMode as "automatic" | "manual",
      prizes:
        raffle.prizes.length > 0
          ? [...raffle.prizes]
              .sort((a, b) => a.rank - b.rank)
              .map((p) => ({
                title: p.title,
                description: p.description ?? "",
                imageKey: p.imageKey ?? null,
                imageUrl: p.imageUrl ?? null,
              }))
          : [{ title: "", description: "", imageKey: null, imageUrl: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "prizes" });
  const unlimited = watch("unlimited");
  const absorbFees = watch("absorbFees");

  // Checked live per keystroke. The API re-checks on submit, so this only
  // decides whether the button is usable, never whether the title is valid.
  const titleStatus = useRaffleTitleAvailability(
    watch("name"),
    raffle.raffleId,
  );

  const [tags, setTags] = useState<string[]>(raffle.activityTags ?? []);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  function addTag() {
    const tag = tagInput.trim().replace("#", "").toLowerCase();
    if (!tag || tags.includes(tag)) {
      setTagInput("");
      return;
    }
    const next = [...tags, tag];
    setTags(next);
    setValue("activityTags", next);
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      e.preventDefault();
      const lastTag = tags[tags.length - 1];
      const next = tags.slice(0, tags.length - 1);
      setTags(next);
      setValue("activityTags", next);
      setTagInput(lastTag ?? "");
    }
  }

  function removeTag(tag: string) {
    const next = tags.filter((tel) => tel !== tag);
    setTags(next);
    setValue("activityTags", next);
  }

  const [coverPreview, setCoverPreview] = useState<string | null>(
    raffle.coverImageUrl ?? null,
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // A phone photo exceeds the server action's body limit on its own, so this
    // has to be downscaled before it ever reaches the action.
    const compressed = await compressImage(file);
    setCoverFile(compressed);
    setCoverPreview(URL.createObjectURL(compressed));
  }

  // Prize images are tracked here rather than in form state: an existing image
  // is not something the user types, and reading it back with `watch()` would
  // drag the whole form through React Compiler's incompatible-library path.
  // Both maps are keyed by the field-array id, so removing a prize cannot shift
  // someone else's picture onto the wrong row.
  const [prizeFiles, setPrizeFiles] = useState<
    Record<string, { file: File; preview: string }>
  >({});
  // Prizes whose stored image the organiser explicitly removed.
  const [clearedPrizeImages, setClearedPrizeImages] = useState<
    Record<string, true>
  >({});

  // A prize picture is required. Validated on submit rather than in the zod
  // schema, since a File cannot travel inside the prizes JSON.
  const [missingPrizeImages, setMissingPrizeImages] = useState<
    Record<string, true>
  >({});

  function setPrizeImage(fieldId: string, file: File) {
    setPrizeFiles((current) => ({
      ...current,
      [fieldId]: { file, preview: URL.createObjectURL(file) },
    }));
    setClearedPrizeImages((current) => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
    setMissingPrizeImages((current) => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }

  function clearPrizeImage(fieldId: string) {
    setPrizeFiles((current) => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
    setClearedPrizeImages((current) => ({ ...current, [fieldId]: true }));
  }

  function removePrize(index: number, fieldId: string) {
    setPrizeFiles((current) => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
    setMissingPrizeImages((current) => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
    remove(index);
  }

  /** A prize satisfies the picture requirement with a new upload or a kept one. */
  function hasPrizeImage(field: { id: string; imageUrl?: string | null }) {
    if (prizeFiles[field.id]) return true;
    if (clearedPrizeImages[field.id]) return false;
    return Boolean(field.imageUrl);
  }

  /** The image a prize should keep, if any: a new upload wins, a clear removes. */
  function keptImageKey(field: { id: string; imageKey?: string | null }) {
    if (prizeFiles[field.id] || clearedPrizeImages[field.id]) return null;
    return field.imageKey ?? null;
  }

  const onSubmit: SubmitHandler<TFormOut> = async (data) => {
    const missing = fields.filter((field) => !hasPrizeImage(field));
    if (missing.length > 0) {
      setMissingPrizeImages(
        Object.fromEntries(missing.map((field) => [field.id, true as const])),
      );
      return;
    }
    if (!organisation?.organisationId) {
      toast.error(t("no_org"));
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    // Cover is optional on edit — only sent when the organiser picked a new one.
    if (coverFile) fd.append("cover", coverFile);
    fd.append("title", data.name);
    fd.append("description", data.description);
    fd.append("ticketPrice", String(data.ticketPrice));
    fd.append("currency", data.currency);
    fd.append("absorbFees", JSON.stringify(data.absorbFees));
    fd.append("unlimited", JSON.stringify(data.unlimited));
    if (!data.unlimited && data.totalTickets != null) {
      fd.append("totalTickets", String(data.totalTickets));
    }
    fd.append("salesStartAt", data.salesStart);
    fd.append("salesEndAt", data.salesEnd);
    fd.append("drawAt", data.drawDate);
    // Keep the raffle's original zone so the datetimes round-trip consistently.
    fd.append(
      "timezone",
      raffle.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    fd.append("drawMode", data.drawMode);
    fd.append("activityTags", JSON.stringify(data.activityTags));
    if (data.location) {
      fd.append("location", JSON.stringify(data.location));
    }
    fd.append(
      "prizes",
      JSON.stringify(
        data.prizes.map((p, index) => {
          // Present only when this prize keeps the image it already had; the
          // server ignores any key that is not already one of its own.
          const keep = fields[index] ? keptImageKey(fields[index]) : null;
          return {
            title: p.title,
            description: p.description,
            ...(keep ? { imageKey: keep } : {}),
          };
        }),
      ),
    );
    // Files cannot travel inside the prizes JSON, so each new one rides as an
    // indexed field the server lines up with the array by position.
    fields.forEach((field, index) => {
      const image = prizeFiles[field.id];
      if (image) fd.append(`prizeImage_${index}`, image.file);
    });

    if (formDataSize(fd) > MAX_UPLOAD_BYTES) {
      toast.error(t("errors.too_large"));
      setSubmitting(false);
      return;
    }

    try {
      const result = await UpdateRaffle(
        organisation.organisationId,
        raffle.raffleId,
        fd,
        locale,
      );
      if (result.status === "success") {
        // The draw has entries and this edit could change what those entrants
        // think they paid for, so it is waiting on an admin rather than already
        // live. Saying so is the difference between "nothing happened" and
        // "your change is queued" — the raffle page still shows the old details.
        if (result.pendingReview) toast.info(tr("heldForReview"));
        else toast.success(tr("updateSuccess"));
        router.push(`/events/raffle/${slugify(data.name, raffle.raffleId)}`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      // See CreateRaffleForm: a rejected server action would otherwise leave the
      // button spinning with nothing to show for it.
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("errors.submit_failed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll pb-12">
      <BackButton text={t("back")} />

      <h1 className="max-w-216 w-full mx-auto font-primary font-medium text-[2.6rem] leading-12 text-black">
        {tr("editTitle")}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-12"
        noValidate
      >
        {/* Cover image */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("cover")}</span>
          {coverPreview ? (
            <div className="relative w-full h-120">
              <img
                src={coverPreview}
                alt="Preview"
                className="w-full h-120 object-cover object-top rounded-2xl"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleCover}
                className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
              />
            </div>
          ) : (
            <div className="py-24 px-[1.4rem] rounded-[7px] border border-[#e5e5e5] border-dashed bg-[#FBFBFB] flex items-center justify-center relative">
              <div className="flex flex-col items-center gap-4">
                <Image
                  src={UploadDocument}
                  alt="upload"
                  width={24}
                  height={24}
                />
                <p className="text-[1.5rem] leading-6 text-neutral-500">
                  {t("cover_text")}{" "}
                  <span className="font-medium text-primary-500">
                    {t("browse")}
                  </span>
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCover}
                  className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("details")}</span>
          <Field
            label={t("name")}
            error={
              errors.name?.message ??
              (titleStatus === "taken" ? t("errors.name_taken") : undefined)
            }
            counter={
              <CharCounter
                count={(watch("name") ?? "").length}
                min={NAME_MIN_CHARS}
                max={NAME_MAX_CHARS}
              />
            }
          >
            <input
              {...register("name")}
              type="text"
              maxLength={NAME_MAX_CHARS}
              className={inputClass}
            />
          </Field>
          <Field label={t("description")} error={errors.description?.message}>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("description_placeholder")}
                  error={undefined}
                />
              )}
            />
          </Field>
        </div>

        {/* Tags */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("tags")}</span>
          <div
            className="flex flex-wrap gap-2 bg-neutral-100 w-full rounded-[5rem] p-8 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus-within:border-primary-500 cursor-text"
            onClick={() => tagInputRef.current?.focus()}
          >
            {tags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => removeTag(tag)}
                className="flex items-center gap-1 bg-primary-100/50 px-2 text-primary-500 rounded-full text-[1.4rem] whitespace-nowrap"
              >
                #{tag}
              </button>
            ))}
            <input
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              placeholder={t("tags_placeholder")}
              className="flex-1 outline-none min-w-48 bg-transparent placeholder:text-neutral-600"
            />
          </div>
          <div className="flex items-start gap-4 border p-4 rounded-2xl border-neutral-300">
            <Warning2
              size="24"
              color="#737C8A"
              variant="Bulk"
              className="shrink-0"
            />
            <p className="text-[1.2rem] leading-8 text-neutral-800">
              {t("tags_tip")}
            </p>
          </div>
        </div>

        {/* Location (optional) */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("location")}</span>
          <p className="text-[1.2rem] leading-7 text-neutral-600">
            {t("location_tip")}
          </p>
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <LocationPicker
                value={field.value ?? null}
                onLocationSelect={(loc) => field.onChange(loc ?? undefined)}
              />
            )}
          />
        </div>

        {/* Pricing */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("pricing")}</span>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Field
                label={t("ticket_price")}
                error={errors.ticketPrice?.message}
              >
                <input
                  {...register("ticketPrice")}
                  type="number"
                  min={0}
                  step="1"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label={t("currency")}>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <div className="flex gap-4">
                      {(["HTG", "USD"] as const).map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => field.onChange(c)}
                          className={`flex-1 rounded-[1.5rem] border py-5 text-[1.4rem] transition-colors ${
                            field.value === c
                              ? "border-primary-500 bg-primary-50 text-primary-500"
                              : "border-neutral-200 text-deep-100 hover:border-primary-500"
                          }`}
                        >
                          {c === "HTG" ? "Gourdes (HTG)" : "US Dollar (USD)"}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </Field>
            </div>
          </div>

          {/* Who pays the fees. Sits directly under the currency, because it is
              what decides whether the price above is what the payer pays or what
              the organiser keeps. */}
          <div className="flex items-center justify-between">
            <p className="text-[1.5rem] leading-8 text-deep-100">
              {t("absorb_fees")}
            </p>
            <label className="relative inline-block h-12 w-20 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
              <input
                className="peer sr-only"
                type="checkbox"
                checked={absorbFees}
                onChange={(e) => setValue("absorbFees", e.target.checked)}
              />
              <ToggleIcon />
            </label>
          </div>
          <p className="text-[1.2rem] leading-7 text-neutral-600">
            {t("absorb_fees_hint")}
          </p>

          <AttendeePricePreview
            price={watch("ticketPrice")}
            currency={watch("currency")}
            absorbFees={absorbFees}
          />
        </div>

        {/* Supply */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("supply")}</span>
          <div className="flex items-center justify-between">
            <p className="text-[1.5rem] leading-8 text-deep-100">
              {t("unlimited")}
            </p>
            <label className="relative inline-block h-12 w-20 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
              <input
                className="peer sr-only"
                type="checkbox"
                checked={unlimited}
                onChange={(e) => setValue("unlimited", e.target.checked)}
              />
              <ToggleIcon />
            </label>
          </div>
          {!unlimited && (
            <Field
              label={t("total_tickets")}
              error={errors.totalTickets?.message}
            >
              <input
                {...register("totalTickets")}
                type="number"
                min={1}
                step="1"
                className={inputClass}
              />
            </Field>
          )}
          <p className="text-[1.2rem] leading-7 text-neutral-600">
            {t("unlimited_tip")}
          </p>
        </div>

        {/* Schedule */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("schedule")}</span>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Field
                label={t("sales_start")}
                error={errors.salesStart?.message}
              >
                <input
                  {...register("salesStart")}
                  type="datetime-local"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label={t("sales_end")} error={errors.salesEnd?.message}>
                <input
                  {...register("salesEnd")}
                  type="datetime-local"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
          <Field label={t("draw_date")} error={errors.drawDate?.message}>
            <input
              {...register("drawDate")}
              type="datetime-local"
              className={inputClass}
            />
          </Field>
          <Field label={t("draw_mode")}>
            <Controller
              control={control}
              name="drawMode"
              render={({ field }) => (
                <div className="flex flex-col lg:flex-row gap-4">
                  {(
                    [
                      {
                        value: "automatic",
                        label: t("draw_mode_auto"),
                        desc: t("draw_mode_auto_desc"),
                      },
                      {
                        value: "manual",
                        label: t("draw_mode_manual"),
                        desc: t("draw_mode_manual_desc"),
                      },
                    ] as const
                  ).map((mode) => (
                    <button
                      type="button"
                      key={mode.value}
                      onClick={() => field.onChange(mode.value)}
                      className={`flex-1 text-left rounded-[1.5rem] border p-5 transition-colors ${
                        field.value === mode.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-neutral-200 hover:border-primary-500"
                      }`}
                    >
                      <span className="block text-[1.5rem] font-medium text-deep-100">
                        {mode.label}
                      </span>
                      <span className="block text-[1.3rem] leading-6 text-neutral-500">
                        {mode.desc}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            />
          </Field>
        </div>

        {/* Prizes */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className={sectionTitle}>{t("prizes")}</span>
          </div>
          <p className="text-[1.2rem] leading-7 text-neutral-600">
            {t("prizes_tip")}
          </p>
          {typeof errors.prizes?.message === "string" && (
            <span className="text-[1.2rem] text-failure">
              {errors.prizes.message}
            </span>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-4 rounded-[1.5rem] border border-neutral-200 p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[1.4rem] font-semibold text-deep-100">
                  {t("prize_rank", { rank: index + 1 })}
                </span>
                {index > 0 && (
                  <Trash
                    variant="Bulk"
                    color="#DE0028"
                    size={20}
                    className="cursor-pointer"
                    onClick={() => removePrize(index, field.id)}
                  />
                )}
              </div>
              <PrizeImagePicker
                preview={
                  prizeFiles[field.id]?.preview ??
                  (clearedPrizeImages[field.id]
                    ? null
                    : (field.imageUrl ?? null))
                }
                onSelect={(file) => setPrizeImage(field.id, file)}
                onClear={() => clearPrizeImage(field.id)}
                error={
                  missingPrizeImages[field.id]
                    ? t("errors.prize_image")
                    : undefined
                }
              />
              <Field
                label={t("prize_title")}
                error={errors.prizes?.[index]?.title?.message}
              >
                <input
                  {...register(`prizes.${index}.title` as const)}
                  type="text"
                  maxLength={80}
                  className={inputClass}
                />
              </Field>
              <Field
                label={t("prize_description")}
                error={errors.prizes?.[index]?.description?.message}
              >
                <textarea
                  {...register(`prizes.${index}.description` as const)}
                  rows={2}
                  maxLength={200}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              append({
                title: "",
                description: "",
                imageKey: null,
                imageUrl: null,
              })
            }
            className="flex items-center gap-3 self-start cursor-pointer"
          >
            <AddCircle color="#E45B00" variant="Bulk" size={20} />
            <span className="text-[1.5rem] leading-8 text-primary-500">
              {t("add_prize")}
            </span>
          </button>
        </div>

        {/* Trust / rules notes */}
        <div className={`${cardClass} !gap-4`}>
          <Note>{t("fairness_note")}</Note>
          <Note>{t("lock_note")}</Note>
          <Note>{t("age_note")}</Note>
        </div>

        <div className="max-w-216 w-full mx-auto">
          <ButtonPrimary
            type="submit"
            className="w-full"
            disabled={
              submitting ||
              titleStatus === "checking" ||
              titleStatus === "taken"
            }
          >
            {submitting ? <LoadingCircleSmall /> : tr("save")}
          </ButtonPrimary>
        </div>
      </form>
    </div>
  );
}
