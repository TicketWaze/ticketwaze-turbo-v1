"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft2,
  InfoCircle,
  MoneyRecive,
  TickCircle,
} from "iconsax-reactjs";
import { AnimatePresence, motion } from "motion/react";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import BackButton from "@/components/shared/BackButton";
import { Organisation } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import Image from "next/image";
import moncashIcon from "@/assets/images/moncash-icon.svg";
import wiseIcon from "@/assets/images/wise-icon.svg";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  BankWithdrawalRequest,
  ResolveWiseRecipient,
  UpdateOrganisationBankPaymentInformation,
  UpdateOrganisationMoncashPaymentInformation,
} from "@/actions/organisationActions";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/shared/Inputs";

/** The screens this wizard can show. Which apply depends on the payout method. */
type StepKey = "summary" | "method" | "amount" | "details" | "pin";

/* ─── Animation helpers ──────────────────────────────────────────── */

const slideVariants = {
  enter: (d: number) => ({
    x: d >= 0 ? "55%" : "-55%",
    opacity: 0,
    scale: 0.97,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (d: number) => ({
    x: d >= 0 ? "-55%" : "55%",
    opacity: 0,
    scale: 0.97,
  }),
};

const slideTransition = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
};

/* ─── Desktop stepper ────────────────────────────────────────────── */

function Stepper({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="flex flex-col items-center gap-[6px]">
      <div className="flex items-center">
        {labels.map((_, i) => (
          <div key={i} className="flex items-center">
            <motion.div
              layout
              animate={{
                backgroundColor: i <= current ? "#e45b00" : "#f1f2f3",
                scale: i === current ? 1.18 : 1,
              }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0"
            >
              <AnimatePresence mode="wait">
                {i < current ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 22 }}
                  >
                    <TickCircle size="15" color="#fff" variant="Bold" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="num"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`text-[1rem] font-bold leading-none ${i <= current ? "text-white" : "text-neutral-400"}`}
                  >
                    {i + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>

            {i < labels.length - 1 && (
              <div className="relative w-10 h-[2px] bg-neutral-100 rounded-full mx-[6px] overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary-500 rounded-full"
                  animate={{ width: i < current ? "100%" : "0%" }}
                  transition={{
                    duration: 0.38,
                    ease: "easeInOut",
                    delay: 0.08,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.18 }}
          className="text-[1.15rem] text-primary-500 font-semibold tracking-wide"
        >
          {labels[current]}
        </motion.span>
      </AnimatePresence> */}
    </div>
  );
}

/* ─── Animated checkbox ──────────────────────────────────────────── */

function AnimatedCheckbox({ checked }: { checked: boolean }) {
  return (
    <motion.div
      animate={{
        backgroundColor: checked ? "#e45b00" : "transparent",
        borderColor: checked ? "#e45b00" : "#c7cbd0",
      }}
      transition={{ duration: 0.18 }}
      className="w-[20px] h-[20px] rounded-[5px] border-2 flex items-center justify-center shrink-0 mt-[2px]"
    >
      <AnimatePresence>
        {checked && (
          <motion.svg
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 26 }}
            width="11"
            height="8"
            viewBox="0 0 11 8"
            fill="none"
          >
            <path
              d="M1 4L4 7L10 1"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */

export default function InitiateWithdrawalPageWrapper({
  organisation,
  /**
   * False on an environment with no Wise credentials, where the method is not
   * offered at all. Better than presenting it and failing at Verify with an
   * error the organiser would read as their own mistake.
   */
  wiseAvailable,
}: {
  organisation: Organisation;
  wiseAvailable: boolean;
}) {
  const t = useTranslations("Finance");
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();

  // Detect if the saved profile data belongs to MonCash (stored with moncashAccountName)
  const hasSavedMoncash = !!organisation.moncashAccountName;
  const hasSavedBank = !!(
    organisation.bankName &&
    organisation.bankAccountName &&
    organisation.bankAccountNumber
  );

  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [accountType, setAccountType] = useState<
    "bank" | "moncash" | "wise" | null
  >(null);
  const [bankCurrency, setBankCurrency] = useState<"HTG" | "USD">("HTG");

  /* Wise state.
     The Wisetag is NOT read from the organisation and never saved back to it:
     a payout destination that is entered once and reused silently sends every
     future payout to the wrong place if it is ever wrong. It is stated fresh
     each time, and re-resolved server-side before the request is taken. */
  const [wiseRecipientValue, setWiseRecipientValue] = useState("");
  /** The name Wise reported. Non-null only while it matches the typed value. */
  const [wiseResolvedName, setWiseResolvedName] = useState<string | null>(null);
  const [isVerifyingWise, setIsVerifyingWise] = useState(false);
  /** The organiser has read the name and said it is theirs. */
  const [wiseNameConfirmed, setWiseNameConfirmed] = useState(false);

  // Bank state
  const [bankName, setBankName] = useState(organisation.bankName ?? "");
  const [bankAccountName, setBankAccountName] = useState(
    organisation.bankAccountName ?? "",
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    organisation.bankAccountNumber ?? "",
  );
  const [saveBankInfo, setSaveBankInfo] = useState(hasSavedBank);

  // Moncash state
  const [moncashAccountName, setMoncashAccountName] = useState(
    organisation.moncashAccountName ?? "",
  );
  const [moncashNumber, setMoncashNumber] = useState(
    organisation.moncashNumber ?? "",
  );
  const [saveMoncashInfo, setSaveMoncashInfo] = useState(
    hasSavedMoncash || !!organisation.moncashNumber,
  );

  // PIN state
  const [pin, setPin] = useState("");
  const [pinConfirmation, setPinConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const delta = currentStep - previousStep;

  // Summary step uses the org's default display currency
  const currency = session?.activeOrganisation?.currency ?? "HTG";
  const availableBalance =
    currency === "HTG"
      ? organisation.availableBalance
      : organisation.usdAvailableBalance;

  // Amount step: bank uses the selected currency, moncash is always HTG, and
  // Wise is always USD — a Wise payout is USD on both sides by design.
  const activeCurrency: "HTG" | "USD" =
    accountType === "moncash"
      ? "HTG"
      : accountType === "wise"
        ? "USD"
        : bankCurrency;
  const activeCurrencyBalance =
    activeCurrency === "HTG"
      ? organisation.availableBalance
      : organisation.usdAvailableBalance;

  /**
   * The wizard's steps, as data rather than as hardcoded indices.
   *
   * Wise skips the amount step entirely: there is nothing to decide there. The
   * currency is fixed to USD, the amount is always the full available balance,
   * and both are already stated on the summary — so for Wise that screen asked
   * a question with no answer and made the flow a step longer than it is.
   *
   * Deriving the list means the stepper, the mobile dots, the "last step" check
   * and every validation follow from one place. With indices written by hand in
   * a dozen spots, removing a step for one method silently desynchronised them.
   */
  const steps: StepKey[] =
    accountType === "wise"
      ? ["summary", "method", "details", "pin"]
      : ["summary", "method", "amount", "details", "pin"];
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const detailsLabel =
    accountType === "moncash"
      ? t("moncash_details")
      : accountType === "wise"
        ? t("wise_details")
        : t("bank_details");
  const stepLabels = steps.map((key) =>
    key === "summary"
      ? t("summary")
      : key === "method"
        ? t("payment_method")
        : key === "amount"
          ? t("amount")
          : key === "details"
            ? detailsLabel
            : t("security"),
  );

  /* ── Wise verification ───────────────────────────────────────── */

  /**
   * Any edit invalidates a previous verification. Without this, an organiser
   * could verify one Wisetag, change a character, and carry the confirmed name
   * of a different account through to the request.
   */
  function updateWiseIdentifier(value: string) {
    setWiseRecipientValue(value);
    setWiseResolvedName(null);
    setWiseNameConfirmed(false);
  }

  async function handleVerifyWise() {
    if (!wiseRecipientValue.trim()) {
      toast.error(t("errors.wise_identifier_required"));
      return;
    }
    setIsVerifyingWise(true);
    const result = await ResolveWiseRecipient(
      organisation.organisationId,
      session?.user.accessToken ?? "",
      locale,
      { wiseRecipientValue: wiseRecipientValue.trim() },
    );
    if (result.status === "success" && result.name) {
      setWiseResolvedName(result.name);
      setWiseNameConfirmed(false);
    } else {
      setWiseResolvedName(null);
      // The API answers with a stable code so the copy can be localised here.
      // `wise_unresolved` is by far the most common, and almost always means a
      // typo or a profile that is not discoverable — so it says both.
      const code = (result as { error?: string }).error ?? "wise_error";
      const messages: Record<string, string> = {
        wise_unresolved: t("errors.wise_unresolved"),
        // Not a spelling problem — telling someone to check discoverability
        // when they typed their own Wisetag just wastes their time.
        wise_self: t("errors.wise_self"),
        wise_invalid_identifier: t("errors.wise_invalid_identifier"),
        wise_no_name: t("errors.wise_no_name"),
        wise_unavailable: t("errors.wise_unavailable"),
      };
      toast.error(messages[code] ?? t("errors.wise_error"));
    }
    setIsVerifyingWise(false);
  }

  /* ── Submission ──────────────────────────────────────────────── */

  async function handleWithdrawal() {
    setIsLoading(true);
    try {
      const accountName =
        accountType === "bank" ? bankAccountName : moncashAccountName;
      const accountNumber =
        accountType === "bank" ? bankAccountNumber : moncashNumber;

      // Optionally persist account details to profile
      if (accountType === "bank" && saveBankInfo) {
        await UpdateOrganisationBankPaymentInformation(
          organisation.organisationId,
          { bankName, bankAccountName, bankAccountNumber },
          session?.user.accessToken ?? "",
          locale,
        );
      }
      if (accountType === "moncash" && saveMoncashInfo) {
        await UpdateOrganisationMoncashPaymentInformation(
          organisation.organisationId,
          {
            moncashAccountName: moncashAccountName,
            moncashNumber: moncashNumber,
          },
          session?.user.accessToken ?? "",
          locale,
        );
      }

      const result = await BankWithdrawalRequest(
        organisation.organisationId,
        session?.user.accessToken ?? "",
        locale,
        accountType === "wise"
          ? {
              accountType,
              pin,
              pin_confirmation: pinConfirmation,
              // No accountName/accountNumber: the account name is whatever Wise
              // reports for the Wisetag, resolved again server-side. Sending a
              // name from here would let the client state one Wise never
              // confirmed, which is what the Verify step exists to prevent.
              // No type either — a Wisetag is the only thing accepted.
              wiseRecipientValue: wiseRecipientValue.trim(),
              currency: "USD",
            }
          : {
              accountType,
              pin,
              pin_confirmation: pinConfirmation,
              accountName,
              accountNumber,
              // No amount — the full available balance is withdrawn. MonCash is
              // always HTG; bank uses the chosen currency.
              currency: activeCurrency,
              bankName: accountType === "bank" ? bankName : "Moncash",
            },
      );

      if (result.status === "success") {
        toast.success(t("withdrawSuccess"));
        router.push("/finance");
        return;
      }

      /**
       * The API answers with stable codes, not sentences. Rendering one raw
       * showed organisers the literal word "insufficient" — map every code we
       * know, and only fall back for one we do not.
       */
      const code = (result as { error?: string }).error ?? "";
      const messages: Record<string, string> = {
        pin: t("errors.incorrectPin"),
        Unauthorized: t("errors.Unauthorized"),
        insufficient: t("errors.insufficient"),
        pending_exists: t("errors.pending_exists"),
        wise_unresolved: t("errors.wise_unresolved"),
        wise_self: t("errors.wise_self"),
        wise_invalid_identifier: t("errors.wise_invalid_identifier"),
        wise_no_name: t("errors.wise_no_name"),
        wise_unavailable: t("errors.wise_unavailable"),
        wise_error: t("errors.wise_error"),
      };

      if (code === "pin") {
        setPin("");
        setPinConfirmation("");
      }
      toast.error(messages[code] ?? t("errors.insufficient"));
    } finally {
      setIsLoading(false);
    }
  }

  /* ── Navigation ──────────────────────────────────────────────── */

  const go = (next: number) => {
    setPreviousStep(currentStep);
    setCurrentStep(next);
  };

  const next = async () => {
    if (step === "method") {
      if (!accountType) {
        toast.error(t("accountTypeError"));
        return;
      }
      /**
       * Wise has no amount step to catch an empty balance, so it is checked on
       * the way out of here instead. Its currency is fixed, so there is nothing
       * later that could change which balance applies.
       */
      if (accountType === "wise" && organisation.usdAvailableBalance <= 0) {
        toast.error(t("errors.insufficient"));
        return;
      }
      go(currentStep + 1);
      return;
    }

    if (step === "amount") {
      if (activeCurrencyBalance <= 0) {
        toast.error(t("errors.insufficient"));
        return;
      }
      go(currentStep + 1);
      return;
    }

    if (step === "details") {
      if (accountType === "wise") {
        if (!wiseRecipientValue.trim()) {
          toast.error(t("errors.wise_identifier_required"));
          return;
        }
        // Both checkpoints are required before the request can be made: Wise
        // has to have resolved the identifier, and the organiser has to have
        // read the resulting name and said it is theirs.
        if (!wiseResolvedName) {
          toast.error(t("errors.wise_not_verified"));
          return;
        }
        if (!wiseNameConfirmed) {
          toast.error(t("errors.wise_name_not_confirmed"));
          return;
        }
        go(currentStep + 1);
        return;
      }
      if (accountType === "bank") {
        if (!bankName.trim()) {
          toast.error(t("errors.bank_name"));
          return;
        }
        if (!bankAccountName.trim()) {
          toast.error(t("errors.bank_account_name"));
          return;
        }
        if (!bankAccountNumber.trim()) {
          toast.error(t("errors.bank_account_number"));
          return;
        }
      } else {
        if (!moncashAccountName.trim()) {
          toast.error(t("errors.moncash_account_name"));
          return;
        }
        if (!moncashNumber.trim()) {
          toast.error(t("errors.moncash_number"));
          return;
        }
        if (!/^\d{8}$/.test(moncashNumber.trim())) {
          toast.error(t("errors.moncash_number_invalid"));
          return;
        }
      }
      go(currentStep + 1);
      return;
    }

    if (step === "pin") {
      if (!pin || pin.length !== 4) {
        toast.error(t("errors.noPin"));
        return;
      }
      if (!pinConfirmation || pinConfirmation.length !== 4) {
        toast.error(t("errors.noPinConfirmation"));
        return;
      }
      if (pin !== pinConfirmation) {
        toast.error(t("errors.pinNotSame"));
        setPinConfirmation("");
        return;
      }
      await handleWithdrawal();
      return;
    }

    go(currentStep + 1);
  };

  const prev = () => {
    if (currentStep > 0) {
      setPreviousStep(currentStep);
      setCurrentStep((s) => s - 1);
    }
  };

  const proceedLabel = isLastStep ? t("withdraw") : t("proceed");

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <>
      <PageLoader isLoading={isLoading} />
      <div className="relative flex flex-col gap-6 h-full w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center w-full justify-between gap-4 py-4">
          {currentStep === 0 ? (
            <>
              <BackButton text={t("back")} />
              <div className="hidden lg:flex flex-1 items-center justify-end">
                <Stepper labels={stepLabels} current={currentStep} />
              </div>
            </>
          ) : (
            <>
              <button
                onClick={prev}
                className="flex cursor-pointer items-center gap-3 shrink-0"
              >
                <div className="w-[35px] h-[35px] rounded-full bg-neutral-100 flex items-center justify-center">
                  <ArrowLeft2 size="20" color="#0d0d0d" variant="Bulk" />
                </div>
                <span className="hidden sm:inline text-neutral-700 font-normal text-[1.4rem] leading-8">
                  {t("back")}
                </span>
              </button>
              <div className="hidden lg:flex flex-1 items-center justify-end">
                <Stepper labels={stepLabels} current={currentStep} />
              </div>
            </>
          )}
        </div>

        {/* Mobile pill dots */}
        <div className="lg:hidden flex items-center justify-center gap-[6px] py-1">
          {stepLabels.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                backgroundColor: i <= currentStep ? "#e45b00" : "#f1f2f3",
                width: i === currentStep ? 28 : 8,
              }}
              transition={{ duration: 0.3 }}
              className="h-[8px] rounded-full"
            />
          ))}
        </div>

        {/* Steps */}
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden pb-44 lg:pb-44">
          <AnimatePresence mode="wait" custom={delta}>
            {/* ── Step 0: Summary ─────────────────────────────── */}
            {step === "summary" && (
              <motion.div
                key="summary"
                custom={delta}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="flex flex-col gap-10"
              >
                <div className="flex flex-col border border-neutral-100 rounded-[14px] overflow-hidden gap-6 items-center w-full p-6 lg:w-212 mx-auto">
                  <div className="py-10 flex flex-col items-center w-full gap-3 bg-neutral-100 rounded-[16px]">
                    <span className="font-semibold text-[1.4rem] leading-8 text-neutral-600">
                      {t("amounts.availableBalance")}
                    </span>
                    <p className="font-primary font-bold text-[4.5rem] leading-[50px] text-black">
                      {availableBalance}
                      <span className="text-neutral-400 text-[3rem]">
                        {" "}
                        {currency}
                      </span>
                    </p>
                  </div>
                  <span className="text-[1.3rem] leading-8 text-neutral-500 self-start">
                    {t("breakdown")}
                  </span>
                  <div className="w-full flex flex-col gap-5">
                    <div className="w-full flex items-center justify-between">
                      <span className="text-[1.4rem] leading-8 text-neutral-500">
                        {t("amounts.pendingBalance")}
                      </span>
                      <span className="text-[1.4rem] leading-8 font-medium text-deep-100">
                        {currency === "HTG"
                          ? organisation.pendingBalance
                          : organisation.usdPendingBalance}{" "}
                        <span className="text-neutral-400 text-[1.2rem]">
                          {currency}
                        </span>
                      </span>
                    </div>
                    <div className="w-full flex items-center justify-between">
                      <span className="text-[1.4rem] leading-8 text-neutral-500">
                        {t("amounts.availableBalance")}
                      </span>
                      <span className="text-[1.4rem] leading-8 font-medium text-success">
                        {availableBalance}{" "}
                        <span className="text-neutral-400 text-[1.2rem]">
                          {currency}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex lg:w-212 mx-auto items-start gap-3 p-4 rounded-[12px] border border-amber-200 bg-amber-50 text-[1.3rem] leading-7 text-amber-800">
                  <div className="shrink-0 mt-[2px]">
                    <InfoCircle size="18" color="#b45309" />
                  </div>
                  <span>{t("pendingAlert")}</span>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Payment method ───────────────────────── */}
            {step === "method" && (
              <motion.div
                key="payment-method"
                custom={delta}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="flex flex-col gap-8 lg:w-212 mx-auto w-full"
              >
                <div className="flex flex-col gap-2">
                  <h2 className="font-semibold text-[1.9rem] leading-[2.6rem] text-deep-100">
                    {t("payment_method")}
                  </h2>
                  <p className="text-[1.4rem] leading-7 text-neutral-500">
                    {t("payment_method_hint")}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Bank */}
                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setAccountType("bank")}
                    className={`flex items-center w-full justify-between cursor-pointer p-5 rounded-[16px] border-2 transition-colors duration-200 ${
                      accountType === "bank"
                        ? "border-primary-500 bg-primary-50"
                        : "border-neutral-100 hover:border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-[46px] h-[46px] rounded-[12px] flex items-center justify-center transition-colors duration-200 ${accountType === "bank" ? "bg-primary-100" : "bg-neutral-100"}`}
                      >
                        <MoneyRecive
                          size="22"
                          color={accountType === "bank" ? "#e45b00" : "#737c8a"}
                          variant="Bulk"
                        />
                      </div>
                      <div className="flex flex-col items-start gap-[3px]">
                        <span className="font-semibold text-[1.5rem] leading-6 text-deep-100">
                          {t("bank")}
                        </span>
                        <span className="text-[1.2rem] leading-5 text-neutral-500">
                          {t("bank_hint")}
                        </span>
                      </div>
                    </div>
                    <motion.div
                      animate={{
                        scale: accountType === "bank" ? 1 : 0.4,
                        opacity: accountType === "bank" ? 1 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 22,
                      }}
                      className="w-[22px] h-[22px] rounded-full bg-primary-500 flex items-center justify-center shrink-0"
                    >
                      <TickCircle size="14" color="#fff" variant="Bold" />
                    </motion.div>
                  </motion.button>

                  {/* Moncash */}
                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    onClick={() => setAccountType("moncash")}
                    className={`flex items-center w-full justify-between cursor-pointer p-5 rounded-[16px] border-2 transition-colors duration-200 ${
                      accountType === "moncash"
                        ? "border-primary-500 bg-primary-50"
                        : "border-neutral-100 hover:border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-[46px] h-[46px] rounded-[12px] flex items-center justify-center transition-colors duration-200 ${accountType === "moncash" ? "bg-primary-100" : "bg-neutral-100"}`}
                      >
                        <Image src={moncashIcon} width={26} alt="MonCash" />
                      </div>
                      <div className="flex flex-col items-start gap-[3px]">
                        <span className="font-semibold text-[1.5rem] leading-6 text-deep-100">
                          {t("moncash")}
                        </span>
                        <span className="text-[1.2rem] leading-5 text-neutral-500">
                          {t("moncash_hint")}
                        </span>
                      </div>
                    </div>
                    <motion.div
                      animate={{
                        scale: accountType === "moncash" ? 1 : 0.4,
                        opacity: accountType === "moncash" ? 1 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 22,
                      }}
                      className="w-[22px] h-[22px] rounded-full bg-primary-500 flex items-center justify-center shrink-0"
                    >
                      <TickCircle size="14" color="#fff" variant="Bold" />
                    </motion.div>
                  </motion.button>

                  {/* Wise. Only where the environment has credentials for it. */}
                  {wiseAvailable && (
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setAccountType("wise")}
                      className={`flex items-center w-full justify-between cursor-pointer p-5 rounded-[16px] border-2 transition-colors duration-200 ${
                        accountType === "wise"
                          ? "border-primary-500 bg-primary-50"
                          : "border-neutral-100 hover:border-neutral-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-[46px] h-[46px] rounded-[12px] flex items-center justify-center transition-colors duration-200 ${accountType === "wise" ? "bg-primary-100" : "bg-neutral-100"}`}
                        >
                          <Image src={wiseIcon} width={26} alt="Wise" />
                        </div>
                        <div className="flex flex-col items-start gap-[3px]">
                          <span className="font-semibold text-[1.5rem] leading-6 text-deep-100">
                            {t("wise")}
                          </span>
                          <span className="text-[1.2rem] leading-5 text-neutral-500">
                            {t("wise_hint")}
                          </span>
                        </div>
                      </div>
                      <motion.div
                        animate={{
                          scale: accountType === "wise" ? 1 : 0.4,
                          opacity: accountType === "wise" ? 1 : 0,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 22,
                        }}
                        className="w-[22px] h-[22px] rounded-full bg-primary-500 flex items-center justify-center shrink-0"
                      >
                        <TickCircle size="14" color="#fff" variant="Bold" />
                      </motion.div>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Amount ───────────────────────────────── */}
            {step === "amount" && (
              <motion.div
                key="amount"
                custom={delta}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="flex flex-col gap-8 lg:w-212 mx-auto w-full"
              >
                <div className="flex flex-col gap-2">
                  <h2 className="font-semibold text-[1.9rem] leading-[2.6rem] text-deep-100">
                    {t("amount")}
                  </h2>
                  <p className="text-[1.4rem] leading-7 text-neutral-500">
                    {t("amount_hint")}
                  </p>
                </div>

                {/* Currency choice – bank only (MonCash is always HTG) */}
                {accountType === "bank" && (
                  <div className="flex gap-1 p-1 bg-neutral-100 rounded-[12px]">
                    {(["HTG", "USD"] as const).map((curr) => (
                      <motion.button
                        key={curr}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setBankCurrency(curr)}
                        animate={{
                          backgroundColor:
                            bankCurrency === curr ? "#e45b00" : "transparent",
                          color: bankCurrency === curr ? "#ffffff" : "#8f96a1",
                        }}
                        transition={{ duration: 0.18 }}
                        className="flex-1 py-[10px] rounded-[10px] text-[1.35rem] font-semibold"
                      >
                        {curr}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Full available balance that will be withdrawn */}
                <div className="flex flex-col items-center gap-2 py-10 rounded-[16px] bg-neutral-100">
                  <span className="font-semibold text-[1.4rem] leading-8 text-neutral-600">
                    {t("amounts.availableBalance")}
                  </span>
                  <p className="font-primary font-bold text-[4.5rem] leading-[50px] text-black">
                    {activeCurrencyBalance}
                    <span className="text-neutral-400 text-[3rem]">
                      {" "}
                      {activeCurrency}
                    </span>
                  </p>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-[12px] border border-amber-200 bg-amber-50 text-[1.3rem] leading-7 text-amber-800">
                  <div className="shrink-0 mt-[2px]">
                    <InfoCircle size="18" color="#b45309" />
                  </div>
                  <span>{t("withdraw_all_note")}</span>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Account details ──────────────────────── */}
            {step === "details" && (
              <motion.div
                key="account-details"
                custom={delta}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="flex flex-col gap-8 lg:w-212 mx-auto w-full"
              >
                {accountType === "wise" ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <h2 className="font-semibold text-[1.9rem] leading-[2.6rem] text-deep-100">
                        {t("wise_details")}
                      </h2>
                      <p className="text-[1.4rem] leading-7 text-neutral-500">
                        {t("wise_details_hint")}
                      </p>
                    </div>

                    <div className="border border-neutral-100 rounded-[16px] p-6 flex flex-col gap-8">
                      {/* Wisetag only. Wise's endpoint also takes an email or a
                          phone number, but a Wisetag is the only identifier
                          somebody picks deliberately for being paid. */}
                      <div className="flex flex-col gap-2">
                        <Input
                          value={wiseRecipientValue}
                          onChange={(e) => updateWiseIdentifier(e.target.value)}
                          type="text"
                          placeholder="@wisetag"
                        >
                          {t("wise_value_label")}
                        </Input>
                        <p className="flex items-center gap-[6px] text-[1.2rem] leading-5 text-neutral-400 px-1">
                          <InfoCircle size="14" color="#9ca3af" />
                          {t("wise_discoverable_hint")}
                        </p>
                      </div>

                      {/* Verify. Resolving here rather than at submission means
                          a typo is a corrected field, not a rejected request. */}
                      <ButtonPrimary
                        onClick={handleVerifyWise}
                        disabled={
                          isVerifyingWise ||
                          !wiseRecipientValue.trim() ||
                          Boolean(wiseResolvedName)
                        }
                        className="w-full"
                      >
                        {isVerifyingWise ? (
                          <LoadingCircleSmall />
                        ) : wiseResolvedName ? (
                          t("wise_verified")
                        ) : (
                          t("wise_verify")
                        )}
                      </ButtonPrimary>
                    </div>

                    {/* The name Wise returned, and the organiser confirming it.
                        This is the first of two human checkpoints — the admin
                        sees the same name again before the money goes. Nothing
                        in the code can catch an identifier that resolves to the
                        wrong real person; only someone reading this can. */}
                    {wiseResolvedName && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                        className="flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-[6px] p-6 rounded-[16px] bg-neutral-100">
                          <span className="text-[1.2rem] leading-5 text-neutral-500 uppercase font-medium tracking-wide">
                            {t("wise_resolved_name_label")}
                          </span>
                          <span className="font-semibold text-[2rem] leading-8 text-deep-100 wrap-break-word">
                            {wiseResolvedName}
                          </span>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.985 }}
                          onClick={() => setWiseNameConfirmed((v) => !v)}
                          className={`flex items-start gap-4 p-5 rounded-[14px] border-2 w-full text-left transition-colors duration-200 ${
                            wiseNameConfirmed
                              ? "border-primary-500 bg-primary-50"
                              : "border-neutral-100 hover:border-neutral-200"
                          }`}
                        >
                          <AnimatedCheckbox checked={wiseNameConfirmed} />
                          <div className="flex flex-col gap-[4px]">
                            <span className="font-semibold text-[1.4rem] leading-6 text-deep-100">
                              {t("wise_confirm_name")}
                            </span>
                            <span className="text-[1.2rem] leading-5 text-neutral-500">
                              {t("wise_confirm_name_hint")}
                            </span>
                          </div>
                        </motion.button>
                      </motion.div>
                    )}

                    {/* Approval is a real gate, not a formality — say so, so
                        nobody expects the money to arrive the moment they
                        finish this form. */}
                    <div className="flex items-start gap-3 p-4 rounded-[12px] border border-neutral-200 bg-neutral-50 text-[1.3rem] leading-7 text-neutral-600">
                      <div className="shrink-0 mt-[2px]">
                        <InfoCircle size="18" color="#737c8a" />
                      </div>
                      <span>{t("wise_review_note")}</span>
                    </div>
                  </>
                ) : accountType === "bank" ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <h2 className="font-semibold text-[1.9rem] leading-[2.6rem] text-deep-100">
                        {t("bank_details")}
                      </h2>
                      <p className="text-[1.4rem] leading-7 text-neutral-500">
                        {t("bank_details_hint")}
                      </p>
                    </div>
                    <div className="border border-neutral-100 rounded-[16px] p-6 flex flex-col gap-8">
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        type="text"
                      >
                        {t("bank_name")}
                      </Input>
                      <Input
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                        type="text"
                      >
                        {t("bank_account_name")}
                      </Input>
                      <Input
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        type="text"
                      >
                        {t("bank_account_number")}
                      </Input>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setSaveBankInfo((v) => !v)}
                      className={`flex items-start gap-4 p-5 rounded-[14px] border-2 w-full text-left transition-colors duration-200 ${
                        saveBankInfo
                          ? "border-primary-500 bg-primary-50"
                          : "border-neutral-100 hover:border-neutral-200"
                      }`}
                    >
                      <AnimatedCheckbox checked={saveBankInfo} />
                      <div className="flex flex-col gap-[4px]">
                        <span className="font-semibold text-[1.4rem] leading-6 text-deep-100">
                          {t("saveBankInfo")}
                        </span>
                        <span className="text-[1.2rem] leading-5 text-neutral-500">
                          {t("saveBankInfo_hint")}
                        </span>
                      </div>
                    </motion.button>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <h2 className="font-semibold text-[1.9rem] leading-[2.6rem] text-deep-100">
                        {t("moncash_details")}
                      </h2>
                      <p className="text-[1.4rem] leading-7 text-neutral-500">
                        {t("moncash_details_hint")}
                      </p>
                    </div>
                    <div className="border border-neutral-100 rounded-[16px] p-6 flex flex-col gap-8">
                      <Input
                        value={moncashAccountName}
                        onChange={(e) => setMoncashAccountName(e.target.value)}
                        type="text"
                      >
                        {t("moncash_account_name")}
                      </Input>
                      <div className="flex flex-col gap-2">
                        <Input
                          value={moncashNumber}
                          onChange={(e) => {
                            const val = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 8);
                            setMoncashNumber(val);
                          }}
                          type="tel"
                          inputMode="numeric"
                          maxLength={8}
                        >
                          {t("moncash_number")}
                        </Input>
                        <p className="flex items-center gap-[6px] text-[1.2rem] leading-5 text-neutral-400 px-1">
                          <InfoCircle size="14" color="#9ca3af" />
                          {t("moncash_number_hint")}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setSaveMoncashInfo((v) => !v)}
                      className={`flex items-start gap-4 p-5 rounded-[14px] border-2 w-full text-left transition-colors duration-200 ${
                        saveMoncashInfo
                          ? "border-primary-500 bg-primary-50"
                          : "border-neutral-100 hover:border-neutral-200"
                      }`}
                    >
                      <AnimatedCheckbox checked={saveMoncashInfo} />
                      <div className="flex flex-col gap-[4px]">
                        <span className="font-semibold text-[1.4rem] leading-6 text-deep-100">
                          {t("saveMoncashInfo")}
                        </span>
                        <span className="text-[1.2rem] leading-5 text-neutral-500">
                          {t("saveMoncashInfo_hint")}
                        </span>
                      </div>
                    </motion.button>
                  </>
                )}
                <div className="flex items-start gap-3 p-4 rounded-[12px] border border-amber-200 bg-amber-50 text-[1.3rem] leading-7 text-amber-800">
                  <div className="shrink-0 mt-[2px]">
                    <InfoCircle size="18" color="#b45309" />
                  </div>
                  <span>{t("incorrectInfoWarning")}</span>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: PIN ──────────────────────────────────── */}
            {step === "pin" && (
              <motion.div
                key="pin"
                custom={delta}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="flex flex-col gap-8 lg:w-212 mx-auto w-full"
              >
                <div className="flex flex-col gap-2">
                  <h2 className="font-semibold text-[1.9rem] leading-[2.6rem] text-deep-100">
                    {t("security")}
                  </h2>
                  <p className="text-[1.4rem] leading-7 text-neutral-500">
                    {t("security_hint")}
                  </p>
                </div>

                {/* Withdrawal summary */}
                <div className="flex items-center justify-between p-5 rounded-[14px] bg-neutral-100">
                  <div className="flex flex-col gap-[3px]">
                    <span className="text-[1.2rem] text-neutral-500">
                      {t("withdraw")}
                    </span>
                    <span className="font-bold text-[2rem] text-deep-100">
                      {activeCurrencyBalance}{" "}
                      <span className="text-neutral-400 font-normal text-[1.3rem]">
                        {activeCurrency}
                      </span>
                    </span>
                  </div>
                  <div className="text-right flex flex-col gap-[2px]">
                    <span className="text-[1.3rem] font-medium text-deep-100">
                      {accountType === "wise"
                        ? (wiseResolvedName ?? "")
                        : accountType === "bank"
                          ? bankAccountName
                          : moncashAccountName}
                    </span>
                    <span className="text-[1.2rem] text-neutral-400">
                      {accountType === "wise"
                        ? wiseRecipientValue
                        : accountType === "bank"
                          ? bankAccountNumber
                          : moncashNumber}
                    </span>
                  </div>
                </div>

                <div className="border border-neutral-100 w-full rounded-[16px] p-8 flex flex-col gap-12">
                  <div className="flex flex-col gap-6">
                    <span className="font-semibold text-[1.5rem] leading-8 text-deep-100">
                      {t("pin")}
                    </span>
                    <InputOTP
                      onChange={setPin}
                      value={pin}
                      pattern={REGEXP_ONLY_DIGITS}
                      maxLength={4}
                    >
                      <InputOTPGroup className="flex justify-between w-full">
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="flex flex-col gap-6">
                    <span className="font-semibold text-[1.5rem] leading-8 text-deep-100">
                      {t("confirmPin")}
                    </span>
                    <InputOTP
                      onChange={setPinConfirmation}
                      value={pinConfirmation}
                      pattern={REGEXP_ONLY_DIGITS}
                      maxLength={4}
                    >
                      <InputOTPGroup className="flex justify-between w-full">
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop proceed button */}
        <div className="absolute bottom-0 z-[9999] w-full hidden lg:block">
          <ButtonPrimary
            onClick={next}
            className="w-full max-w-[530px] mx-auto"
            disabled={isLoading}
          >
            {isLoading ? <LoadingCircleSmall /> : proceedLabel}
          </ButtonPrimary>
        </div>

        {/* Mobile proceed bar */}
        <div className="fixed lg:hidden bottom-36 w-full px-8 z-50 left-0">
          <div className="bg-white mx-auto border border-neutral-100 px-4 py-[5px] flex justify-between items-center rounded-[100px] shadow-sm">
            <div className="text-[2rem] text-neutral-500 font-medium">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentStep}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="text-primary-500 inline-block"
                >
                  {currentStep + 1}
                </motion.span>
              </AnimatePresence>
              <span className="text-neutral-300">/{stepLabels.length}</span>
            </div>
            <ButtonPrimary disabled={isLoading} onClick={next}>
              {isLoading ? <LoadingCircleSmall /> : proceedLabel}
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </>
  );
}
