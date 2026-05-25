"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { ButtonPrimary, ButtonSecondary } from "@/components/shared/buttons";
import { useRouter } from "@/i18n/navigation";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Options = {
  organisationTypes: string[];
  activitiesPerYear: string[];
  activityTypes: string[];
  businessTypes: string[];
  goals: string[];
};

type FetchState = "loading" | "ready" | "error";
type SubmitState = "idle" | "saving" | "success";

const TOTAL_STEPS = 6;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingOrganisationPageComponent() {
  const t = useTranslations("Auth.onboarding.organisations");
  const router = useRouter();
  const locale = useLocale();
  const { data: session, status: sessionStatus, update } = useSession();

  // ── Step navigation ────────────────────────────────────────────────────────
  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const delta = currentStep - previousStep;

  // ── API state ──────────────────────────────────────────────────────────────
  const [fetchState, setFetchState] = useState<FetchState>("loading");
  const [options, setOptions] = useState<Options | null>(null);
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const advancing = useRef(false);
  const initialized = useRef(false);

  // ── Form values ────────────────────────────────────────────────────────────
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [volume, setVolume] = useState("");
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [businessType, setBusinessType] = useState("");
  const [goal, setGoal] = useState("");
  const [actError, setActError] = useState(false);

  const token = session?.user?.accessToken;
  const sessionOrgId =
    session?.activeOrganisation?.organisationId ??
    (session?.user as { organisations?: { organisationId: string }[] })
      ?.organisations?.[0]?.organisationId;

  // ── Init: create org if needed, then load options ─────────────────────────

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) {
      setFetchState("error");
      return;
    }
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      let orgId = sessionOrgId;

      if (!orgId) {
        try {
          const createRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/onboarding/createOrganisation`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Accept-Language": locale,
                Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
              },
            },
          );
          const createData = await createRes.json();
          if (createData.status === "success") {
            await update({ activeOrganisation: createData.organisation });
            orgId = createData.organisation.organisationId as string;
          } else {
            setFetchState("error");
            return;
          }
        } catch {
          setFetchState("error");
          return;
        }
      }

      setResolvedOrgId(orgId!);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/organisations/${orgId}/onboarding`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Accept-Language": locale,
              Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
            },
          },
        );
        const d = res.ok ? await res.json() : null;
        if (!d?.options) {
          setFetchState("error");
          return;
        }
        setOptions(d.options);
        setOrgName(d.organisationName ?? "");
        const p = d.preferences ?? {};
        if (p.organisationType) setOrgType(p.organisationType);
        if (p.activitiesPerYear) setVolume(p.activitiesPerYear);
        if (p.activityTypes?.length) setActivityTypes(p.activityTypes);
        if (p.businessType) setBusinessType(p.businessType);
        if (p.goal) setGoal(p.goal);
        setFetchState("ready");
      } catch {
        setFetchState("error");
      }
    }

    init();
  }, [sessionStatus, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Per-step PUT (fire-and-forget) ─────────────────────────────────────────

  function put(payload: Record<string, unknown>) {
    if (!resolvedOrgId || !token) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${resolvedOrgId}/onboarding`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(payload),
      },
    ).catch(() => {});
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function goNext() {
    setPreviousStep(currentStep);
    setCurrentStep((s) => s + 1);
  }

  function previous() {
    if (currentStep > 1) {
      setPreviousStep(currentStep);
      setCurrentStep((s) => s - 1);
    } else {
      router.push("/auth/onboarding");
    }
  }

  async function autoAdvance(
    setter: (v: string) => void,
    value: string,
    payload: Record<string, unknown>,
  ) {
    if (advancing.current) return;
    advancing.current = true;
    setter(value);
    put(payload);
    await new Promise((r) => setTimeout(r, 120));
    goNext();
    advancing.current = false;
  }

  // ── Step handlers ──────────────────────────────────────────────────────────

  function handleStep1Continue() {
    put({ organisationName: orgName });
    if (orgName) {
      update({
        activeOrganisation: {
          ...session?.activeOrganisation,
          organisationName: orgName,
        },
      });
    }
    goNext();
  }

  function handleStep4Continue() {
    if (activityTypes.length === 0) {
      setActError(true);
      return;
    }
    put({ activityTypes });
    goNext();
  }

  async function handleFinish() {
    if (!goal || submitState !== "idle") return;
    setSubmitState("saving");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organisations/${resolvedOrgId}/onboarding`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "Accept-Language": locale,
            Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          },
          body: JSON.stringify({ goal }),
        },
      );
      const data = await res.json();
      if (data.status === "success") {
        setSubmitState("success");
        setTimeout(() => {
          window.location.href = `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/analytics`;
        }, 1800);
      } else {
        toast.error(t("error"));
        setSubmitState("idle");
      }
    } catch {
      toast.error(t("error"));
      setSubmitState("idle");
    }
  }

  // ── Progress ───────────────────────────────────────────────────────────────

  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100);

  // ── Loading / error gates ──────────────────────────────────────────────────

  if (fetchState === "loading") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingCircleSmall />
      </div>
    );
  }

  if (fetchState === "error" || !options) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6">
        <p className="text-[1.5rem] text-neutral-500 text-center">
          {t("error")}
        </p>
        <ButtonSecondary onClick={() => router.push("/auth/onboarding")}>
          {t("previous")}
        </ButtonSecondary>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex flex-col items-center justify-between h-full gap-8 py-12 relative">
      {/* Success overlay */}
      <AnimatePresence>
        {submitState === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center gap-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.1,
              }}
              className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-10 h-10"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12l5 5L19 7"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <h3 className="font-medium font-primary text-[2.8rem] text-black leading-tight">
                {t("success.title")}
              </h3>
              <p className="text-[1.5rem] text-neutral-500">
                {t("success.description")}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <LoadingCircleSmall />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between w-full">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="font-medium font-primary text-center text-[3.2rem] leading-tight text-black"
          >
            {t("setup")}
          </motion.h3>
        </div>
        <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary-500 rounded-full"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="w-full flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1 — Organisation name */}
          {currentStep === 1 && (
            <StepPanel key="step-1" delta={delta}>
              <StepQuestion
                question={t("steps.name.title")}
                hint={t("steps.name.description")}
              />
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={t("steps.name.placeholder")}
                autoFocus
                className="w-full border-2 border-neutral-200 rounded-[1.4rem] px-6 py-[1.4rem] text-[1.6rem] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 transition-colors bg-neutral-50 focus:bg-white"
              />
            </StepPanel>
          )}

          {/* Step 2 — Organisation type (auto-advance) */}
          {currentStep === 2 && (
            <StepPanel key="step-2" delta={delta}>
              <StepQuestion question={t("steps.type.title")} />
              <div className="flex flex-col gap-3">
                {options.organisationTypes.map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={orgType === opt}
                    onClick={() =>
                      autoAdvance(setOrgType, opt, { organisationType: opt })
                    }
                  />
                ))}
              </div>
            </StepPanel>
          )}

          {/* Step 3 — Activities per year (auto-advance) */}
          {currentStep === 3 && (
            <StepPanel key="step-3" delta={delta}>
              <StepQuestion
                question={t("steps.volume.title")}
                hint={t("steps.volume.description")}
              />
              <div className="grid grid-cols-2 gap-3">
                {options.activitiesPerYear.map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={volume === opt}
                    onClick={() =>
                      autoAdvance(setVolume, opt, { activitiesPerYear: opt })
                    }
                  />
                ))}
              </div>
            </StepPanel>
          )}

          {/* Step 4 — Activity types (multi-select) */}
          {currentStep === 4 && (
            <StepPanel key="step-4" delta={delta}>
              <StepQuestion
                question={t("steps.activities.title")}
                hint={t("steps.activities.description")}
              />
              <div className="flex flex-wrap gap-3">
                {options.activityTypes.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setActError(false);
                      setActivityTypes((prev) =>
                        prev.includes(opt)
                          ? prev.filter((v) => v !== opt)
                          : [...prev, opt],
                      );
                    }}
                    className={cn(
                      "px-5 py-3 rounded-full border-2 text-[1.4rem] font-medium transition-all duration-150",
                      activityTypes.includes(opt)
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <AnimatePresence>
                {actError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-[1.3rem]"
                  >
                    {t("steps.activities.error")}
                  </motion.p>
                )}
              </AnimatePresence>
            </StepPanel>
          )}

          {/* Step 5 — Business type (auto-advance) */}
          {currentStep === 5 && (
            <StepPanel key="step-5" delta={delta}>
              <StepQuestion question={t("steps.business.title")} />
              <div className="grid grid-cols-2 gap-3">
                {options.businessTypes.map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={businessType === opt}
                    onClick={() =>
                      autoAdvance(setBusinessType, opt, { businessType: opt })
                    }
                  />
                ))}
              </div>
            </StepPanel>
          )}

          {/* Step 6 — Goal (explicit Finish) */}
          {currentStep === 6 && (
            <StepPanel key="step-6" delta={delta}>
              <StepQuestion question={t("steps.goal.title")} />
              <div className="flex flex-col gap-3">
                {options.goals.map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={goal === opt}
                    onClick={() => setGoal(opt)}
                  />
                ))}
              </div>
            </StepPanel>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex flex-col lg:flex-row items-center w-full gap-4">
        {/* Step 1: Continue + Skip */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-3 w-full">
            <ButtonPrimary className="w-full" onClick={handleStep1Continue}>
              {t("next")}
            </ButtonPrimary>
            <button
              onClick={goNext}
              className="text-[1.3rem] text-neutral-400 hover:text-neutral-600 transition-colors py-2 text-center w-full"
            >
              {t("skip")}
            </button>
          </div>
        )}

        {/* Steps 2, 3, 5: Back only (cards auto-advance) */}
        {(currentStep === 2 || currentStep === 3 || currentStep === 5) && (
          <ButtonSecondary onClick={previous} className="w-full lg:w-auto">
            {t("previous")}
          </ButtonSecondary>
        )}

        {/* Step 4: Back + Continue */}
        {currentStep === 4 && (
          <>
            <ButtonSecondary
              onClick={previous}
              className="flex-1 w-full order-2 lg:order-1"
            >
              {t("previous")}
            </ButtonSecondary>
            <ButtonPrimary
              onClick={handleStep4Continue}
              className="w-full order-1 lg:order-2 lg:flex-1"
            >
              {t("next")}
            </ButtonPrimary>
          </>
        )}

        {/* Step 6: Back + Finish */}
        {currentStep === 6 && (
          <>
            <ButtonSecondary
              onClick={previous}
              disabled={submitState === "saving"}
              className="flex-1 w-full order-2 lg:order-1"
            >
              {t("previous")}
            </ButtonSecondary>
            <ButtonPrimary
              onClick={handleFinish}
              disabled={!goal || submitState === "saving"}
              className="w-full order-1 lg:order-2 lg:flex-1"
            >
              {submitState === "saving" ? (
                <span className="flex items-center justify-center gap-3">
                  <LoadingCircleSmall />
                  {t("finishing")}
                </span>
              ) : (
                t("finish")
              )}
            </ButtonPrimary>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepPanel({
  children,
  delta,
}: {
  children: React.ReactNode;
  delta: number;
}) {
  return (
    <motion.div
      initial={{ x: delta >= 0 ? "45%" : "-45%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: delta >= 0 ? "-45%" : "45%", opacity: 0 }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
      className="flex flex-col gap-8"
    >
      {children}
    </motion.div>
  );
}

function StepQuestion({ question, hint }: { question: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-semibold text-[1.8rem] leading-snug text-deep-100">
        {question}
      </p>
      {hint && (
        <p className="text-[1.4rem] text-neutral-500 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-5 py-[1.4rem] rounded-[1.4rem] border-2 transition-all duration-150 flex items-center justify-between gap-3 text-[1.5rem] font-medium",
        selected
          ? "border-primary-500 bg-primary-50 text-primary-700"
          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
      )}
    >
      <span className="flex-1 text-left">{label}</span>
      <span
        className={cn(
          "shrink-0 w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center transition-all duration-150",
          selected
            ? "border-primary-500 bg-primary-500"
            : "border-neutral-300 bg-white invisible",
        )}
      >
        <svg
          viewBox="0 0 10 8"
          className="w-[9px] h-[7px]"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 4l2.5 2.5L9 1"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
