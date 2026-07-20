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
import { InfoCircle, Trash, Warning2 } from "iconsax-reactjs";
import { useRouter } from "@/i18n/navigation";
import { UpdateRestaurant } from "@/actions/EventActions";
import { Restaurant } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import RichTextEditor from "@/components/shared/RichTextEditor";
import ToggleIcon from "@/components/shared/ToggleIcon";
import UploadDocument from "@/assets/icons/document-upload.svg";
import LocationPicker from "@/lib/LocationPicker";
import { compressImage, compressImages } from "@/lib/compressImage";
import { slugify } from "@/lib/Slugify";

const inputClass =
  "bg-neutral-100 w-full rounded-[1.5rem] p-6 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";
const cardClass =
  "max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100";
const sectionTitle = "font-semibold text-[1.6rem] leading-8 text-deep-100";

const ESTABLISHMENT_TYPES = [
  "restaurant",
  "bar",
  "cafe",
  "lounge",
  "club",
  "bakery",
  "food_truck",
] as const;

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MIN_GALLERY = 3;
const MAX_GALLERY = 5;

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

interface DayHours {
  enabled: boolean;
  opensAt: string;
  closesAt: string;
}

function makeRestaurantSchema(t: TranslateFn) {
  return z
    .object({
      name: z.string().min(2, t("errors.name")),
      description: z.string().min(20, t("errors.description")),
      establishmentType: z.enum(ESTABLISHMENT_TYPES),
      address: z.string().min(1, t("errors.address")),
      city: z.string().min(1, t("errors.city")),
      state: z.string().min(1, t("errors.state")),
      country: z.string().min(1, t("errors.country")),
      locationNotes: z.string().optional(),
      location: z.object({ lat: z.number(), lng: z.number() }).optional(),
      phone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional(),
      acceptsReservations: z.boolean(),
      reservationFee: z.coerce.number().min(0),
      reservationFeeCurrency: z.enum(["HTG", "USD"]),
      maxCoversPerSlot: z.coerce.number().min(0),
      minPartySize: z.coerce.number().min(1),
      maxPartySize: z.coerce.number().min(1),
      acceptsOnlinePayment: z.boolean(),
      offersDelivery: z.boolean(),
      offersTakeout: z.boolean(),
      deliveryPhone: z.string().optional(),
      deliveryFee: z.coerce.number().optional(),
      minimumOrder: z.coerce.number().optional(),
      deliveryEstimatedMinutes: z.coerce.number().optional(),
    })
    .refine((d) => !d.acceptsReservations || d.reservationFee > 0, {
      message: t("errors.fee"),
      path: ["reservationFee"],
    })
    .refine((d) => !d.acceptsReservations || d.maxCoversPerSlot > 0, {
      message: t("errors.covers"),
      path: ["maxCoversPerSlot"],
    })
    .refine((d) => d.minPartySize <= d.maxPartySize, {
      message: t("errors.party"),
      path: ["maxPartySize"],
    });
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[1.4rem] font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {error && <span className="text-[1.2rem] text-failure">{error}</span>}
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

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <p className="text-[1.5rem] leading-8 text-deep-100">{label}</p>
      <label
        className={`relative inline-block h-12 w-20 shrink-0 rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 ${
          disabled ? "opacity-50" : "cursor-pointer"
        }`}
      >
        <input
          className="peer sr-only"
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <ToggleIcon />
      </label>
    </div>
  );
}

/** 'HH:mm:ss' -> 'HH:mm' for <input type="time">. */
function toTimeInput(time: string) {
  return time.slice(0, 5);
}

