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
  organisationType: string; // step 2
  services: string[]; // step 3
  team: string; // step 4
  referralSource: string; // step 5
}

type StepErrors = Partial<Record<keyof OnboardingData, string>>;

const TOTAL_STEPS = 5; // 5 question steps + 1 completion screen

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingOrganisationPageComponent() {
  const t = useTranslations("Auth.onboarding.organisations");
  const router = useRouter();
  const locale = useLocale();
  const { data: session, update } = useSession();
  function validateStep(step: number, data: OnboardingData): StepErrors {
    const errors: StepErrors = {};

    if (step === 1 && !data.organisationType) {
      errors.organisationType = t("errors.type");
    }
    if (step === 2 && data.services.length === 0) {
      errors.services = t("errors.service");
    }
    if (step === 3 && !data.team) {
      errors.team = t("errors.team");
    }
    if (step === 4 && !data.referralSource) {
      errors.referralSource = t("errors.referral");
    }

    return errors;
  }
  const serviceList = [
    { title: t("third.musics"), value: "musics" },
    { title: t("third.theater"), value: "theater" },
    { title: t("third.arts"), value: "arts" },
    { title: t("third.sports"), value: "sports" },
    { title: t("third.business"), value: "business" },
    { title: t("third.networking"), value: "networking" },
    { title: t("third.online"), value: "online" },
    { title: t("third.rentals"), value: "rentals" },
    { title: t("third.transport"), value: "transport" },
    { title: t("third.booking"), value: "booking" },
  ];

  // ── State ──────────────────────────────────────────────────────────────────

  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const delta = currentStep - previousStep;

  const [data, setData] = useState<OnboardingData>({
    organisationType: "",
    services: [],
    team: "",
    referralSource: "",
  });

  const [errors, setErrors] = useState<StepErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggleService(value: string) {
    setData((prev) => ({
      ...prev,
      services: prev.services.includes(value)
        ? prev.services.filter((s) => s !== value)
        : [...prev.services, value],
    }));
    if (errors.services) setErrors((e) => ({ ...e, services: undefined }));
  }

  function setRadioField<K extends keyof OnboardingData>(
    field: K,
    value: string,
  ) {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  //   function setTextField<K extends keyof OnboardingData>(
  //     field: K,
  //     value: string,
  //   ) {
  //     setData((prev) => ({ ...prev, [field]: value }));
  //     if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  //   }

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
    setIsSubmitting(true);
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/onboarding/organisation`,
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
      if (request.status === 200) {
        toast.info("You already own an organisation");
        router.push("/auth/login");
      }
      const response = await request.json();
      if (response.status === "success") {
        await update({
          activeOrganisation: {
            ...response.organisation,
            membershipTier: response.membershipTier,
          },
        });
        window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/analytics`;
      } else {
        toast.error("Failed to Create Organisation");
      }
    } catch (err) {
      toast.error(`Failed to save onboarding data: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Progress bar only tracks question steps 1–5 (not the completion screen)
  const progressPercent = Math.round(
    ((currentStep - 1) / (TOTAL_STEPS - 2)) * 100,
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col items-center justify-between  h-full gap-12 py-12">
      <div className="flex flex-col gap-4 w-full">
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-medium font-primary text-center text-[3.2rem] leading-14 text-black"
        >
          {t("setup")}
        </motion.h3>

        {currentStep < TOTAL_STEPS && (
          <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 2 – Organisation type */}
        {currentStep === 1 && (
          <motion.div
            key="step-2"
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: delta >= 0 ? "-50%" : "50%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col gap-10 h-full items-center justify-center"
          >
            <p className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
              {t("second.question")}
            </p>
            <RadioGroup
              value={data.organisationType}
              onValueChange={(v) => setRadioField("organisationType", v)}
              className="flex flex-col gap-6 w-full"
            >
              <RadioRow value="single" label={t("second.single")} />
              <Separator />
              <RadioRow value="agency" label={t("second.agency")} />
              <Separator />
              <RadioRow value="entreprise" label={t("second.entreprise")} />
            </RadioGroup>
            {errors.organisationType && (
              <ErrorMessage message={errors.organisationType} />
            )}
          </motion.div>
        )}

        {/* Step 3 – Services */}
        {currentStep === 2 && (
          <motion.div
            key="step-3"
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: delta >= 0 ? "-50%" : "50%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex flex-col gap-10 h-full items-center justify-center"
          >
            <p className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
              {t("third.question")}
            </p>
            <ul className="flex gap-6 flex-wrap">
              {serviceList.map((service) => (
                <li key={service.value}>
                  <button
                    type="button"
                    onClick={() => toggleService(service.value)}
                    className={`border px-4 py-4 rounded-[9px] text-[1.6rem] text-deep-100 leading-[2.2rem] cursor-pointer transition-all duration-300 ${
                      data.services.includes(service.value)
                        ? "border-primary-500 bg-primary-50 text-primary-600"
                        : "border-neutral-100 hover:border-neutral-300"
                    }`}
                  >
                    {service.title}
                  </button>
                </li>
              ))}
            </ul>
            {errors.services && <ErrorMessage message={errors.services} />}
          </motion.div>
        )}

        {/* Step 4 – Team size */}
        {currentStep === 3 && (
          <motion.div
            key="step-4"
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
              value={data.team}
              onValueChange={(v) => setRadioField("team", v)}
              className="flex flex-col gap-6 w-full"
            >
              <RadioRow value="solo" label={t("fourth.solo")} />
              <Separator />
              <RadioRow value="small" label={t("fourth.small")} />
              <Separator />
              <RadioRow value="large" label={t("fourth.large")} />
            </RadioGroup>
            {errors.team && <ErrorMessage message={errors.team} />}
          </motion.div>
        )}

        {/* Step 5 – Referral source */}
        {currentStep === 4 && (
          <motion.div
            key="step-5"
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
              value={data.referralSource}
              onValueChange={(v) => setRadioField("referralSource", v)}
              className="flex flex-col gap-6 w-full"
            >
              <RadioRow value="media" label={t("fifth.media")} />
              <Separator />
              <RadioRow value="friend" label={t("fifth.friend")} />
              <Separator />
              <RadioRow
                value="advertisement"
                label={t("fifth.advertisement")}
              />
            </RadioGroup>
            {errors.referralSource && (
              <ErrorMessage message={errors.referralSource} />
            )}
          </motion.div>
        )}

        {/* Step 6 – Completion */}
        {currentStep === 5 && (
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
              {t("last.4.1")}{" "}
              <Link
                className="text-primary-500"
                href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/legals`}
              >
                {t("last.4.2")}
              </Link>
              {t("last.4.3")}
              <Link
                className="text-primary-500"
                href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/contact`}
              >
                {t("last.4.4")}
              </Link>
              {t("last.4.5")}
              <Link
                className="text-primary-500"
                href={"mailto:support@ticketwaze.com"}
              >
                {t("last.4.6")}
              </Link>
            </motion.p>
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
            disabled={isSubmitting}
            className="w-full mb-4"
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("submit")}
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
