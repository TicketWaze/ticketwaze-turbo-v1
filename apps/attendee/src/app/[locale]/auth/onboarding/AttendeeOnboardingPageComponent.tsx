"use client";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { safeCallbackPath } from "@/lib/authRedirect";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  AuthHeading,
  AuthItem,
  AuthScreen,
  AuthStatus,
  SigningIn,
  StepFooter,
} from "@/components/auth/AuthParts";
import successBadge from "@/assets/images/auth/success-badge.png";
import countries from "@/lib/Countries";

// Sign-up step 2/2, "Complete Account Set-up" in Figma. Currency, interests
// and intent are no longer asked here: the API defaults them and the attendee
// edits them on the Preference page.

interface SetupData {
  username: string;
  address: string;
  country: string;
  state: string;
  city: string;
  dateOfBirth: string; // YYYY-MM-DD from <input type="date">
  gender: string;
}

type SetupErrors = Partial<Record<keyof SetupData, string>>;

const USERNAME_PATTERN = /^@?[a-zA-Z0-9_.]{3,30}$/;
const GENDERS = ["male", "female", "non-binary", "undisclosed"] as const;

const selectTriggerClass =
  "bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full data-[size=default]:h-[6rem] text-[1.5rem] text-deep-200 leading-8 shadow-none";

export default function AttendeeOnboardingPageComponent() {
  const t = useTranslations("Auth.flow.setup");
  const tFlow = useTranslations("Auth.flow");
  const tOnboarding = useTranslations("Auth.onboarding");
  const router = useRouter();
  // Back to where a signed-out prompt started, when there was one.
  const callbackUrl = safeCallbackPath(useSearchParams().get("callbackUrl"));
  const locale = useLocale();
  const { data: session, update } = useSession();

  const [data, setData] = useState<SetupData>({
    username: "",
    address: "",
    country: "Haiti",
    state: "",
    city: "",
    dateOfBirth: "",
    gender: "",
  });
  const [errors, setErrors] = useState<SetupErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const states = countries.find((c) => c.name === data.country)?.state ?? [];
  const cities = states.find((s) => s.name === data.state)?.cities ?? [];

  function setField<K extends keyof SetupData>(field: K, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): SetupErrors {
    const e: SetupErrors = {};
    if (!USERNAME_PATTERN.test(data.username.trim()))
      e.username = t("errors.username");
    if (!data.address.trim()) e.address = t("errors.address");
    if (!data.country) e.country = t("errors.country");
    if (!data.state) e.state = t("errors.state");
    if (!data.city) e.city = t("errors.city");
    if (!data.dateOfBirth) e.dateOfBirth = t("errors.dob");
    if (!data.gender) e.gender = t("errors.gender");
    return e;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setIsSubmitting(true);
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/onboarding/user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": locale,
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
          body: JSON.stringify({
            username: data.username.trim().toLowerCase(),
            address: data.address.trim(),
            country: data.country,
            state: data.state,
            city: data.city,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
          }),
        },
      );
      const response = await request.json();
      if (response.status !== "success") {
        if (response.code === "USERNAME_TAKEN") {
          setErrors({ username: t("errors.username_taken") });
        } else {
          toast.error(response.message);
        }
        setIsSubmitting(false);
        return;
      }

      setIsDone(true);
      // Onboarding is persisted from here on. Refreshing the session is what
      // lets middleware through to /explore, but a failure here must not undo
      // a completed signup — worst case the stale flag self-heals on refresh.
      try {
        await update({
          ...session,
          user: {
            ...session?.user,
            isOnboarded: true,
            userPreference: response.userPreference,
          },
        });
      } catch {}

      // `welcome=1` makes the welcome modal part of the first paint of
      // /explore instead of waiting on a client fetch — see WelcomeModal.
      router.push(callbackUrl ?? "/explore?welcome=1");
    } catch {
      toast.error(tOnboarding("saveError"));
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isDone ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full h-full"
        >
          <AuthScreen centered>
            <AuthStatus
              image={successBadge}
              title={tFlow("created.title")}
              description={tFlow("created.description")}
            >
              <SigningIn />
            </AuthStatus>
          </AuthScreen>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          exit={{ opacity: 0, x: -30 }}
          className="w-full h-full"
        >
          <AuthScreen footer={<StepFooter step={2} total={2} />}>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-16 items-center w-full"
            >
              <AuthHeading title={t("title")} description={t("description")} />
              <div className="w-full flex flex-col gap-6">
                <AuthItem>
                  <Input
                    value={data.username}
                    onChange={(e) => setField("username", e.target.value)}
                    autoCapitalize="none"
                    autoComplete="username"
                    error={errors.username}
                  >
                    {t("username")}
                  </Input>
                </AuthItem>
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
                  <Field error={errors.country}>
                    <Select
                      value={data.country}
                      onValueChange={(v) => {
                        setData((prev) => ({
                          ...prev,
                          country: v,
                          state: "",
                          city: "",
                        }));
                        setErrors((e) => ({ ...e, country: undefined }));
                      }}
                    >
                      <SelectTrigger
                        aria-label={t("country")}
                        className={selectTriggerClass}
                      >
                        <SelectValue placeholder={t("country")} />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-100 text-[1.4rem]">
                        {countries.map((c) => (
                          <SelectItem
                            key={c.name}
                            value={c.name}
                            className="text-[1.4rem] text-deep-100"
                          >
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </AuthItem>
                <AuthItem>
                  <div className="flex gap-6">
                    <Field error={errors.state} className="flex-1 min-w-0">
                      <Select
                        value={data.state}
                        disabled={!data.country}
                        onValueChange={(v) => {
                          setData((prev) => ({ ...prev, state: v, city: "" }));
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
                    <Field error={errors.city} className="flex-1 min-w-0">
                      <Select
                        value={data.city}
                        disabled={!data.state}
                        onValueChange={(v) => setField("city", v)}
                      >
                        <SelectTrigger
                          aria-label={t("city")}
                          className={selectTriggerClass}
                        >
                          <SelectValue placeholder={t("city")} />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-100 text-[1.4rem]">
                          {cities.map((city) => (
                            <SelectItem
                              key={city}
                              value={city}
                              className="text-[1.4rem] text-deep-100"
                            >
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </AuthItem>
                <AuthItem>
                  <Input
                    type="date"
                    value={data.dateOfBirth}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setField("dateOfBirth", e.target.value)}
                    error={errors.dateOfBirth}
                  >
                    {t("dob")}
                  </Input>
                </AuthItem>
                <AuthItem>
                  <Field error={errors.gender}>
                    <Select
                      value={data.gender}
                      onValueChange={(v) => setField("gender", v)}
                    >
                      <SelectTrigger
                        aria-label={t("gender")}
                        className={selectTriggerClass}
                      >
                        <SelectValue placeholder={t("gender")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-[1.4rem]">
                        <SelectGroup>
                          <SelectLabel className="text-[1.3rem] text-neutral-500">
                            {t("genders.title")}
                          </SelectLabel>
                          {GENDERS.map((g) => (
                            <SelectItem
                              key={g}
                              value={g}
                              className="text-[1.4rem] text-deep-100"
                            >
                              {t(`genders.${g}`)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
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
      )}
    </AnimatePresence>
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
