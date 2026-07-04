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
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  BankWithdrawalRequest,
  UpdateOrganisationBankPaymentInformation,
  UpdateOrganisationMoncashPaymentInformation,
} from "@/actions/organisationActions";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/shared/Inputs";

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
}: {
  organisation: Organisation;
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
  const [accountType, setAccountType] = useState<"bank" | "moncash" | null>(
    null,
  );
  const [bankCurrency, setBankCurrency] = useState<"HTG" | "USD">("HTG");

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

  // Amount step: bank uses selected currency, moncash is always HTG
  const activeCurrency: "HTG" | "USD" =
    accountType === "moncash" ? "HTG" : bankCurrency;
  const activeCurrencyBalance =
    activeCurrency === "HTG"
      ? organisation.availableBalance
      : organisation.usdAvailableBalance;

  const step3Label =
    accountType === "moncash" ? t("moncash_details") : t("bank_details");
  const stepLabels = [
    t("summary"),
    t("payment_method"),
    t("amount"),
    step3Label,
    t("security"),
  ];

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
        {
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
      } else if ((result as { error?: string }).error === "pin") {
        toast.error(t("errors.incorrectPin"));
        setPin("");
        setPinConfirmation("");
      } else if ((result as { error?: string }).error === "Unauthorized") {
        toast.error(t("errors.Unauthorized"));
      } else {
        toast.error(
          (result as { error?: string }).error ?? t("errors.insufficient"),
        );
      }
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
    if (currentStep === 1) {
      if (!accountType) {
        toast.error(t("accountTypeError"));
        return;
      }
      go(currentStep + 1);
      return;
    }

    if (currentStep === 2) {
      if (activeCurrencyBalance <= 0) {
        toast.error(t("errors.insufficient"));
        return;
      }
      go(currentStep + 1);
      return;
    }

    if (currentStep === 3) {
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

    if (currentStep === 4) {
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

  const proceedLabel = currentStep === 4 ? t("withdraw") : t("proceed");

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
            {currentStep === 0 && (
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
            {currentStep === 1 && (
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
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Amount ───────────────────────────────── */}
            {currentStep === 2 && (
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
            {currentStep === 3 && (
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
                {accountType === "bank" ? (
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
                            const val = e.target.value.replace(/\D/g, "").slice(0, 8);
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
            {currentStep === 4 && (
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
                      {accountType === "bank"
                        ? bankAccountName
                        : moncashAccountName}
                    </span>
                    <span className="text-[1.2rem] text-neutral-400">
                      {accountType === "bank"
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
