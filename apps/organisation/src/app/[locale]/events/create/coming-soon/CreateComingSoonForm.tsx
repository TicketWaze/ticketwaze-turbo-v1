/* eslint-disable @next/next/no-img-element */
"use client";
import { openPicker } from "@/components/create/FormFields";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { InfoCircle } from "iconsax-reactjs";
import {
  CreateFooter,
  CreateHeader,
  CreatedScreen,
} from "@/components/create/CreateParts";
import { Reveal } from "@/components/shared/motion";
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

  const tCreated = useTranslations("Events.create_event.created");
  const [name, setName] = useState(event?.eventName ?? "");
  const [description, setDescription] = useState(event?.eventDescription ?? "");
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
  // Creating ends on the shared "created" screen while the list opens.
  const [created, setCreated] = useState(false);
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
      ? await UpdateComingSoonEvent(organisationId, event!.eventId, fd, locale)
      : await CreateComingSoonEvent(organisationId, fd, locale);

    if (result.status === "success") {
      if (isEdit) toast.success(t("updated"));
      else setCreated(true);
      // Editing is reached from the teaser's own page, so it returns there;
      // creating has no page to return to yet and goes to the list. The slug is
      // rebuilt from the name just submitted, not the one this form opened
      // with, or a rename would land on a stale URL.
      const target = isEdit
        ? `/events/coming-soon/${slugify(name.trim(), event!.eventId)}`
        : "/events";
      if (isEdit) router.push(target);
      else setTimeout(() => router.push(target), 1800);
      return;
    }

    toast.error(result.error ?? t("errors.generic"));
    setBusy(false);
  }

  if (created) {
    return (
      <CreatedScreen
        title={tCreated("coming_soon")}
        description={tCreated("description_activity")}
        pendingLabel={tCreated("opening_list")}
      />
    );
  }

  return (
    <div className="relative flex flex-col gap-10 h-full overflow-clip">
      <CreateHeader
        title={isEdit ? t("edit_title") : t("title")}
        onBack={() => router.back()}
        backLabel={t("back")}
      />
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-8 pb-28 lg:pb-8">
        {/* The name is the one irreversible choice here, so it is called out
          rather than buried in a tooltip. */}
        <Reveal
          delay={0.05}
          className="max-w-216 w-full mx-auto flex items-start gap-4 p-6 rounded-[15px] bg-neutral-100"
        >
          <InfoCircle
            size="24"
            color="#737C8A"
            variant="Bulk"
            className="shrink-0"
          />
          <p className="text-[1.4rem] leading-7 text-neutral-700">
            {t("explainer")}
          </p>
        </Reveal>

        {/* Same centred column the in-person create form uses. */}
        <Reveal
          delay={0.12}
          className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100"
        >
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
                onClick={(e) => openPicker(e.currentTarget)}
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
        </Reveal>

        <p className="max-w-216 w-full mx-auto text-[1.2rem] leading-7 text-neutral-600 text-center">
          {t("review_notice")}
        </p>
      </div>

      <CreateFooter
        step={0}
        total={1}
        onContinue={submit}
        continueLabel={isEdit ? t("save") : t("submit")}
        loading={busy}
      />
    </div>
  );
}
