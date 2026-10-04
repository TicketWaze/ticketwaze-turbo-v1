"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { InfoCircle } from "iconsax-reactjs";
import { MembershipTier, Organisation } from "@ticketwaze/typescript-config";
import { Input, TextArea } from "@/components/shared/Inputs";
import { ButtonPill } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import countries from "@/lib/Countries";
import { UpdateOrganisationProfile } from "@/actions/organisationActions";
import { cn } from "@/lib/utils";
import { SettingsColumn, SettingsHeader } from "../parts";
import ProfileImage from "./ProfileImage";
import CurrencyPreference from "./CurrencyPreference";
import ShareOrganisation from "./ShareOrganisation";

const COUNTRY = "Haiti";
const ABOUT_MIN = 150;
const ABOUT_MAX = 350;
const selectClass =
  "w-full bg-neutral-100 rounded-[5rem] !h-[6rem] px-8 text-[1.5rem] text-deep-200 border border-transparent focus:border-primary-500 shadow-none";

type Fields = {
  organisationName: string;
  address: string;
  city: string;
  state: string;
  organisationDescription: string;
  organisationEmail: string;
  organisationPhoneNumber: string;
  organisationWebsite: string;
  instagram: string;
  twitter: string;
};

/**
 * Profile (Figma 1820:47771 view / 1821:48133 edit): "Organization Profile"
 * — address, city, state, about, contact email and phone, website — read-only
 * until Edit, saved with Save changes. The post-design parts stay with it: the
 * logo and name above, social links, the display currency and the share card.
 */
