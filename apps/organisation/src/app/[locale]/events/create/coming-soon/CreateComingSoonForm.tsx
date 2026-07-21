/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { InfoCircle } from "iconsax-reactjs";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { compressImage } from "@/lib/compressImage";
import { slugify } from "@/lib/Slugify";
import {
  CreateComingSoonEvent,
  UpdateComingSoonEvent,
} from "@/actions/EventActions";
import { Event } from "@ticketwaze/typescript-config";

const inputClass =
  "bg-neutral-100 w-full rounded-[1.5rem] p-6 text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";

// Matches what a real event requires. A teaser becomes that event on the same
// row, so writing to the lower bar only meant rewriting the description at
// publish time.
const MIN_DESCRIPTION = 150;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[1.4rem] font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {hint && (
        <span className="text-[1.2rem] leading-7 text-neutral-600">{hint}</span>
      )}
    </div>
  );
}

/**
 * Doubles as the edit form. A teaser has so few fields that a second component
 * would be the same markup with different labels.
 */
export default function CreateComingSoonForm({
  organisationId,
  event,
}: {
  organisationId: string;
  event?: Event;
}) {
  const isEdit = Boolean(event);
  const t = useTranslations("Events.coming_soon");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const [name, setName] = useState(event?.eventName ?? "");
  const [description, setDescription] = useState(
    event?.eventDescription ?? "",
  );
  const [address, setAddress] = useState(event?.address ?? "");
  const [hint, setHint] = useState(event?.comingSoonHint ?? "");
  // "YYYY-MM-DD", the exact shape <input type="date"> expects, so it round-trips
  // untouched.
  const [when, setWhen] = useState(event?.comingSoonDate ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    event?.eventImageUrl ?? null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Same reason as every other upload here: a phone photo exceeds the server
    // action body limit on its own.
    const compressed = await compressImage(file);
    setImage(compressed);
    setPreview(URL.createObjectURL(compressed));
  }

  async function submit() {
    if (name.trim().length < 3) return setError(t("errors.name"));
    if (description.trim().length < MIN_DESCRIPTION) {
      return setError(t("errors.description", { min: MIN_DESCRIPTION }));
    }
    if (!image && !isEdit) return setError(t("errors.image"));
    setError("");

    setBusy(true);
    const fd = new FormData();
    fd.append("eventName", name.trim());
    fd.append("eventDescription", description.trim());
    if (address.trim()) fd.append("address", address.trim());
    if (hint.trim()) fd.append("comingSoonHint", hint.trim());
    if (when) fd.append("comingSoonDate", when);
    fd.append("activityTags", JSON.stringify([]));
    if (image) fd.append("eventImage", image);

    const result = isEdit
      ? await UpdateComingSoonEvent(
          organisationId,
          event!.eventId,
          session?.user.accessToken ?? "",
          fd,
          locale,
        )
      : await CreateComingSoonEvent(
          organisationId,
          session?.user.accessToken ?? "",
          fd,
          locale,
        );

    if (result.status === "success") {
      toast.success(isEdit ? t("updated") : t("created"));
      // Editing is reached from the teaser's own page, so it returns there;
      // creating has no page to return to yet and goes to the list. The slug is
      // rebuilt from the name just submitted, not the one this form opened
      // with, or a rename would land on a stale URL.
      router.push(
        isEdit
          ? `/events/coming-soon/${slugify(name.trim(), event!.eventId)}`
          : "/events",
      );
      return;
    }

    toast.error(result.error ?? t("errors.generic"));
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll pb-12">
      <BackButton text={t("back")} />
      <TopBar title={isEdit ? t("edit_title") : t("title")} />

      {/* The name is the one irreversible choice here, so it is called out
          rather than buried in a tooltip. */}
      <div className="max-w-216 w-full mx-auto flex items-start gap-4 p-6 rounded-[15px] bg-neutral-100">
        <InfoCircle
          size="24"
          color="#737C8A"
          variant="Bulk"
          className="shrink-0"
        />
        <p className="text-[1.4rem] leading-7 text-neutral-700">
          {t("explainer")}
        </p>
      </div>

      {/* Same centred column the in-person create form uses. */}
      <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
        <Field label={t("name")} hint={t("name_hint")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder={t("name_placeholder")}
          />
        </Field>

        <Field
          label={t("description")}
          hint={t("description_hint", { min: MIN_DESCRIPTION })}
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className={`${inputClass} resize-y`}
            placeholder={t("description_placeholder")}
          />
        </Field>

        {/* Both optional, and they answer the same question at different
            confidence levels: a real date if you have one, a vague hint if you
            do not. The date wins wherever the teaser is displayed. */}
        <Field label={t("date_label")} hint={t("date_hint")}>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className={inputClass}
            />
            {when && (
              <button
                type="button"
                onClick={() => setWhen("")}
                className="shrink-0 text-[1.3rem] text-neutral-600 underline cursor-pointer"
              >
                {t("clear_date")}
              </button>
            )}
          </div>
        </Field>

        <Field label={t("hint_label")} hint={t("hint_hint")}>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            className={inputClass}
            placeholder={t("hint_placeholder")}
            disabled={Boolean(when)}
          />
        </Field>

        <Field label={t("location")} hint={t("location_hint")}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
            placeholder={t("location_placeholder")}
          />
        </Field>

        <Field label={t("image")}>
          {preview ? (
            <div className="relative w-full h-64">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-2xl"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
              />
            </div>
          ) : (
            <div className="py-16 rounded-[7px] border border-[#e5e5e5] border-dashed bg-[#FBFBFB] flex items-center justify-center relative">
              <span className="text-[1.4rem] text-neutral-500">
                {t("add_image")}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
              />
            </div>
          )}
        </Field>

        {error && <span className="text-[1.2rem] text-failure">{error}</span>}
      </div>

      <div className="max-w-216 w-full mx-auto flex flex-col gap-4">
        <ButtonPrimary className="w-full" disabled={busy} onClick={submit}>
          {busy ? <LoadingCircleSmall /> : isEdit ? t("save") : t("submit")}
        </ButtonPrimary>

        <p className="text-[1.2rem] leading-7 text-neutral-600 text-center">
          {t("review_notice")}
        </p>
      </div>
    </div>
  );
}
