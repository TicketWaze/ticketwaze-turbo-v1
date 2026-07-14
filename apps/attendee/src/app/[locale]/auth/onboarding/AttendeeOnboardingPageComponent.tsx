"use client";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Separator from "@/components/shared/Separator";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import countries from "@/lib/Countries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  intent: string; // step 1
  country: string; // step 2
  city: string; // step 2
  state: string; // step 2
  categories: string[]; // step 3
  currency: string; // step 4
}

type StepErrors = Partial<Record<keyof OnboardingData, string>>;

const TOTAL_STEPS = 4;
const CATEGORIES_MIN = 3;
const CATEGORIES_MAX = 5;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttendeeOnboardingPageComponent() {
  const t = useTranslations("Auth.onboarding");
  const router = useRouter();

  function validateStep(step: number, data: OnboardingData): StepErrors {
    const errors: StepErrors = {};
    if (step === 1 && !data.intent) {
      errors.intent = t("attendee.errors.intent");
    }
    if (step === 2) {
      if (!data.country.trim()) errors.country = t("attendee.errors.country");
      if (!data.city.trim()) errors.city = t("attendee.errors.city");
    }
    if (
      step === 3 &&
      (data.categories.length < CATEGORIES_MIN ||
        data.categories.length > CATEGORIES_MAX)
    ) {
      errors.categories = t("attendee.errors.categories");
    }
    if (step === 4 && !data.currency) {
      errors.currency = t("attendee.errors.currency");
    }
    return errors;
  }

  const categoryList = [
    { title: t("fourth.musics"), value: "musics" },
    { title: t("fourth.theater"), value: "theater" },
    { title: t("fourth.arts"), value: "arts" },
    { title: t("fourth.sports"), value: "sports" },
    { title: t("fourth.business"), value: "business" },
    { title: t("fourth.networking"), value: "networking" },
    { title: t("fourth.online"), value: "online" },
    { title: t("fourth.rentals"), value: "rentals" },
    { title: t("fourth.transport"), value: "transport" },
    { title: t("fourth.booking"), value: "booking" },
  ];

  // ── State ──────────────────────────────────────────────────────────────────

  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const delta = currentStep - previousStep;
  const locale = useLocale();
  const { data: session, update } = useSession();

  const [data, setData] = useState<OnboardingData>({
    intent: "",
    country: "",
    city: "",
    state: "",
    categories: [],
    currency: "",
  });

  const [errors, setErrors] = useState<StepErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggleCategory(value: string) {
    setData((prev) => {
      const selected = prev.categories.includes(value);
      if (!selected && prev.categories.length >= CATEGORIES_MAX) return prev;
      return {
        ...prev,
        categories: selected
          ? prev.categories.filter((c) => c !== value)
          : [...prev.categories, value],
      };
    });
    if (errors.categories) setErrors((e) => ({ ...e, categories: undefined }));
  }

  function setRadioField<K extends keyof OnboardingData>(
    field: K,
    value: string,
  ) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function next() {
    if (currentStep === TOTAL_STEPS) return;
    const stepErrors = validateStep(currentStep, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setPreviousStep(currentStep);
    setCurrentStep((s) => s + 1);
  }

  function previous() {
    setErrors({});
    if (currentStep > 1) {
      setPreviousStep(currentStep);
      setCurrentStep((s) => s - 1);
    } else {
      router.push("/auth/onboarding");
    }
  }

  async function handleFinish() {
    const stepErrors = validateStep(TOTAL_STEPS, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
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
            currency: data.currency,
            intent: data.intent,
            interests: data.categories,
            country: data.country,
            city: data.city,
            state: data.state,
          }),
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        await update({
          ...session,
          user: {
            ...session?.user,
            isOnboarded: true,
            userPreference: response.userPreference,
          },
        });
        router.push("/explore");
      } else {
        toast.error(response.message);
      }
    } catch (err) {
      toast.error(`Failed to save onboarding data: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Progress bar ───────────────────────────────────────────────────────────

  const progressPercent = Math.round(
    ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100,
  );

  const availableCountries = countries.map((c) => c.name);
  const availableStatesForCountry =
    countries.find((c) => c.name === data.country)?.state ?? [];
  const citiesForState =
    availableStatesForCountry.find((s) => s.name === data.state)?.cities ?? [];

  const setupMessages = [
    t("loading.1"),
    t("loading.2"),
    t("loading.3"),
    t("loading.4"),
    t("loading.5"),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isSubmitting) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-10 py-12 min-h-[60vh]">
        <SetupLoader messages={setupMessages} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center h-full justify-between gap-12 py-12">
      <div className="flex flex-col gap-4">
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-medium font-primary text-center text-[3.2rem] leading-14 text-black"
        >
          {t("setup")}
        </motion.h3>

        <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1 – Intent ───────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: delta >= 0 ? "-50%" : "50%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col gap-10 h-full items-center justify-center"
          >
            <p className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
              {t("fifth.question")}
            </p>
            <RadioGroup
              value={data.intent}
              onValueChange={(v) => setRadioField("intent", v)}
              className="flex flex-col gap-6 w-full"
            >
              <RadioRow value="discover" label={t("fifth.discover")} />
              <Separator />
              <RadioRow value="buy" label={t("fifth.buy")} />
              <Separator />
              {/* <RadioRow value="resell" label={t("fifth.resell")} />
              <Separator /> */}
              <RadioRow value="group" label={t("fifth.group")} />
            </RadioGroup>
            {errors.intent && <ErrorMessage message={errors.intent} />}
          </motion.div>
        )}

        {/* ── Step 2 – Location (country → state → city) ───────────────────── */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: delta >= 0 ? "-50%" : "50%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col gap-8 h-full items-center justify-center"
          >
            <p className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
              {t("second.question")}
            </p>
            <div className="flex flex-col gap-4 w-full">
              {/* Country */}
              <div className="flex flex-col gap-1">
                <label className="text-[1.3rem] text-neutral-500">
                  {t("second.country")}
                </label>
                <Select
                  value={data.country}
                  onValueChange={(v) => {
                    setData((prev) => ({
                      ...prev,
                      country: v,
                      state: "",
                      city: "",
                    }));
                    if (errors.country)
                      setErrors((e) => ({ ...e, country: undefined }));
                  }}
                >
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full py-12 text-[1.4rem] text-neutral-700 leading-8">
                    <SelectValue placeholder={t("second.countryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-100 text-[1.4rem]">
                    <SelectGroup>
                      {availableCountries.map((country, i) => (
                        <SelectItem
                          className="text-[1.4rem] text-deep-100"
                          key={i}
                          value={country}
                        >
                          {country}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.country && <ErrorMessage message={errors.country} />}
              </div>

              {/* State — depends on country */}
              <div className="flex flex-col gap-1">
                <label className="text-[1.3rem] text-neutral-500">
                  {t("second.state")}
                </label>
                <Select
                  value={data.state}
                  disabled={!data.country}
                  onValueChange={(v) => {
                    setData((prev) => ({ ...prev, state: v, city: "" }));
                  }}
                >
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full py-12 text-[1.4rem] text-neutral-700 leading-8">
                    <SelectValue placeholder={t("second.statePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-100 text-[1.4rem]">
                    <SelectGroup>
                      {availableStatesForCountry.map((state, i) => (
                        <SelectItem
                          className="text-[1.4rem] text-deep-100"
                          key={i}
                          value={state.name}
                        >
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* City — depends on state */}
              <div className="flex flex-col gap-1">
                <label className="text-[1.3rem] text-neutral-500">
                  {t("second.city")}
                </label>
                <Select
                  value={data.city}
                  disabled={!data.state}
                  onValueChange={(v) => {
                    setData((prev) => ({ ...prev, city: v }));
                    if (errors.city)
                      setErrors((e) => ({ ...e, city: undefined }));
                  }}
                >
                  <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] px-8 border-none w-full py-12 text-[1.4rem] text-neutral-700 leading-8">
                    <SelectValue placeholder={t("second.cityPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-100 text-[1.4rem]">
                    <SelectGroup>
                      {citiesForState.map((city, i) => (
                        <SelectItem
                          className="text-[1.4rem] text-deep-100"
                          key={i}
                          value={city}
                        >
                          {city}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.city && <ErrorMessage message={errors.city} />}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 3 – Favorite categories (3–5) ───────────────────────────── */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: delta >= 0 ? "-50%" : "50%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col gap-10 h-full items-center justify-center"
          >
            <div className="flex flex-col items-center gap-2">
              <p className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
                {t("fourth.question")}
              </p>
              <span className="text-[1.3rem] text-neutral-400">
                {data.categories.length}/{CATEGORIES_MAX} {t("fourth.hint")}
              </span>
            </div>
            <ul className="flex gap-6 flex-wrap justify-center">
              {categoryList.map((cat) => {
                const isSelected = data.categories.includes(cat.value);
                const isDisabled =
                  !isSelected && data.categories.length >= CATEGORIES_MAX;
                return (
                  <li key={cat.value}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.value)}
                      disabled={isDisabled}
                      className={`border px-4 py-4 rounded-[9px] text-[1.6rem] leading-[2.2rem] cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? "border-primary-500 bg-primary-50 text-primary-600"
                          : isDisabled
                            ? "border-neutral-100 text-neutral-300 cursor-not-allowed"
                            : "border-neutral-100 text-deep-100 hover:border-neutral-300"
                      }`}
                    >
                      {cat.title}
                    </button>
                  </li>
                );
              })}
            </ul>
            {errors.categories && <ErrorMessage message={errors.categories} />}
          </motion.div>
        )}

        {/* ── Step 4 – Currency ─────────────────────────────────────────────── */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: delta >= 0 ? "-50%" : "50%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col gap-10 h-full items-center justify-center"
          >
            <p className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
              {t("sixth.question")}
            </p>
            <RadioGroup
              value={data.currency}
              onValueChange={(v) => setRadioField("currency", v)}
              className="flex flex-col gap-6 w-full"
            >
              <RadioRow value="HTG" label={t("sixth.htg")} />
              <Separator />
              <RadioRow value="USD" label={t("sixth.usd")} />
            </RadioGroup>
            {errors.currency && <ErrorMessage message={errors.currency} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation buttons ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-center w-full gap-4">
        {currentStep < TOTAL_STEPS && (
          <ButtonSecondary
            onClick={previous}
            disabled={isSubmitting}
            className="flex-1 w-full order-2 lg:order-1"
          >
            {t("previous")}
          </ButtonSecondary>
        )}

        {currentStep < TOTAL_STEPS ? (
          <ButtonPrimary onClick={next} className="w-full order-1 lg:order-2">
            {t("next")}
          </ButtonPrimary>
        ) : (
          <ButtonPrimary
            onClick={handleFinish}
            className="w-full order-1 lg:order-2 mb-4"
          >
            {t("finish")}
          </ButtonPrimary>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RadioRow({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[1.6rem] text-deep-100">{label}</span>
      <RadioGroupItem value={value} />
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-red-500 text-[1.3rem] leading-snug"
    >
      {message}
    </motion.p>
  );
}

function SetupLoader({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % messages.length),
      2400,
    );
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex items-end gap-[.6rem] h-8">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="block w-[.6rem] rounded-full bg-primary-500"
            animate={{ height: ["12px", "28px", "12px"] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="font-primary text-center text-[1.8rem] font-medium text-deep-100 leading-relaxed"
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
