/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { InfoCircle, Warning2 } from "iconsax-reactjs";
import { getSaleMinPrice } from "@ticketwaze/pricing";
import { useRouter } from "@/i18n/navigation";
import { CreateSale } from "@/actions/SaleActions";
import BackButton from "@/components/shared/BackButton";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import RichTextEditor from "@/components/shared/RichTextEditor";
import UploadDocument from "@/assets/icons/document-upload.svg";
import { compressImage } from "@/lib/compressImage";
import { MAX_UPLOAD_BYTES, formDataSize } from "@/lib/uploadLimit";
import SalePricePreview from "@/components/shared/SalePricePreview";
import CharCounter from "@/components/shared/CharCounter";
import useSaleTitleAvailability from "@/hooks/useSaleTitleAvailability";
import SaleFilePicker from "@/components/shared/SaleFilePicker";
import { uploadSaleFile } from "@/lib/uploadSaleFile";

// The counter has to promise the limit the input enforces, so `maxLength` and
// the counter's denominator read from one constant. Both mirror the API's
// validator (`title: minLength(10).maxLength(120)`).
const TITLE_MIN_CHARS = 10;
const TITLE_MAX_CHARS = 120;

const inputClass =
  "bg-neutral-100 w-full rounded-[1.5rem] p-6 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";
const cardClass =
  "max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100";
const sectionTitle = "font-semibold text-[1.6rem] leading-8 text-deep-100";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function makeSaleSchema(t: TranslateFn) {
  return z
    .object({
      title: z.string().min(TITLE_MIN_CHARS, t("errors.title")),
      description: z.string().min(20, t("errors.description")),
      price: z.coerce.number().gt(0, t("errors.price")),
      currency: z.enum(["HTG", "USD"]),
      activityTags: z.array(z.string()),
    })
    // The floor is currency-dependent — below it the surcharge would dwarf the
    // product — so it is checked here rather than as a fixed `min` on the field.
    .refine((d) => d.price >= getSaleMinPrice(d.currency), {
      message: t("errors.min_price"),
      path: ["price"],
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

export default function CreateSaleForm() {
  const t = useTranslations("Events.create_event.sale");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const [submitting, setSubmitting] = useState(false);
  // Two phases with very different failure modes: the row is created in one
  // request, the file lands in three. The progress bar only means the second.
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const schema = makeSaleSchema((k, values) => t(k, values));
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
      title: "",
      description: "",
      price: undefined as unknown as number,
      currency: "HTG",
      activityTags: [],
    },
  });

  // Free-form tags, same UX as the event and raffle forms.
  const [tags, setTags] = useState<string[]>([]);
  // Checked live per keystroke. The API re-checks on submit against the
  // unique index, so this only decides whether the button is usable — it is
  // never what makes the title valid.
  const titleStatus = useSaleTitleAvailability(watch("title"));

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

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState("");

  // The product itself. It never touches the form body — see uploadSaleFile.
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productError, setProductError] = useState("");

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // The cover DOES travel through the server action, so it is downscaled
    // first; a phone photo exceeds the body limit on its own.
    const compressed = await compressImage(file);
    setCoverFile(compressed);
    setCoverPreview(URL.createObjectURL(compressed));
    setCoverError("");
  }

  const onSubmit: SubmitHandler<TFormOut> = async (data) => {
    if (!coverFile) {
      setCoverError(t("errors.cover"));
      return;
    }
    if (!productFile) {
      setProductError(t("errors.file"));
      return;
    }
    if (!organisation?.organisationId) {
      toast.error(t("no_org"));
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("cover", coverFile);
    fd.append("title", data.title);
    fd.append("description", data.description);
    fd.append("price", String(data.price));
    fd.append("currency", data.currency);
    fd.append("activityTags", JSON.stringify(data.activityTags));

    // Only the cover rides in this body — the product goes straight to S3 — but
    // an image that failed to compress (an undecodable format such as HEIC
    // passes through untouched) would still get the action rejected outright,
    // with no error branch to land in.
    if (formDataSize(fd) > MAX_UPLOAD_BYTES) {
      toast.error(t("errors.too_large"));
      setSubmitting(false);
      return;
    }

    try {
      const created = await CreateSale(
        organisation.organisationId,
        session?.user.accessToken ?? "",
        fd,
        locale,
      );
      if (created.status !== "success") {
        toast.error(created.error);
        setSubmitting(false);
        return;
      }

      // The row exists as a draft from here on. If the upload fails the seller
      // is sent to the product anyway rather than losing everything they typed:
      // the file can be attached again from its own page.
      setUploadPercent(0);
      const uploaded = await uploadSaleFile({
        organisationId: organisation.organisationId,
        saleId: created.sale.saleId,
        accessToken: session?.user.accessToken ?? "",
        locale,
        file: productFile,
        onProgress: setUploadPercent,
      });

      if (uploaded.status !== "success") {
        toast.error(uploaded.message);
        router.push("/events");
        return;
      }

      toast.success(t("success"));
      router.push("/events");
    } catch (error) {
      // A server action can reject rather than return — an oversized body, a
      // gateway timeout, or a stale action id after a redeploy never reach the
      // branches above. Without this the button spins forever with no message.
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("errors.submit_failed"),
      );
    } finally {
      setSubmitting(false);
      setUploadPercent(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll pb-12">
      <BackButton text={t("back")} />

      <h1 className="max-w-216 w-full mx-auto font-primary font-medium text-[2.6rem] leading-12 text-black">
        {t("title_heading")}
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
          {coverError && (
            <span className="text-[1.2rem] text-failure">{coverError}</span>
          )}
        </div>

        {/* Details */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("details")}</span>
          <Field
            label={t("name")}
            error={
              errors.title?.message ??
              (titleStatus === "taken" ? t("errors.title_taken") : undefined)
            }
            counter={
              <CharCounter
                count={(watch("title") ?? "").length}
                min={TITLE_MIN_CHARS}
                max={TITLE_MAX_CHARS}
              />
            }
          >
            <input
              {...register("title")}
              type="text"
              maxLength={TITLE_MAX_CHARS}
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

        {/* The product file */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("file")}</span>
          <SaleFilePicker
            file={productFile}
            onSelect={(file) => {
              setProductFile(file);
              setProductError("");
            }}
            onClear={() => setProductFile(null)}
            error={productError}
            uploadPercent={uploadPercent}
          />
          <p className="text-[1.2rem] leading-7 text-neutral-600">
            {t("file_tip")}
          </p>
        </div>

        {/* Pricing */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("pricing")}</span>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Field label={t("price")} error={errors.price?.message}>
                <input
                  {...register("price")}
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

          <SalePricePreview
            price={watch("price")}
            currency={watch("currency")}
          />
        </div>

        {/* What happens next */}
        <div className={`${cardClass} !gap-4`}>
          <Note>{t("review_note")}</Note>
          <Note>{t("final_note")}</Note>
          <Note>{t("delivery_note")}</Note>
        </div>

        <div className="max-w-216 w-full mx-auto">
          <ButtonPrimary type="submit" className="w-full" disabled={
              submitting ||
              titleStatus === "checking" ||
              titleStatus === "taken"
            }>
            {submitting ? <LoadingCircleSmall /> : t("submit")}
          </ButtonPrimary>
        </div>
      </form>
    </div>
  );
}
