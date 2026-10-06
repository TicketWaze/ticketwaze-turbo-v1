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
import SocialLinksField, {
  type SocialLinks,
  type SocialPlatform,
  validateSocialLinks,
} from "@/components/auth/SocialLinksField";

const DEFAULT_COUNTRY = "Haiti";
const ABOUT_MIN = 150;
const ABOUT_MAX = 350;
const selectClass =
  "w-full bg-neutral-100 rounded-[5rem] !h-[6rem] px-8 text-[1.5rem] text-deep-200 border border-transparent focus:border-primary-500 shadow-none";

type Fields = {
  organisationName: string;
  address: string;
  country: string;
  state: string;
  city: string;
  organisationDescription: string;
  organisationEmail: string;
  organisationPhoneNumber: string;
  /** Only the links the organisation added (website, Instagram, TikTok, X). */
  links: SocialLinks;
};
type TextField = Exclude<keyof Fields, "links">;

/** The saved links as rows: a platform shows only when it has a value. */
function linksOf(organisation: Organisation): SocialLinks {
  const social = (organisation.socialLinks ?? {}) as Record<string, unknown>;
  const links: SocialLinks = {};
  if (organisation.organisationWebsite)
    links.website = organisation.organisationWebsite;
  for (const platform of ["instagram", "tiktok", "twitter"] as const) {
    const handle = social[platform];
    if (typeof handle === "string" && handle.trim()) links[platform] = handle;
  }
  return links;
}

/** Rows added but left empty are dropped on save. */
function filledLinks(links: SocialLinks): SocialLinks {
  return Object.fromEntries(
    Object.entries(links).filter(([, v]) => v?.trim()),
  ) as SocialLinks;
}

/**
 * Profile (Figma 1820:47771 view / 1821:48133 edit): "Organization Profile"
 * — address, country, state, city, about, contact email and phone, website — read-only
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
  const { data: session, update } = useSession();
  const initial: Fields = {
    organisationName: organisation.organisationName ?? "",
    address: organisation.address ?? "",
    country: organisation.country || DEFAULT_COUNTRY,
    state: organisation.state ?? "",
    city: organisation.city ?? "",
    organisationDescription: organisation.organisationDescription ?? "",
    organisationEmail: organisation.organisationEmail ?? "",
    organisationPhoneNumber: organisation.organisationPhoneNumber ?? "",
    links: linksOf(organisation),
  };
  const [saved, setSaved] = useState<Fields>(initial);
  const [data, setData] = useState<Fields>(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<TextField, string>>>({});
  const [linkErrors, setLinkErrors] = useState<
    Partial<Record<SocialPlatform, string>>
  >({});
  const tLinks = useTranslations("Auth.flow.setup.links");
  const set = (field: TextField) => (value: string) => {
    setData((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const states = useMemo(
    () => countries.find((c) => c.name === data.country)?.state ?? [],
    [data.country],
  );
  // City lists every city of the country until a state narrows it, and
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
    const e: Partial<Record<TextField, string>> = {};
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
    const le = validateSocialLinks(data.links, tLinks);
    setErrors(e);
    setLinkErrors(le);
    return Object.keys(e).length === 0 && Object.keys(le).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    // A link not added (or removed) is sent empty, which clears it.
    const links = filledLinks(data.links);
    const result = await UpdateOrganisationProfile(
      organisation.organisationId,
      data.organisationName.trim(),
      data.organisationDescription.trim(),
      locale,
      links.website?.trim(),
      links.instagram?.trim(),
      links.twitter?.trim(),
      {
        tiktok: links.tiktok?.trim(),
        address: data.address.trim(),
        country: data.country,
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
    // What the API stored: handles only, so a pasted URL shows as its handle.
    const stored = result.organisation
      ? linksOf(result.organisation as Organisation)
      : links;
    setSaved({ ...data, links: stored });
    setData({ ...data, links: stored });
    setEditing(false);
    // Merged into the session's copy: the API's organisation has no role,
    // permissions or plan, and replacing the copy with it hid every
    // permission-gated button (e.g. "Create activity") until the next refresh.
    if (result.organisation)
      await update({
        activeOrganisation: {
          ...session?.activeOrganisation,
          ...result.organisation,
        },
      });
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
                    setLinkErrors({});
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
        <Select
          value={data.country || undefined}
          disabled={off}
          onValueChange={(country) =>
            setData((d) => ({ ...d, country, state: "", city: "" }))
          }
        >
          <SelectTrigger
            aria-label={t("placeholders.country")}
            className={selectClass}
          >
            <SelectValue placeholder={t("placeholders.country")} />
          </SelectTrigger>
          <SelectContent className="max-h-[30rem]">
            {countries.map((c) => (
              <SelectItem key={c.name} value={c.name} className="text-[1.4rem]">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-col lg:flex-row gap-4">
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
            <SelectContent className="max-h-[30rem]">
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
        {/* Same field as the set-up: only the links added, "+ Add link" for
            more while editing. */}
        <SocialLinksField
          value={data.links}
          onChange={(links) => {
            setData((d) => ({ ...d, links }));
            setLinkErrors({});
          }}
          errors={linkErrors}
          readOnly={off}
          emptyLabel={t("no_links")}
        />
      </SettingsColumn>

      <SettingsColumn delay={0.22}>
        <CurrencyPreference organisation={organisation} />
      </SettingsColumn>
    </div>
  );
}
