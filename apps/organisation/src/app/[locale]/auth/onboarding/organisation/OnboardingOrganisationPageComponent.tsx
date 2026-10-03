"use client";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input, TextArea } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import SocialLinksField, {
  type SocialLinks,
  type SocialPlatform,
} from "@/components/auth/SocialLinksField";
import {
  AuthHeading,
  AuthItem,
  AuthScreen,
  StepFooter,
} from "@/components/auth/AuthParts";
import countries from "@/lib/Countries";

// Organizer sign-up step 2/2, "Complete Account Set-up" in Figma. Creates the
// organisation (POST /auth/organizer/setup) with the name typed at step 1/2,
// carried here as ?name=. Without it (an existing account that never set up an
// organisation) the name is asked for at the top of the form.

const COUNTRY = "Haiti";
const ABOUT_MIN = 150;
const ABOUT_MAX = 350;
const PHONE_PATTERN = /^\+?[0-9 ()-]{6,20}$/;
// A handle, or a pasted profile URL (the API keeps only the handle).
const LINK_PATTERNS: Record<SocialPlatform, RegExp> = {
  instagram: /^(https?:\/\/)?(www\.)?(instagram\.com\/)?@?[a-z0-9._]{1,30}\/?([?#].*)?$/i,
  tiktok: /^(https?:\/\/)?(www\.)?(tiktok\.com\/)?@?[a-z0-9._]{2,24}\/?([?#].*)?$/i,
  website: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i,
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SetupData {
  organisationName: string;
  address: string;
  state: string;
  city: string;
  about: string;
  contactEmail: string;
  phone: string;
}
type SetupErrors = Partial<Record<keyof SetupData, string>>;

const selectTriggerClass =
  "bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full data-[size=default]:h-[6rem] text-[1.5rem] text-deep-200 leading-8 shadow-none";

export default function OnboardingOrganisationPageComponent() {
  const t = useTranslations("Auth.flow.setup");
  const locale = useLocale();
  const router = useRouter();
  const carriedName = useSearchParams().get("name")?.trim() ?? "";
  const { data: session, update } = useSession();

  const [data, setData] = useState<SetupData>({
    organisationName: carriedName,
    address: "",
    state: "",
    city: "",
    about: "",
    contactEmail: "",
    phone: "",
  });
  const [errors, setErrors] = useState<SetupErrors>({});
  const [links, setLinks] = useState<SocialLinks>({});
  const [linkErrors, setLinkErrors] = useState<
    Partial<Record<SocialPlatform, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Asked only when step 1/2 didn't provide it, or when it turned out taken.
  const [askName, setAskName] = useState(carriedName.length < 3);

  // The sign-up email is the natural contact address: shown until the field
  // is edited (the session can arrive after the first render).
  const [emailTouched, setEmailTouched] = useState(false);
  const contactEmail = emailTouched
    ? data.contactEmail
    : data.contactEmail || (session?.user?.email ?? "");

  const states = useMemo(
    () => countries.find((c) => c.name === COUNTRY)?.state ?? [],
    [],
  );
  // Figma puts City before State, so City lists every city until a state
  // narrows it, and picking a city fills in its state.
  const cities = useMemo(() => {
    const pool = data.state
      ? states.filter((s) => s.name === data.state)
      : states;
    return pool
      .flatMap((s) => s.cities.map((city) => ({ city, state: s.name })))
      .sort((a, b) => a.city.localeCompare(b.city));
  }, [states, data.state]);

  function setField<K extends keyof SetupData>(field: K, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): SetupErrors {
    const e: SetupErrors = {};
    const name = data.organisationName.trim();
    if (name.length < 3 || name.length > 30)
      e.organisationName = t("errors.organisation_name");
    if (!data.address.trim()) e.address = t("errors.address");
    if (!data.city) e.city = t("errors.city");
    if (!data.state) e.state = t("errors.state");
    const about = data.about.trim().length;
    if (about < ABOUT_MIN || about > ABOUT_MAX) e.about = t("errors.about");
    if (!EMAIL_PATTERN.test(contactEmail.trim()))
      e.contactEmail = t("errors.contact_email");
    if (!PHONE_PATTERN.test(data.phone.trim()))
      e.phone = t("errors.contact_phone");
    return e;
  }

  // Links are optional; a row added but left empty is simply not sent.
  function validateLinks() {
    const e: Partial<Record<SocialPlatform, string>> = {};
    for (const [platform, raw] of Object.entries(links) as [SocialPlatform, string][]) {
      const v = raw.trim();
      if (v && !LINK_PATTERNS[platform].test(v)) e[platform] = t(`links.errors.${platform}`);
    }
    return e;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    const foundLinks = validateLinks();
    if (found.organisationName) setAskName(true);
    setLinkErrors(foundLinks);
    if (Object.keys(found).length > 0 || Object.keys(foundLinks).length > 0) {
      setErrors(found);
      return;
    }
    setIsSubmitting(true);
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/organizer/setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
            Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
          body: JSON.stringify({
            organisationName: data.organisationName.trim(),
            address: data.address.trim(),
            country: COUNTRY,
            state: data.state,
            city: data.city,
            organisationDescription: data.about.trim(),
            organisationEmail: contactEmail.trim(),
            organisationPhoneNumber: data.phone.trim(),
            organisationWebsite: links.website?.trim() || null,
            instagram: links.instagram?.trim() || null,
            tiktok: links.tiktok?.trim() || null,
          }),
        },
      );
      const response = await request.json();
      if (response.status !== "success") {
        if (response.code === "ORGANISATION_NAME_TAKEN") {
          setAskName(true);
          setErrors({ organisationName: t("errors.organisation_name_taken") });
        } else if (response.code === "ORGANISATION_ALREADY_OWNED") {
          toast.info(t("errors.already_owned"));
          router.push("/auth/onboarding");
        } else {
          toast.error(t("errors.generic"));
        }
        setIsSubmitting(false);
        return;
      }

      await update({
        activeOrganisation: {
          ...response.organisation,
          membershipTier: response.membershipTier,
        },
      });
      // Step 3/3, the optional KYC; it ends on "Account Created".
      window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/auth/verification?onboarding=1`;
    } catch {
      toast.error(t("errors.generic"));
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full h-full"
    >
          <AuthScreen footer={<StepFooter step={2} total={3} />}>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-16 items-center w-full"
            >
              <AuthHeading title={t("title")} description={t("description")} />
              <div className="w-full flex flex-col gap-6">
                {askName && (
                  <AuthItem>
                    <Input
                      value={data.organisationName}
                      onChange={(e) =>
                        setField("organisationName", e.target.value)
                      }
                      maxLength={30}
                      autoComplete="organization"
                      error={errors.organisationName}
                    >
                      {t("organisation_name")}
                    </Input>
                  </AuthItem>
                )}
                <AuthItem>
                  <Input
                    value={data.address}
                    onChange={(e) => setField("address", e.target.value)}
                    autoComplete="street-address"
                    error={errors.address}
                  >
                    {t("address")}
                  </Input>
                </AuthItem>
                <AuthItem>
                  <div className="flex gap-6">
                    <Field error={errors.city} className="flex-1 min-w-0">
                      <Select
                        value={data.city}
                        onValueChange={(city) => {
                          const match = cities.find((c) => c.city === city);
                          setData((prev) => ({
                            ...prev,
                            city,
                            state: match?.state ?? prev.state,
                          }));
                          setErrors((e) => ({
                            ...e,
                            city: undefined,
                            state: undefined,
                          }));
                        }}
                      >
                        <SelectTrigger
                          aria-label={t("city")}
                          className={selectTriggerClass}
                        >
                          <SelectValue placeholder={t("city")} />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-100 text-[1.4rem] max-h-[30rem]">
                          {cities.map(({ city, state }) => (
                            <SelectItem
                              key={`${state}-${city}`}
                              value={city}
                              className="text-[1.4rem] text-deep-100"
                            >
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field error={errors.state} className="flex-1 min-w-0">
                      <Select
                        value={data.state}
                        onValueChange={(state) => {
                          setData((prev) => {
                            const keepCity = states
                              .find((s) => s.name === state)
                              ?.cities.includes(prev.city);
                            return {
                              ...prev,
                              state,
                              city: keepCity ? prev.city : "",
                            };
                          });
                          setErrors((e) => ({ ...e, state: undefined }));
                        }}
                      >
                        <SelectTrigger
                          aria-label={t("state")}
                          className={selectTriggerClass}
                        >
                          <SelectValue placeholder={t("state")} />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-100 text-[1.4rem]">
                          {states.map((s) => (
                            <SelectItem
                              key={s.name}
                              value={s.name}
                              className="text-[1.4rem] text-deep-100"
                            >
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </AuthItem>
                <AuthItem>
                  <TextArea
                    value={data.about}
                    onChange={(e) => setField("about", e.target.value)}
                    maxLength={ABOUT_MAX}
                    charCount={data.about.trim().length}
                    minChars={ABOUT_MIN}
                    maxChars={ABOUT_MAX}
                    error={errors.about}
                  >
                    {t("about")}
                  </TextArea>
                </AuthItem>
                <AuthItem>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setEmailTouched(true);
                      setField("contactEmail", e.target.value);
                    }}
                    autoComplete="email"
                    error={errors.contactEmail}
                  >
                    {t("contact_email")}
                  </Input>
                </AuthItem>
                <AuthItem>
                  <Input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    autoComplete="tel"
                    error={errors.phone}
                  >
                    {t("contact_phone")}
                  </Input>
                </AuthItem>
                <AuthItem>
                  <SocialLinksField
                    value={links}
                    onChange={(next) => {
                      setLinks(next);
                      setLinkErrors({});
                    }}
                    errors={linkErrors}
                  />
                </AuthItem>
              </div>
              <AuthItem>
                <ButtonPrimary
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[6rem] active:scale-[0.98]"
                >
                  {isSubmitting ? <LoadingCircleSmall /> : t("submit")}
                </ButtonPrimary>
              </AuthItem>
            </form>
          </AuthScreen>
    </motion.div>
  );
}

function Field({
  error,
  className,
  children,
}: {
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="text-[1.2rem] px-8 py-2 text-failure block overflow-hidden"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
