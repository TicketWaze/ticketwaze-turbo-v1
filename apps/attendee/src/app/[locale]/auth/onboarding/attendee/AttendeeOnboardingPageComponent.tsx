"use client";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Separator from "@/components/shared/Separator";
import { Link, useRouter } from "@/i18n/navigation";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  interests: string[]; // step 1
  groupSize: string; // step 2
  travelPreference: string; // step 3
  currency: string; // step 4
  referralSource: string; // step 5
}

type StepErrors = Partial<Record<keyof OnboardingData, string>>;

const TOTAL_STEPS = 6;
// ─── Component ────────────────────────────────────────────────────────────────

export default function AttendeeOnboardingPageComponent() {
  const t = useTranslations("Auth.onboarding");
  const router = useRouter();
  function validateStep(step: number, data: OnboardingData): StepErrors {
    const errors: StepErrors = {};

    if (step === 1 && data.interests.length === 0) {
      errors.interests = t("attendee.errors.interest");
    }
    if (step === 2 && !data.groupSize) {
      errors.groupSize = t("attendee.errors.groupSize");
    }
    if (step === 3 && !data.travelPreference) {
      errors.travelPreference = t("attendee.errors.travel");
    }
    if (step === 4 && !data.currency) {
      errors.currency = t("attendee.errors.currency");
    }
    if (step === 5 && !data.referralSource) {
      errors.referralSource = t("attendee.errors.referral");
    }

    return errors;
  }
  const interestList = [
    { title: t("second.musics"), value: "musics" },
    { title: t("second.theater"), value: "theater" },
    { title: t("second.arts"), value: "arts" },
    { title: t("second.sports"), value: "sports" },
    { title: t("second.business"), value: "business" },
    { title: t("second.networking"), value: "networking" },
    { title: t("second.online"), value: "online" },
    { title: t("second.rentals"), value: "rentals" },
    { title: t("second.transport"), value: "transport" },
    { title: t("second.booking"), value: "booking" },
  ];

  // ── State ──────────────────────────────────────────────────────────────────

  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const delta = currentStep - previousStep;
  const locale = useLocale();
  const { data: session, update } = useSession();

  const [data, setData] = useState<OnboardingData>({
    interests: [],
    groupSize: "",
    travelPreference: "",
    currency: "",
    referralSource: "",
  });

  const [errors, setErrors] = useState<StepErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggleInterest(value: string) {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((i) => i !== value)
        : [...prev.interests, value],
    }));
    // clear error as soon as user picks something
    if (errors.interests) setErrors((e) => ({ ...e, interests: undefined }));
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

    // Validate before advancing
    const stepErrors = validateStep(currentStep, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    // All clear
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
          body: JSON.stringify(data),
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        await update({
          ...session,
          user: {
            ...session?.user,
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col items-center justify-between gap-12 py-12">
      <div className="flex flex-col gap-4">
        {/* Title */}
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-medium font-primary text-center text-[3.2rem] leading-14 text-black"
        >
          {t("setup")}
        </motion.h3>

        {/* Progress bar */}
        <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* ── Step 1 – Interests ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
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
              {t("second.question")}
            </p>
            <ul className="flex gap-6 flex-wrap">
              {interestList.map((interest) => (
                <li key={interest.value}>
                  <button
                    type="button"
                    onClick={() => toggleInterest(interest.value)}
                    className={`border px-4 py-4 rounded-[9px] text-[1.6rem] text-deep-100 leading-[2.2rem] cursor-pointer transition-all duration-300 ${
                      data.interests.includes(interest.value)
                        ? "border-primary-500 bg-primary-50 text-primary-600"
                        : "border-neutral-100 hover:border-neutral-300"
                    }`}
                  >
                    {interest.title}
                  </button>
                </li>
              ))}
            </ul>
            {errors.interests && <ErrorMessage message={errors.interests} />}
          </motion.div>
        )}

        {/* ── Step 2 – Group size ──────────────────────────────────────────── */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: delta >= 0 ? "-50%" : "50%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col gap-10 h-full items-center justify-center"
          >
            <p className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
              {t("third.question")}
            </p>
            <RadioGroup
              value={data.groupSize}
              onValueChange={(v) => setRadioField("groupSize", v)}
              className="flex flex-col gap-6 w-full"
            >
              <RadioRow value="solo" label={t("third.solo")} />
              <Separator />
              <RadioRow value="small" label={t("third.small")} />
              <Separator />
              <RadioRow value="group" label={t("third.group")} />
            </RadioGroup>
            {errors.groupSize && <ErrorMessage message={errors.groupSize} />}
          </motion.div>
        )}

        {/* ── Step 3 – Travel preference ───────────────────────────────────── */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: delta >= 0 ? "-50%" : "50%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col gap-10 h-full items-center justify-center"
          >
            <p className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
              {t("fourth.question")}
            </p>
            <RadioGroup
              value={data.travelPreference}
              onValueChange={(v) => setRadioField("travelPreference", v)}
              className="flex flex-col gap-6 w-full"
            >
              <RadioRow value="local" label={t("fourth.local")} />
              <Separator />
              <RadioRow value="travel" label={t("fourth.travel")} />
              <Separator />
              <RadioRow value="everything" label={t("fourth.everything")} />
            </RadioGroup>
            {errors.travelPreference && (
              <ErrorMessage message={errors.travelPreference} />
            )}
          </motion.div>
        )}

        {/* ── Step 4 – Currency ────────────────────────────────────────────── */}
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
              {t("fifth.question")}
            </p>
            <RadioGroup
              value={data.currency}
              onValueChange={(v) => setRadioField("currency", v)}
              className="flex flex-col gap-6 w-full"
            >
              <RadioRow value="HTG" label={t("fifth.htg")} />
              <Separator />
              <RadioRow value="USD" label={t("fifth.usd")} />
            </RadioGroup>
            {errors.currency && <ErrorMessage message={errors.currency} />}
          </motion.div>
        )}

        {/* ── Step 5 – Referral source ─────────────────────────────────────── */}
        {currentStep === 5 && (
          <motion.div
            key="step-5"
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
              value={data.referralSource}
              onValueChange={(v) => setRadioField("referralSource", v)}
              className="flex flex-col gap-6 w-full"
            >
              <RadioRow value="media" label={t("sixth.media")} />
              <Separator />
              <RadioRow value="friend" label={t("sixth.friend")} />
              <Separator />
              <RadioRow
                value="advertisement"
                label={t("sixth.advertisement")}
              />
            </RadioGroup>
            {errors.referralSource && (
              <ErrorMessage message={errors.referralSource} />
            )}
          </motion.div>
        )}

        {/* ── Step 6 – Completion ──────────────────────────────────────────── */}
        {currentStep === 6 && (
          <motion.div
            key="step-6"
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: delta >= 0 ? "-50%" : "50%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col gap-4 h-full items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-primary text-center font-medium text-[1.5rem] leading-10 text-deep-100"
            >
              {t("last.1")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="font-primary text-center font-medium text-[1.5rem] leading-10 text-deep-100"
            >
              {t("last.2")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="font-primary text-center font-medium text-[1.5rem] leading-10 text-deep-100"
            >
              {t("last.3.1")}{" "}
              <Link
                className="text-primary-500"
                href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/legals`}
              >
                {t("last.3.2")}
              </Link>
              {t("last.3.3")}
              <Link
                className="text-primary-500"
                href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/contact`}
              >
                {t("last.3.4")}
              </Link>
              {t("last.3.5")}
              <Link
                className="text-primary-500"
                href={"mailto:support@ticketwaze.com"}
              >
                {t("last.3.6")}
              </Link>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation buttons ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-center w-full gap-4">
        {currentStep < 6 && (
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
            disabled={isSubmitting}
            className="w-full order-1 lg:order-2"
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("finish")}
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