export default function ProfileContent({
  organisation,
  membershipTier,
}: {
  organisation: Organisation;
  membershipTier: MembershipTier;
}) {
  const t = useTranslations("Settings.profile");
  const locale = useLocale();
  const { update } = useSession();
  const initial: Fields = {
    organisationName: organisation.organisationName ?? "",
    address: organisation.address ?? "",
    city: organisation.city ?? "",
    state: organisation.state ?? "",
    organisationDescription: organisation.organisationDescription ?? "",
    organisationEmail: organisation.organisationEmail ?? "",
    organisationPhoneNumber: organisation.organisationPhoneNumber ?? "",
    organisationWebsite: organisation.organisationWebsite ?? "",
    instagram: (organisation.socialLinks?.instagram as string) ?? "",
    twitter: (organisation.socialLinks?.twitter as string) ?? "",
  };
  const [saved, setSaved] = useState<Fields>(initial);
  const [data, setData] = useState<Fields>(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>(
    {},
  );
  const set = (field: keyof Fields) => (value: string) => {
    setData((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const states = useMemo(
    () => countries.find((c) => c.name === COUNTRY)?.state ?? [],
    [],
  );
  // City first (as in Figma): every city until a state narrows the list, and
  // picking a city fills in its state.
  const cities = useMemo(() => {
    const pool = data.state
      ? states.filter((s) => s.name === data.state)
      : states;
    const list = pool
      .flatMap((s) => s.cities.map((city) => ({ city, state: s.name })))
      .sort((a, b) => a.city.localeCompare(b.city));
    // Keep an existing value selectable even if it is not in the list.
    if (data.city && !list.some((c) => c.city === data.city)) {
      list.unshift({ city: data.city, state: data.state });
    }
    return list;
  }, [states, data.state, data.city]);

  function validate() {
    const e: Partial<Record<keyof Fields, string>> = {};
    const name = data.organisationName.trim();
    if (name.length < 3) e.organisationName = t("errors.name.min");
    if (name.length > 30) e.organisationName = t("errors.name.max");
    const about = data.organisationDescription.trim().length;
    if (about < ABOUT_MIN)
      e.organisationDescription = t("errors.description.min");
    if (about > ABOUT_MAX)
      e.organisationDescription = t("errors.description.max");
    if (
      data.organisationEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.organisationEmail.trim())
    ) {
      e.organisationEmail = t("errors.email");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    const result = await UpdateOrganisationProfile(
      organisation.organisationId,
      data.organisationName.trim(),
      data.organisationDescription.trim(),
      locale,
      data.organisationWebsite.trim(),
      data.instagram.trim(),
      data.twitter.trim(),
      {
        address: data.address.trim(),
        country: COUNTRY,
        city: data.city,
        state: data.state,
        ...(data.organisationEmail.trim()
          ? { organisationEmail: data.organisationEmail.trim() }
          : {}),
        organisationPhoneNumber: data.organisationPhoneNumber.trim(),
      },
    );
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t("saved"));
    setSaved(data);
    setEditing(false);
    if (result.organisation)
      await update({ activeOrganisation: result.organisation });
  }

  const off = !editing || saving;

  return (
    <div className="flex flex-col gap-12 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <SettingsHeader
        title={t("title")}
        actions={
          <>
            <ShareOrganisation organisation={organisation} />
            {editing ? (
              <>
                <ButtonPill
                  onClick={() => {
                    setData(saved);
                    setErrors({});
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  {t("cancel")}
                </ButtonPill>
                <ButtonPill
                  tone="primary"
                  onClick={save}
                  disabled={saving}
                  className="min-w-[13rem]"
                >
                  {saving ? <LoadingCircleSmall /> : t("save")}
                </ButtonPill>
              </>
            ) : (
              <ButtonPill
                tone="primary"
                onClick={() => setEditing(true)}
                className="px-8"
              >
                {t("edit")}
              </ButtonPill>
            )}
          </>
        }
      />

      <SettingsColumn delay={0.05}>
        <ProfileImage />
        <Input
          value={data.organisationName}
          onChange={(e) => set("organisationName")(e.target.value)}
          disabled={off}
          maxLength={30}
          error={errors.organisationName}
        >
          {t("placeholders.name")}
        </Input>
      </SettingsColumn>

      <SettingsColumn title={t("subtitle")} delay={0.1}>
        <Input
          value={data.address}
          onChange={(e) => set("address")(e.target.value)}
          disabled={off}
          maxLength={255}
        >
          {t("placeholders.address")}
        </Input>
        <div className="flex flex-col lg:flex-row gap-4">
          <Select
            value={data.city || undefined}
            disabled={off}
            onValueChange={(city) => {
              const match = cities.find((c) => c.city === city);
              setData((d) => ({ ...d, city, state: match?.state ?? d.state }));
            }}
          >
            <SelectTrigger
              aria-label={t("placeholders.city")}
              className={cn(selectClass, "flex-1")}
            >
              <SelectValue placeholder={t("placeholders.city")} />
            </SelectTrigger>
            <SelectContent className="max-h-[30rem]">
              {cities.map(({ city, state }) => (
                <SelectItem
                  key={`${state}-${city}`}
                  value={city}
                  className="text-[1.4rem]"
                >
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={data.state || undefined}
            disabled={off}
            onValueChange={(state) =>
              setData((d) => ({
                ...d,
                state,
                city: states
                  .find((s) => s.name === state)
                  ?.cities.includes(d.city)
                  ? d.city
                  : "",
              }))
            }
          >
            <SelectTrigger
              aria-label={t("placeholders.state")}
              className={cn(selectClass, "flex-1")}
            >
              <SelectValue placeholder={t("placeholders.state")} />
            </SelectTrigger>
            <SelectContent>
              {states.map((s) => (
                <SelectItem
                  key={s.name}
                  value={s.name}
                  className="text-[1.4rem]"
                >
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TextArea
          value={data.organisationDescription}
          onChange={(e) => set("organisationDescription")(e.target.value)}
          disabled={off}
          maxLength={ABOUT_MAX}
          charCount={
            editing ? data.organisationDescription.trim().length : undefined
          }
          minChars={ABOUT_MIN}
          maxChars={ABOUT_MAX}
          error={errors.organisationDescription}
        >
          {t("placeholders.about")}
        </TextArea>
        <Input
          type="email"
          value={data.organisationEmail}
          onChange={(e) => set("organisationEmail")(e.target.value)}
          disabled={off}
          error={errors.organisationEmail}
        >
          {t("placeholders.email")}
        </Input>
        <Input
          inputMode="tel"
          value={data.organisationPhoneNumber}
          onChange={(e) => set("organisationPhoneNumber")(e.target.value)}
          disabled={off}
          maxLength={30}
        >
          {t("placeholders.phone")}
        </Input>
        <Input
          type="url"
          value={data.organisationWebsite}
          onChange={(e) => set("organisationWebsite")(e.target.value)}
          disabled={off}
          placeholder="https://yourwebsite.com"
        >
          {t("placeholders.website")}
        </Input>
      </SettingsColumn>

      <SettingsColumn
        delay={0.16}
        title={
          <span className="flex items-center gap-3">
            {t("placeholders.social_links")}
            {membershipTier.membershipName !== "premium" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-pointer flex items-center">
                    <InfoCircle size="18" color="#E45B00" variant="Bulk" />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-88 text-[1.2rem] leading-6"
                >
                  {t("placeholders.social_links_premium")}
                </TooltipContent>
              </Tooltip>
            )}
          </span>
        }
      >
        {(
          [
            ["instagram", "instagram.com/"],
            ["twitter", "x.com/"],
          ] as const
        ).map(([field, prefix]) => (
          <label
            key={field}
            className={cn(
              "flex items-center bg-neutral-100 rounded-[5rem] h-[6rem] overflow-hidden border border-transparent focus-within:border-primary-500",
              off && "text-neutral-500",
            )}
          >
            <span className="pl-8 pr-2 text-[1.5rem] text-neutral-500 whitespace-nowrap select-none">
              {prefix}
            </span>
            <input
              value={data[field]}
              onChange={(e) => set(field)(e.target.value)}
              disabled={off}
              placeholder={t(`placeholders.${field}`)}
              className="flex-1 min-w-0 bg-transparent pr-8 text-[1.5rem] text-deep-200 outline-none disabled:text-neutral-500 disabled:cursor-not-allowed"
            />
          </label>
        ))}
      </SettingsColumn>

      <SettingsColumn delay={0.22}>
        <CurrencyPreference organisation={organisation} />
      </SettingsColumn>
    </div>
  );
}
