"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Gallery } from "iconsax-reactjs";
import { Input, TextArea } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import countries from "@/lib/Countries";
import { cn } from "@/lib/utils";

export type OrganisationFields = {
  organisationName: string;
  address: string;
  country: string;
  state: string;
  city: string;
  organisationDescription: string;
  organisationPhoneNumber: string;
  organisationWebsite: string;
};

const selectClass =
  "bg-neutral-100 cursor-pointer rounded-[5rem] !h-[6rem] px-8 border-none w-full min-w-0 text-[1.5rem] text-deep-200 shadow-none data-[disabled]:cursor-default data-[disabled]:opacity-100 data-[disabled]:text-neutral-700";

const sectionTitle = "text-deep-100 font-primary font-medium text-[1.8rem] leading-10";

/**
 * The orange identity card: logo, name, and "Change logo"
 * (organisations.edit), which uploads straight away rather than waiting for
 * Save — a picture is its own change.
 */
export function LogoCard({
  organisationId,
  name,
  isVerified,
  imageUrl,
  canEdit,
}: {
  organisationId: string;
  name: string;
  isVerified: boolean;
  imageUrl: string | null;
  canEdit: boolean;
}) {
  const t = useTranslations("Organisations.profile");
  const { data: session } = useSession();
  const input = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(imageUrl);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("image.too_big"));
      return;
    }
    setUploading(true);
    const body = new FormData();
    body.append("user-profile", file);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/organisations/${organisationId}/image`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.user.accessToken}` },
        body,
      },
    ).catch(() => null);
    const data = await response?.json().catch(() => null);
    setUploading(false);
    if (data?.status === "success") {
      setImage(data.profileImageUrl);
      toast.success(t("image.done"));
    } else {
      toast.error(t("image.failed"));
    }
  }

  return (
    <div className="w-full min-w-0 bg-primary-500 p-6 rounded-[20px] flex items-center gap-8">
      <div className="w-40 h-40 shrink-0 rounded-[2rem] bg-primary-300 overflow-hidden">
        {image && (
          <Image
            src={image}
            alt={name}
            width={160}
            height={160}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col gap-4 min-w-0">
        <span className="inline-flex items-center gap-2 text-[2.4rem] text-white font-medium leading-10 break-words">
          {name}
          {isVerified && <VerifiedOrganisationCheckMark />}
        </span>
        {canEdit && (
          <>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={uploading}
              className="self-start inline-flex items-center gap-3 bg-black text-white rounded-[10rem] px-6 py-3 text-[1.3rem] font-medium cursor-pointer hover:bg-neutral-900 disabled:opacity-70"
            >
              {uploading ? (
                <LoadingCircleSmall />
              ) : (
                <>
                  <Gallery size="16" variant="Bulk" color="#FFFFFF" />
                  {t("change_logo")}
                </>
              )}
            </button>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void upload(file);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Figma "Organization Profile": read-only until "Edit profile". Location in
 * the platform order Address → Country → State → City. The contact email is
 * the owner's login email and never editable.
 */
export function OrganisationProfile({
  email,
  value,
  onChange,
  editing,
  errors,
}: {
  email: string;
  value: OrganisationFields;
  onChange: (next: OrganisationFields) => void;
  editing: boolean;
  errors: Partial<Record<keyof OrganisationFields, string>>;
}) {
  const t = useTranslations("Organisations.profile");
  const set = (field: keyof OrganisationFields) => (v: string) =>
    onChange({ ...value, [field]: v });
  const off = !editing;

  const states = countries.find((c) => c.name === value.country)?.state ?? [];
  const cities = states.find((s) => s.name === value.state)?.cities ?? [];
  // Keep a stored value selectable even when it is not in the lists.
  const withCurrent = (list: string[], current: string) =>
    current && !list.includes(current) ? [current, ...list] : list;

  return (
    <div className="flex flex-col gap-6">
      <h3 className={sectionTitle}>{t("profile")}</h3>
      {editing && (
        <Input
          value={value.organisationName}
          onChange={(e) => set("organisationName")(e.target.value)}
          error={errors.organisationName}
          maxLength={30}
        >
          {t("fields.name")}
        </Input>
      )}
      <Input value={value.address} onChange={(e) => set("address")(e.target.value)} disabled={off}>
        {t("fields.address")}
      </Input>
      <Select
        value={value.country || undefined}
        onValueChange={(country) => onChange({ ...value, country, state: "", city: "" })}
        disabled={off}
      >
        <SelectTrigger aria-label={t("fields.country")} className={selectClass}>
          <SelectValue placeholder={t("fields.country")} />
        </SelectTrigger>
        <SelectContent className="max-h-[30rem]">
          <SelectGroup>
            {withCurrent(countries.map((c) => c.name), value.country).map((name) => (
              <SelectItem key={name} value={name} className="text-[1.4rem]">
                {name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex flex-col sm:flex-row gap-6">
        <Select
          value={value.state || undefined}
          onValueChange={(state) => onChange({ ...value, state, city: "" })}
          disabled={off}
        >
          <SelectTrigger aria-label={t("fields.state")} className={cn(selectClass, "flex-1")}>
            <SelectValue placeholder={t("fields.state")} />
          </SelectTrigger>
          <SelectContent className="max-h-[30rem]">
            {withCurrent(states.map((s) => s.name), value.state).map((name) => (
              <SelectItem key={name} value={name} className="text-[1.4rem]">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={value.city || undefined} onValueChange={set("city")} disabled={off}>
          <SelectTrigger aria-label={t("fields.city")} className={cn(selectClass, "flex-1")}>
            <SelectValue placeholder={t("fields.city")} />
          </SelectTrigger>
          <SelectContent className="max-h-[30rem]">
            {withCurrent(cities, value.city).map((name) => (
              <SelectItem key={name} value={name} className="text-[1.4rem]">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <TextArea
          aria-label={t("fields.about")}
          className="w-full"
          value={value.organisationDescription}
          onChange={(e) => set("organisationDescription")(e.target.value)}
          disabled={off}
          maxLength={350}
        >
          {t("fields.about")}
        </TextArea>
        {editing && (
          <span
            className={cn(
              "text-[1.2rem] px-8",
              errors.organisationDescription ? "text-failure" : "text-neutral-500",
            )}
          >
            {errors.organisationDescription ?? `${value.organisationDescription.length}/350`}
          </span>
        )}
      </div>
      <Input type="email" value={email} disabled readOnly>
        {t("fields.email")}
      </Input>
      <Input
        type="tel"
        value={value.organisationPhoneNumber}
        onChange={(e) => set("organisationPhoneNumber")(e.target.value)}
        disabled={off}
      >
        {t("fields.phone")}
      </Input>
      <Input
        type="url"
        value={value.organisationWebsite}
        onChange={(e) => set("organisationWebsite")(e.target.value)}
        disabled={off}
      >
        {t("fields.website")}
      </Input>
    </div>
  );
}

/** Figma "Organizer Information": the owner's account, always read-only. */
export function OrganizerInformation({
  email,
  phone,
  appLanguage,
}: {
  email: string;
  phone: string | null;
  appLanguage: string | null;
}) {
  const t = useTranslations("Organisations.profile");
  const language =
    appLanguage === "en" || appLanguage === "fr" ? t(`languages.${appLanguage}`) : "";
  return (
    <div className="flex flex-col gap-6">
      <h3 className={sectionTitle}>{t("information")}</h3>
      <Input type="email" value={email} disabled readOnly>
        {t("fields.owner_email")}
      </Input>
      <Input type="tel" value={phone ?? ""} disabled readOnly>
        {t("fields.owner_phone")}
      </Input>
      <Input value={language} disabled readOnly>
        {t("fields.language")}
      </Input>
    </div>
  );
}
