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
import { Sale } from "@ticketwaze/typescript-config";
import { useRouter } from "@/i18n/navigation";
import { UpdateSale } from "@/actions/SaleActions";
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
import SaleFileManager from "../components/SaleFileManager";
import { slugify } from "@/lib/Slugify";

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

/**
 * Edits everything about a product except the product.
 *
 * Replacing the file lives on the detail page, not here, because it means
 * something different: metadata edits are applied straight away, a new file
 * sends the listing back through review.
 */
export default function EditSaleForm({ sale }: { sale: Sale }) {
  const t = useTranslations("Events.create_event.sale");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);

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
      title: sale.title,
      description: sale.description,
      // The row stores both currencies; the product is denominated in one.
      price: sale.currencyCode === "USD" ? sale.usdPrice : sale.price,
      currency: (sale.currencyCode === "USD" ? "USD" : "HTG") as "HTG" | "USD",
      activityTags: sale.activityTags ?? [],
    },
  });

  const [tags, setTags] = useState<string[]>(sale.activityTags ?? []);
  // Checked live per keystroke. The API re-checks on submit against the
  // unique index, so this only decides whether the button is usable — it is
  // never what makes the title valid.
  const titleStatus = useSaleTitleAvailability(watch("title"), sale.saleId);

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

  // Null means "keep the one already on the row" — the cover is only sent when
  // the seller actually picked a new one.
  const [coverPreview, setCoverPreview] = useState<string | null>(
    sale.coverImageUrl,
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setCoverFile(compressed);
    setCoverPreview(URL.createObjectURL(compressed));
  }

  const onSubmit: SubmitHandler<TFormOut> = async (data) => {
    setSubmitting(true);
    const fd = new FormData();
    if (coverFile) fd.append("cover", coverFile);
    fd.append("title", data.title);
    fd.append("description", data.description);
    fd.append("price", String(data.price));
    fd.append("currency", data.currency);
    fd.append("activityTags", JSON.stringify(data.activityTags));

    if (formDataSize(fd) > MAX_UPLOAD_BYTES) {
      toast.error(t("errors.too_large"));
      setSubmitting(false);
      return;
    }

    try {
      const result = await UpdateSale(
        sale.organisationId,
        sale.saleId,
        session?.user.accessToken ?? "",
        fd,
        locale,
      );
      if (result.status === "success") {
        toast.success(t("update_success"));
        // The slug tracks the title until the product sells, so navigate with
        // whatever came back rather than the slug this page was opened on.
        router.push(
          `/events/sale/${slugify(result.sale.title, result.sale.saleId)}`,
        );
      } else {
        toast.error(result.error);
      }
    } catch (error) {
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
        {t("edit_heading")}
      </h1>

      {/*
        THE FILE, ABOVE THE FORM AND OUTSIDE IT.

        Outside because it does not belong to Save: picking a file uploads it
        immediately on its own button, sends the product back through review,
        and the metadata below is still unsaved at that point. Putting it inside
        the form would promise they travel together, which they do not.

        Above because it is the product. Until now the file could only be
        replaced from the detail page, so "edit" meant everything about the
        product except the thing being sold.
      */}
      <div className={`${cardClass} !gap-6`}>
        <span className={sectionTitle}>{t("file_section")}</span>
        <SaleFileManager sale={sale} />
        {(sale.files?.length ?? 0) > 1 && (
          <p className="text-[1.2rem] leading-7 text-neutral-600">
            {t("file_versions_note", { count: sale.files?.length ?? 0 })}
          </p>
        )}
        <Note>{t("file_immediate_note")}</Note>
      </div>

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
          {/* The API refuses a currency change once the product has sold —
              switching it would re-denominate revenue and contradict receipts
              buyers already hold. */}
          <p className="text-[1.2rem] leading-7 text-neutral-600">
            {t("currency_lock_tip")}
          </p>
        </div>

        <div className={`${cardClass} !gap-4`}>
          <Note>{t("edit_metadata_note")}</Note>
        </div>

        <div className="max-w-216 w-full mx-auto">
          <ButtonPrimary type="submit" className="w-full" disabled={
              submitting ||
              titleStatus === "checking" ||
              titleStatus === "taken"
            }>
            {submitting ? <LoadingCircleSmall /> : t("save")}
          </ButtonPrimary>
        </div>
      </form>
    </div>
  );
}