export default function EditRestaurantForm({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const t = useTranslations("Events.create_event.restaurant");
  const td = useTranslations("Events.restaurantDetail");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const [submitting, setSubmitting] = useState(false);

  const schema = makeRestaurantSchema((k, values) => t(k, values));
  type TFormIn = z.input<typeof schema>;
  type TFormOut = z.output<typeof schema>;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<TFormIn, any, TFormOut>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: restaurant.name,
      description: restaurant.description,
      establishmentType: restaurant.establishmentType,
      address: restaurant.address,
      city: restaurant.city,
      state: restaurant.state,
      country: restaurant.country,
      locationNotes: restaurant.locationNotes ?? "",
      location: restaurant.location ?? undefined,
      phone: restaurant.phone ?? "",
      whatsapp: restaurant.whatsapp ?? "",
      email: restaurant.email ?? "",
      website: restaurant.website ?? "",
      acceptsReservations: restaurant.acceptsReservations,
      reservationFee: restaurant.reservationFee,
      reservationFeeCurrency: restaurant.reservationFeeCurrency as
        | "HTG"
        | "USD",
      maxCoversPerSlot: restaurant.maxCoversPerSlot,
      minPartySize: restaurant.minPartySize,
      maxPartySize: restaurant.maxPartySize,
      acceptsOnlinePayment: restaurant.acceptsOnlinePayment,
      offersDelivery: restaurant.offersDelivery,
      offersTakeout: restaurant.offersTakeout,
      deliveryPhone: restaurant.deliveryPhone ?? "",
      deliveryFee: restaurant.deliveryFee ?? undefined,
      minimumOrder: restaurant.minimumOrder ?? undefined,
      deliveryEstimatedMinutes: restaurant.deliveryEstimatedMinutes ?? undefined,
    },
  });

  const acceptsReservations = watch("acceptsReservations");
  const offersDelivery = watch("offersDelivery");

  // ── Cuisine tags ─────────────────────────────────────────────────────
  const [cuisines, setCuisines] = useState<string[]>(
    restaurant.cuisineTypes ?? [],
  );
  const [cuisineInput, setCuisineInput] = useState("");
  const cuisineInputRef = useRef<HTMLInputElement>(null);

  function handleCuisineKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const value = cuisineInput.trim().replace(/^#/, "");
    if (!value || cuisines.includes(value)) {
      setCuisineInput("");
      return;
    }
    setCuisines([...cuisines, value]);
    setCuisineInput("");
  }

  // ── Delivery zones ────────────────────────────────────────────────────
  const [zones, setZones] = useState<string[]>(restaurant.deliveryZones ?? []);
  const [zoneInput, setZoneInput] = useState("");

  function handleZoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const value = zoneInput.trim();
    if (!value || zones.includes(value)) {
      setZoneInput("");
      return;
    }
    setZones([...zones, value]);
    setZoneInput("");
  }

  // ── Opening hours ─────────────────────────────────────────────────────
  const [alwaysOpen, setAlwaysOpen] = useState(restaurant.alwaysOpen);
  const [hours, setHours] = useState<Record<number, DayHours>>(() => {
    const existing = new Map(restaurant.hours?.map((h) => [h.dayOfWeek, h]));
    return Object.fromEntries(
      DAY_ORDER.map((d) => {
        const row = existing.get(d);
        // Absence of a row IS closed, so a missing day starts disabled with
        // sensible times rather than blank inputs.
        return [
          d,
          row
            ? {
                enabled: true,
                opensAt: toTimeInput(row.opensAt),
                closesAt: toTimeInput(row.closesAt),
              }
            : { enabled: false, opensAt: "11:00", closesAt: "23:00" },
        ];
      }),
    );
  });
  const [hoursError, setHoursError] = useState("");

  function updateDay(day: number, patch: Partial<DayHours>) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
    setHoursError("");
  }

  // ── Visibility (org-owned half) ───────────────────────────────────────
  const suspended = restaurant.suspendedAt !== null;
  const [isListed, setIsListed] = useState(restaurant.isListed);
  const [savingVisibility, setSavingVisibility] = useState(false);

  async function toggleListed(next: boolean) {
    setSavingVisibility(true);
    const previous = isListed;
    setIsListed(next);
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${restaurant.organisationId}/${restaurant.restaurantId}/visibility`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
            origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
          body: JSON.stringify({ isListed: next }),
        },
      );
      const response = await request.json().catch(() => null);
      if (response?.status !== "success") throw new Error("failed");
    } catch {
      setIsListed(previous);
      toast.error(t("no_org"));
    }
    setSavingVisibility(false);
  }

  // ── Cover ─────────────────────────────────────────────────────────────
  const [coverPreview, setCoverPreview] = useState<string | null>(
    restaurant.coverImageUrl,
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setCoverFile(compressed);
    setCoverPreview(URL.createObjectURL(compressed));
  }

  // ── Gallery ───────────────────────────────────────────────────────────
  // Sending images replaces the gallery wholesale, so partial edits are not
  // offered: either keep what is there, or pick a fresh 3-5.
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryError, setGalleryError] = useState("");
  const [compressing, setCompressing] = useState(false);

  async function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    e.target.value = "";
    const room = MAX_GALLERY - galleryFiles.length;
    if (room <= 0) return;
    setCompressing(true);
    const compressed = await compressImages(picked.slice(0, room));
    const next = [...galleryFiles, ...compressed];
    setGalleryFiles(next);
    setGalleryPreviews(next.map((f) => URL.createObjectURL(f)));
    setGalleryError("");
    setCompressing(false);
  }

  function removeGalleryImage(index: number) {
    const next = galleryFiles.filter((_, i) => i !== index);
    setGalleryFiles(next);
    setGalleryPreviews(next.map((f) => URL.createObjectURL(f)));
    setGalleryError("");
  }

  const onSubmit: SubmitHandler<TFormOut> = async (data) => {
    if (!organisation?.organisationId) {
      toast.error(t("no_org"));
      return;
    }
    // Replacing the gallery is all-or-nothing: a partial set would wipe the
    // rest, since the API swaps the whole collection.
    if (
      galleryFiles.length > 0 &&
      (galleryFiles.length < MIN_GALLERY || galleryFiles.length > MAX_GALLERY)
    ) {
      setGalleryError(t("errors.gallery"));
      return;
    }

    const openDays = DAY_ORDER.filter((d) => hours[d].enabled).map((d) => ({
      dayOfWeek: d,
      opensAt: hours[d].opensAt,
      closesAt: hours[d].closesAt,
    }));
    if (!alwaysOpen && openDays.length === 0) {
      setHoursError(t("errors.hours"));
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    if (coverFile) fd.append("cover", coverFile);
    for (const file of galleryFiles) fd.append("images", file);
    fd.append("name", data.name);
    fd.append("description", data.description);
    fd.append("establishmentType", data.establishmentType);
    fd.append("cuisineTypes", JSON.stringify(cuisines));
    fd.append("address", data.address);
    fd.append("city", data.city);
    fd.append("state", data.state);
    fd.append("country", data.country);
    if (data.locationNotes) fd.append("locationNotes", data.locationNotes);
    if (data.location) fd.append("location", JSON.stringify(data.location));
    // Keep the venue's existing zone — the person editing may not be in it.
    fd.append("timezone", restaurant.timezone);
    if (data.phone) fd.append("phone", data.phone);
    if (data.whatsapp) fd.append("whatsapp", data.whatsapp);
    if (data.email) fd.append("email", data.email);
    if (data.website) fd.append("website", data.website);

    fd.append("alwaysOpen", JSON.stringify(alwaysOpen));
    fd.append("hours", JSON.stringify(alwaysOpen ? [] : openDays));

    fd.append("acceptsReservations", JSON.stringify(data.acceptsReservations));
    if (data.acceptsReservations) {
      fd.append("reservationFee", String(data.reservationFee));
      fd.append("reservationFeeCurrency", data.reservationFeeCurrency);
      fd.append("maxCoversPerSlot", String(data.maxCoversPerSlot));
      fd.append("minPartySize", String(data.minPartySize));
      fd.append("maxPartySize", String(data.maxPartySize));
    }
    fd.append("acceptsOnlinePayment", JSON.stringify(data.acceptsOnlinePayment));
    fd.append("offersTakeout", JSON.stringify(data.offersTakeout));
    fd.append("offersDelivery", JSON.stringify(data.offersDelivery));
    if (data.offersDelivery) {
      if (data.deliveryPhone) fd.append("deliveryPhone", data.deliveryPhone);
      if (data.deliveryFee != null)
        fd.append("deliveryFee", String(data.deliveryFee));
      if (data.minimumOrder != null)
        fd.append("minimumOrder", String(data.minimumOrder));
      if (data.deliveryEstimatedMinutes != null) {
        fd.append(
          "deliveryEstimatedMinutes",
          String(data.deliveryEstimatedMinutes),
        );
      }
      fd.append("deliveryZones", JSON.stringify(zones));
    }

    const result = await UpdateRestaurant(
      organisation.organisationId,
      restaurant.restaurantId,
      session?.user.accessToken ?? "",
      fd,
      locale,
    );
    if (result.status === "success") {
      toast.success(td("save_success"));
      router.push(
        `/events/restaurant/${slugify(data.name, restaurant.restaurantId)}`,
      );
    } else {
      toast.error(result.error);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll pb-12">
      <BackButton text={t("back")} />

      <h1 className="max-w-216 w-full mx-auto font-primary font-medium text-[2.6rem] leading-12 text-black">
        {td("edit_title")}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-12"
        noValidate
      >
        {/* Visibility — saved immediately, separate from the form body, because
            it is a switch rather than an edit. Suspension is Ticketwaze-owned
            and cannot be cleared here. */}
        <div className={cardClass}>
          <span className={sectionTitle}>{td("status")}</span>
          {suspended && <Note>{td("suspended_hint")}</Note>}
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <p className="text-[1.5rem] leading-8 text-deep-100">
                {isListed ? td("visible") : td("hidden")}
              </p>
              <p className="text-[1.2rem] leading-7 text-neutral-600">
                {td("hide_hint")}
              </p>
            </div>
            <label
              className={`relative inline-block h-12 w-20 shrink-0 rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500 ${
                suspended || savingVisibility ? "opacity-50" : "cursor-pointer"
              }`}
            >
              <input
                className="peer sr-only"
                type="checkbox"
                checked={isListed}
                disabled={suspended || savingVisibility}
                onChange={(e) => toggleListed(e.target.checked)}
              />
              <ToggleIcon />
            </label>
          </div>
        </div>

        {/* Cover */}
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

        {/* Gallery */}
        <div className={cardClass}>
          <div className="flex items-center justify-between gap-4">
            <span className={sectionTitle}>{t("gallery")}</span>
            <span className="flex items-center gap-3 text-[1.2rem] text-neutral-600">
              {compressing && <LoadingCircleSmall />}
              {galleryFiles.length > 0
                ? t("gallery_count", { count: galleryFiles.length })
                : td("keep_images")}
            </span>
          </div>

          {galleryFiles.length === 0 &&
            restaurant.images &&
            restaurant.images.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {restaurant.images.map((image) => (
                  <img
                    key={image.imageId}
                    src={image.imageUrl}
                    alt={image.caption ?? restaurant.name}
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                ))}
              </div>
            )}

          {galleryPreviews.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`${index + 1}`}
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    aria-label={t("gallery_remove")}
                    className="absolute top-2 right-2 w-12 h-12 rounded-full bg-black/60 flex items-center justify-center cursor-pointer"
                  >
                    <Trash size="16" color="#ffffff" variant="Bulk" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {galleryFiles.length < MAX_GALLERY && (
            <div className="py-16 px-[1.4rem] rounded-[7px] border border-[#e5e5e5] border-dashed bg-[#FBFBFB] flex items-center justify-center relative">
              <div className="flex flex-col items-center gap-4">
                <Image
                  src={UploadDocument}
                  alt="upload"
                  width={24}
                  height={24}
                />
                <p className="text-[1.5rem] leading-6 text-neutral-500">
                  {td("replace_gallery")}{" "}
                  <span className="font-medium text-primary-500">
                    {t("browse")}
                  </span>
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGallery}
                  className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          )}
          {galleryError && (
            <span className="text-[1.2rem] text-failure">{galleryError}</span>
          )}
        </div>

        {/* Details */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("details")}</span>
          <Field label={t("name")} error={errors.name?.message}>
            <input
              {...register("name")}
              type="text"
              maxLength={120}
              className={inputClass}
            />
          </Field>
          <Field label={t("type")}>
            <Controller
              control={control}
              name="establishmentType"
              render={({ field }) => (
                <div className="flex flex-wrap gap-4">
                  {ESTABLISHMENT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => field.onChange(type)}
                      className={`px-8 py-3 rounded-[30px] text-[1.4rem] leading-8 font-medium transition-colors cursor-pointer ${
                        field.value === type
                          ? "bg-primary-500 text-white"
                          : "bg-neutral-100 text-neutral-600 hover:text-deep-100"
                      }`}
                    >
                      {t(`types.${type}`)}
                    </button>
                  ))}
                </div>
              )}
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

        {/* Cuisine */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("cuisine")}</span>
          <div
            className="flex flex-wrap gap-2 bg-neutral-100 w-full rounded-[5rem] p-8 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus-within:border-primary-500 cursor-text"
            onClick={() => cuisineInputRef.current?.focus()}
          >
            {cuisines.map((cuisine) => (
              <button
                type="button"
                key={cuisine}
                onClick={() =>
                  setCuisines(cuisines.filter((c) => c !== cuisine))
                }
                className="flex items-center gap-1 bg-primary-100/50 px-2 text-primary-500 rounded-full text-[1.4rem] whitespace-nowrap"
              >
                #{cuisine}
              </button>
            ))}
            <input
              ref={cuisineInputRef}
              value={cuisineInput}
              onChange={(e) => setCuisineInput(e.target.value)}
              onKeyDown={handleCuisineKeyDown}
              placeholder={t("cuisine_placeholder")}
              className="flex-1 outline-none min-w-48 bg-transparent placeholder:text-neutral-600"
            />
          </div>
        </div>

        {/* Location */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("location")}</span>
          <Field label={t("address")} error={errors.address?.message}>
            <input {...register("address")} type="text" className={inputClass} />
          </Field>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Field label={t("city")} error={errors.city?.message}>
                <input {...register("city")} type="text" className={inputClass} />
              </Field>
            </div>
            <div className="flex-1">
              <Field label={t("state")} error={errors.state?.message}>
                <input
                  {...register("state")}
                  type="text"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label={t("country")} error={errors.country?.message}>
                <input
                  {...register("country")}
                  type="text"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
          <Field label={t("location_notes")}>
            <input
              {...register("locationNotes")}
              type="text"
              placeholder={t("location_notes_placeholder")}
              className={inputClass}
            />
          </Field>
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

        {/* Contact */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("contact")}</span>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Field label={t("phone")}>
                <input
                  {...register("phone")}
                  type="tel"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label={t("whatsapp")}>
                <input
                  {...register("whatsapp")}
                  type="tel"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Field label={t("email")}>
                <input
                  {...register("email")}
                  type="email"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="flex-1">
              <Field label={t("website")}>
                <input
                  {...register("website")}
                  type="url"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Opening hours */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("hours")}</span>
          <Toggle
            label={t("always_open")}
            checked={alwaysOpen}
            onChange={(v) => {
              setAlwaysOpen(v);
              setHoursError("");
            }}
          />
          {alwaysOpen ? (
            <Note>{t("always_open_hint")}</Note>
          ) : (
            <>
              <p className="text-[1.2rem] leading-7 text-neutral-600">
                {t("hours_hint")}
              </p>
              <div className="flex flex-col gap-4">
                {DAY_ORDER.map((day) => {
                  const value = hours[day];
                  const overnight =
                    value.enabled && value.closesAt <= value.opensAt;
                  return (
                    <div
                      key={day}
                      className="flex flex-col gap-2 border-b border-neutral-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                        <label className="flex items-center gap-4 cursor-pointer">
                          <span className="relative inline-block h-12 w-20 shrink-0 rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
                            <input
                              className="peer sr-only"
                              type="checkbox"
                              checked={value.enabled}
                              onChange={(e) =>
                                updateDay(day, { enabled: e.target.checked })
                              }
                            />
                            <ToggleIcon />
                          </span>
                          <span className="text-[1.5rem] leading-8 text-deep-100 w-40">
                            {t(`days.${day}`)}
                          </span>
                        </label>
                        {value.enabled ? (
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[1.2rem] text-neutral-600">
                                {t("opens_at")}
                              </span>
                              <input
                                type="time"
                                value={value.opensAt}
                                onChange={(e) =>
                                  updateDay(day, { opensAt: e.target.value })
                                }
                                className="bg-neutral-100 rounded-[1.5rem] px-6 py-4 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[1.2rem] text-neutral-600">
                                {t("closes_at")}
                              </span>
                              <input
                                type="time"
                                value={value.closesAt}
                                onChange={(e) =>
                                  updateDay(day, { closesAt: e.target.value })
                                }
                                className="bg-neutral-100 rounded-[1.5rem] px-6 py-4 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[1.4rem] text-neutral-600">
                            {t("closed")}
                          </span>
                        )}
                      </div>
                      {overnight && (
                        <div className="flex items-center gap-2">
                          <Warning2 size="16" color="#737C8A" variant="Bulk" />
                          <span className="text-[1.2rem] text-neutral-600">
                            {t("overnight_note")}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {hoursError && (
                <span className="text-[1.2rem] text-failure">{hoursError}</span>
              )}
            </>
          )}
        </div>

        {/* Services */}
        <div className={cardClass}>
          <span className={sectionTitle}>{t("services")}</span>

          <Controller
            control={control}
            name="acceptsReservations"
            render={({ field }) => (
              <Toggle
                label={t("accepts_reservations")}
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {acceptsReservations && (
            <>
              <Note>{t("reservations_hint")}</Note>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <Field
                    label={t("reservation_fee")}
                    error={errors.reservationFee?.message}
                  >
                    <input
                      {...register("reservationFee")}
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
                      name="reservationFeeCurrency"
                      render={({ field }) => (
                        <div className="flex gap-4">
                          {(["HTG", "USD"] as const).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => field.onChange(c)}
                              className={`px-8 py-3 rounded-[30px] text-[1.4rem] leading-8 font-medium transition-colors cursor-pointer ${
                                field.value === c
                                  ? "bg-primary-500 text-white"
                                  : "bg-neutral-100 text-neutral-600 hover:text-deep-100"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </Field>
                </div>
              </div>
              <Field
                label={t("covers_per_slot")}
                error={errors.maxCoversPerSlot?.message}
              >
                <input
                  {...register("maxCoversPerSlot")}
                  type="number"
                  min={0}
                  step="1"
                  className={inputClass}
                />
              </Field>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <Field label={`${t("party_size")} - ${t("min_party")}`}>
                    <input
                      {...register("minPartySize")}
                      type="number"
                      min={1}
                      step="1"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field
                    label={`${t("party_size")} - ${t("max_party")}`}
                    error={errors.maxPartySize?.message}
                  >
                    <input
                      {...register("maxPartySize")}
                      type="number"
                      min={1}
                      step="1"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </>
          )}

          <Controller
            control={control}
            name="acceptsOnlinePayment"
            render={({ field }) => (
              <Toggle
                label={t("accepts_online_payment")}
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="offersTakeout"
            render={({ field }) => (
              <Toggle
                label={t("offers_takeout")}
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="offersDelivery"
            render={({ field }) => (
              <Toggle
                label={t("offers_delivery")}
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {offersDelivery && (
            <>
              <Note>{t("delivery_hint")}</Note>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <Field label={t("delivery_phone")}>
                    <input
                      {...register("deliveryPhone")}
                      type="tel"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label={t("delivery_time")}>
                    <input
                      {...register("deliveryEstimatedMinutes")}
                      type="number"
                      min={0}
                      step="5"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <Field label={t("delivery_fee")}>
                    <input
                      {...register("deliveryFee")}
                      type="number"
                      min={0}
                      step="1"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label={t("minimum_order")}>
                    <input
                      {...register("minimumOrder")}
                      type="number"
                      min={0}
                      step="1"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
              <Field label={t("delivery_zones")}>
                <div className="flex flex-wrap gap-2 bg-neutral-100 w-full rounded-[5rem] p-8 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus-within:border-primary-500 cursor-text">
                  {zones.map((zone) => (
                    <button
                      type="button"
                      key={zone}
                      onClick={() => setZones(zones.filter((z) => z !== zone))}
                      className="flex items-center gap-1 bg-primary-100/50 px-2 text-primary-500 rounded-full text-[1.4rem] whitespace-nowrap"
                    >
                      {zone}
                    </button>
                  ))}
                  <input
                    value={zoneInput}
                    onChange={(e) => setZoneInput(e.target.value)}
                    onKeyDown={handleZoneKeyDown}
                    placeholder={t("delivery_zones_placeholder")}
                    className="flex-1 outline-none min-w-48 bg-transparent placeholder:text-neutral-600"
                  />
                </div>
              </Field>
            </>
          )}
        </div>

        <div className="max-w-216 w-full mx-auto flex flex-col gap-6">
          <ButtonPrimary type="submit" disabled={submitting}>
            {submitting ? <LoadingCircleSmall /> : td("save")}
          </ButtonPrimary>
        </div>
      </form>
    </div>
  );
}
