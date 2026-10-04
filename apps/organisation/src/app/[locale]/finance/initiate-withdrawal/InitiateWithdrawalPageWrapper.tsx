"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Bank, InfoCircle, MoneyRecive, TickCircle } from "iconsax-reactjs";
import { Order, Organisation } from "@ticketwaze/typescript-config";
import {
  CreateFooter,
  CreateHeader,
  CreatedScreen,
  Section,
  StepPanel,
} from "@/components/create/CreateParts";
import { Input } from "@/components/shared/Inputs";
import ToggleIcon from "@/components/shared/ToggleIcon";
import PinBoxes from "@/components/shared/PinBoxes";
import CreatePinDialog from "@/components/shared/CreatePinDialog";
import { useRouter } from "@/i18n/navigation";
import { financeFigures, formatMoney } from "@/lib/financeFigures";
import { cn } from "@/lib/utils";
import moncashIcon from "@/assets/images/moncash-icon.svg";
import natcashIcon from "@/assets/images/natcash.png";
import {
  BankWithdrawalRequest,
  UpdateOrganisationBankPaymentInformation,
  UpdateOrganisationMoncashPaymentInformation,
  UpdateOrganisationNatcashPaymentInformation,
} from "@/actions/organisationActions";

/**
 * How the organiser wants the money. `cash` is a handover in person, so its
 * "details" are who collects and the number to reach them on. Wise is paused.
 */
type Method = "bank" | "moncash" | "natcash" | "cash";

/**
 * Initiate Withdrawal (Figma rows y6661 / y10311, phone y8576): two steps.
 * Summary — the balance and its breakdown. Method — how to receive it, the
 * account details (saved ones pre-filled, with "Save details for future
 * payment") and the 4-digit PIN. With no PIN yet, the button reads "Create
 * withdrawal pin" and opens Create Withdrawal Pin first. The whole available
 * balance is withdrawn; only a bank payout picks HTG or USD.
 */
export default function InitiateWithdrawalPageWrapper({
  organisation,
  orders,
}: {
  organisation: Organisation;
  orders: Order[];
}) {
  const t = useTranslations("Finance");
  const ti = useTranslations("Finance.initiate");
  const locale = useLocale();
  const router = useRouter();

  const currency = organisation.currency ?? "HTG";
  const figures = financeFigures(orders, organisation, currency);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [done, setDone] = useState(false);
  const [method, setMethod] = useState<Method | null>(null);
  const [bankCurrency, setBankCurrency] = useState<"HTG" | "USD">(
    currency === "USD" ? "USD" : "HTG",
  );

  const [bank, setBank] = useState({
    name: organisation.bankName ?? "",
    holder: organisation.bankAccountName ?? "",
    number: organisation.bankAccountNumber ?? "",
  });
  const [moncash, setMoncash] = useState({
    holder: organisation.moncashAccountName ?? "",
    number: organisation.moncashNumber ?? "",
  });
  const [natcash, setNatcash] = useState({
    holder: organisation.natcashAccountName ?? "",
    number: organisation.natcashNumber ?? "",
  });
  const [cash, setCash] = useState({ holder: "", number: "" });
  const [save, setSave] = useState<Record<Method, boolean>>({
    bank: Boolean(organisation.bankAccountNumber),
    moncash: Boolean(organisation.moncashNumber),
    natcash: Boolean(organisation.natcashNumber),
    cash: false,
  });

  const [hasPin, setHasPin] = useState(Boolean(organisation.hasWithdrawalPin));
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(0);
  const [pinModal, setPinModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // MonCash, NatCash and cash settle in gourdes; a bank payout picks.
  const payCurrency: "HTG" | "USD" = method === "bank" ? bankCurrency : "HTG";
  const payAmount =
    payCurrency === "USD"
      ? Number(organisation.usdAvailableBalance) || 0
      : Number(organisation.availableBalance) || 0;

  const destination: Record<Method, { holder: string; number: string }> = {
    bank: { holder: bank.holder, number: bank.number },
    moncash,
    natcash,
    cash,
  };

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  /** Checks the chosen method's fields; returns false after telling why. */
  function detailsValid(): boolean {
    if (!method) {
      toast.error(t("accountTypeError"));
      return false;
    }
    const eight = (v: string) => /^\d{8}$/.test(v.trim());
    const fail = (key: string) => {
      toast.error(t(`errors.${key}`));
      return false;
    };
    if (method === "bank") {
      if (!bank.name.trim()) return fail("bank_name");
      if (!bank.number.trim()) return fail("bank_account_number");
      if (!bank.holder.trim()) return fail("bank_account_name");
    } else if (method === "moncash") {
      if (!moncash.holder.trim()) return fail("moncash_account_name");
      if (!moncash.number.trim()) return fail("moncash_number");
      if (!eight(moncash.number)) return fail("moncash_number_invalid");
    } else if (method === "natcash") {
      if (!natcash.holder.trim()) return fail("natcash_account_name");
      if (!natcash.number.trim()) return fail("natcash_number");
      if (!eight(natcash.number)) return fail("natcash_number_invalid");
    } else {
      if (!cash.holder.trim()) return fail("cash_collector_name");
      if (!cash.number.trim()) return fail("cash_phone");
      if (!eight(cash.number)) return fail("cash_phone_invalid");
    }
    if (payAmount <= 0) return fail("insufficient");
    return true;
  }

  async function withdraw() {
    if (!detailsValid() || !method) return;
    if (pin.length !== 4) {
      toast.error(t("errors.noPin"));
      setPinError((n) => n + 1);
      return;
    }
    setSubmitting(true);
    try {
      const { holder, number } = destination[method];
      const result = await BankWithdrawalRequest(
        organisation.organisationId,
        locale,
        {
          accountType: method,
          pin,
          accountName: holder.trim(),
          accountNumber: number.trim(),
          currency: payCurrency,
          ...(method === "bank" ? { bankName: bank.name.trim() } : {}),
        },
      );
      if (result.status === "success") {
        // Saved only once the request went through, never on a wrong PIN.
        // Remembered for next time only when asked; cash never is.
        if (method === "bank" && save.bank) {
          await UpdateOrganisationBankPaymentInformation(
            organisation.organisationId,
            {
              bankName: bank.name,
              bankAccountName: bank.holder,
              bankAccountNumber: bank.number,
            },
            locale,
          );
        }
        if (method === "moncash" && save.moncash) {
          await UpdateOrganisationMoncashPaymentInformation(
            organisation.organisationId,
            {
              moncashAccountName: moncash.holder,
              moncashNumber: moncash.number,
            },
            locale,
          );
        }
        if (method === "natcash" && save.natcash) {
          await UpdateOrganisationNatcashPaymentInformation(
            organisation.organisationId,
            {
              natcashAccountName: natcash.holder,
              natcashNumber: natcash.number,
            },
            locale,
          );
        }
        setDone(true);
        setTimeout(() => {
          router.push("/finance");
          router.refresh();
        }, 2200);
        return;
      }
      // The API answers with codes; map the ones we know.
      const code = (result as { error?: string }).error ?? "";
      const messages: Record<string, string> = {
        pin: t("errors.incorrectPin"),
        no_pin: ti("no_pin"),
        Unauthorized: t("errors.Unauthorized"),
        insufficient: t("errors.insufficient"),
        pending_exists: t("errors.pending_exists"),
      };
      if (code === "pin") {
        setPin("");
        setPinError((n) => n + 1);
      }
      if (code === "no_pin") setHasPin(false);
      toast.error(messages[code] ?? t("errors.insufficient"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <CreatedScreen
        title={ti("success_title")}
        description={ti("success_description")}
        pendingLabel={ti("opening")}
      />
    );
  }

  const money = (value: number, unit = currency) =>
    `${formatMoney(value, locale)} ${unit}`;

  return (
    <div className="flex flex-col h-full gap-10 lg:gap-12">
      <CreateHeader
        title={ti("title")}
        steps={[t("summary"), ti("method_step")]}
        current={step}
        onBack={() => (step === 0 ? router.push("/finance") : go(0))}
      />

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden pb-6"
        onWheel={(e) => {
          const el = e.target as HTMLInputElement;
          if (el.type === "number" && document.activeElement === el) el.blur();
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 ? (
            <StepPanel key="summary" stepKey="summary" direction={direction}>
              <Section>
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="rounded-[1.5rem] bg-neutral-100 py-10 px-6 flex flex-col items-center gap-2"
                >
                  <span className="font-sans font-medium text-[1.5rem] text-deep-100">
                    {ti("balance")}
                  </span>
                  <span className="font-primary font-medium text-[3.6rem] lg:text-[4.8rem] leading-[1.1] text-black text-center break-all">
                    {formatMoney(figures.balance, locale)}{" "}
                    <span className="text-neutral-400">{currency}</span>
                  </span>
                </motion.div>
                <p className="text-center font-sans text-[1.3rem] text-neutral-500">
                  {t("breakdown")}
                </p>
                <div className="flex flex-col gap-5 font-sans text-[1.4rem] leading-8">
                  <BreakdownRow
                    label={t("revenue")}
                    value={money(figures.revenue)}
                  />
                  <BreakdownRow
                    label={ti("platform_fees")}
                    value={money(figures.fees)}
                  />
                  <div className="h-px bg-neutral-100" />
                  <BreakdownRow
                    label={t("profit")}
                    value={money(figures.profit)}
                    strong
                  />
                </div>
                {figures.pending > 0 && (
                  <p className="flex items-start gap-3 text-[1.2rem] leading-6 text-neutral-600">
                    <InfoCircle
                      size="16"
                      variant="Bulk"
                      color="#737C8A"
                      className="shrink-0 mt-[.1rem]"
                    />
                    {ti("pending_note", { amount: money(figures.pending) })}
                  </p>
                )}
              </Section>
            </StepPanel>
          ) : (
            <StepPanel key="method" stepKey="method" direction={direction}>
              <Section title={t("payment_method")}>
                <div className="grid grid-cols-2 gap-3">
                  <MethodTile
                    active={method === "bank"}
                    onClick={() => setMethod("bank")}
                    label={t("bank")}
                    icon={
                      <Bank
                        size="22"
                        variant="Bulk"
                        color={method === "bank" ? "#E45B00" : "#737C8A"}
                      />
                    }
                  />
                  <MethodTile
                    active={method === "moncash"}
                    onClick={() => setMethod("moncash")}
                    label={t("moncash")}
                    icon={
                      <Image src={moncashIcon} alt="" width={26} height={26} />
                    }
                  />
                  <MethodTile
                    active={method === "natcash"}
                    onClick={() => setMethod("natcash")}
                    label={t("natcash")}
                    icon={
                      <Image
                        src={natcashIcon}
                        alt=""
                        width={26}
                        height={26}
                        className="rounded-md"
                      />
                    }
                  />
                  <MethodTile
                    active={method === "cash"}
                    onClick={() => setMethod("cash")}
                    label={t("cash")}
                    icon={
                      <MoneyRecive
                        size="22"
                        variant="Bulk"
                        color={method === "cash" ? "#E45B00" : "#737C8A"}
                      />
                    }
                  />
                </div>
              </Section>

              <AnimatePresence mode="wait" initial={false}>
                {method && (
                  <motion.div
                    key={method}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-10"
                  >
                    <Section
                      title={
                        method === "bank"
                          ? t("bank_details")
                          : method === "moncash"
                            ? t("moncash_details")
                            : method === "natcash"
                              ? t("natcash_details")
                              : t("cash_details")
                      }
                    >
                      {method === "bank" && (
                        <>
                          <Input
                            value={bank.name}
                            onChange={(e) =>
                              setBank({ ...bank, name: e.target.value })
                            }
                          >
                            {t("bank_name")}
                          </Input>
                          <Input
                            value={bank.number}
                            onChange={(e) =>
                              setBank({ ...bank, number: e.target.value })
                            }
                          >
                            {t("bank_account_number")}
                          </Input>
                          <Input
                            value={bank.holder}
                            onChange={(e) =>
                              setBank({ ...bank, holder: e.target.value })
                            }
                          >
                            {t("bank_account_name")}
                          </Input>
                          <div className="flex items-center justify-between gap-4 px-2">
                            <span className="text-[1.4rem] text-deep-100">
                              {ti("receive_in")}
                            </span>
                            <div className="flex bg-neutral-100 rounded-[3rem] p-[.5rem]">
                              {(["HTG", "USD"] as const).map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setBankCurrency(c)}
                                  className={cn(
                                    "relative px-5 py-1 rounded-[3rem] text-[1.4rem] cursor-pointer",
                                    bankCurrency === c
                                      ? "text-white"
                                      : "text-neutral-700",
                                  )}
                                >
                                  {bankCurrency === c && (
                                    <motion.span
                                      layoutId="bank-currency"
                                      className="absolute inset-0 rounded-[3rem] bg-black"
                                      transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 34,
                                      }}
                                    />
                                  )}
                                  <span className="relative">{c}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {(method === "moncash" || method === "natcash") && (
                        <>
                          <Input
                            value={
                              method === "moncash"
                                ? moncash.holder
                                : natcash.holder
                            }
                            onChange={(e) =>
                              method === "moncash"
                                ? setMoncash({
                                    ...moncash,
                                    holder: e.target.value,
                                  })
                                : setNatcash({
                                    ...natcash,
                                    holder: e.target.value,
                                  })
                            }
                          >
                            {t(
                              method === "moncash"
                                ? "moncash_account_name"
                                : "natcash_account_name",
                            )}
                          </Input>
                          <Input
                            inputMode="numeric"
                            maxLength={8}
                            value={
                              method === "moncash"
                                ? moncash.number
                                : natcash.number
                            }
                            onChange={(e) => {
                              const v = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 8);
                              if (method === "moncash")
                                setMoncash({ ...moncash, number: v });
                              else setNatcash({ ...natcash, number: v });
                            }}
                          >
                            {t(
                              method === "moncash"
                                ? "moncash_number"
                                : "natcash_number",
                            )}
                          </Input>
                        </>
                      )}
                      {method === "cash" && (
                        <>
                          <Input
                            value={cash.holder}
                            onChange={(e) =>
                              setCash({ ...cash, holder: e.target.value })
                            }
                          >
                            {t("cash_collector_name")}
                          </Input>
                          <Input
                            inputMode="numeric"
                            maxLength={8}
                            value={cash.number}
                            onChange={(e) =>
                              setCash({
                                ...cash,
                                number: e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 8),
                              })
                            }
                          >
                            {t("cash_phone")}
                          </Input>
                          <p className="text-[1.2rem] leading-6 text-neutral-600 px-2">
                            {t("cash_handover_note")}
                          </p>
                        </>
                      )}
                      {method !== "cash" && (
                        <label className="flex items-center justify-between gap-4 rounded-[1.2rem] bg-neutral-100 px-6 py-4 cursor-pointer">
                          <span className="text-[1.4rem] text-deep-100">
                            {ti("save_details")}
                          </span>
                          <span className="relative inline-block h-12 w-20 shrink-0 rounded-full bg-neutral-600 transition has-checked:bg-primary-500">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={save[method]}
                              onChange={() =>
                                setSave({ ...save, [method]: !save[method] })
                              }
                            />
                            <ToggleIcon />
                          </span>
                        </label>
                      )}
                      <p className="flex items-center gap-2 text-[1.3rem] text-neutral-600 px-2">
                        <TickCircle size="16" variant="Bulk" color="#349C2E" />
                        {money(payAmount, payCurrency)}
                      </p>
                    </Section>

                    {hasPin && (
                      <Section title={t("pin")} className="max-w-[30rem]">
                        <PinBoxes
                          value={pin}
                          onChange={setPin}
                          errorKey={pinError}
                          label={t("pin")}
                        />
                      </Section>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Room above the phone's pinned footer bar. */}
              <div className="h-24 lg:hidden" />
            </StepPanel>
          )}
        </AnimatePresence>
      </div>

      <CreateFooter
        step={step}
        total={2}
        onBack={step === 1 ? () => go(0) : undefined}
        onContinue={() => {
          if (step === 0) {
            if (figures.balance <= 0) {
              toast.error(t("errors.insufficient"));
              return;
            }
            go(1);
            return;
          }
          if (!hasPin) {
            if (detailsValid()) setPinModal(true);
            return;
          }
          void withdraw();
        }}
        continueLabel={
          step === 0 ? undefined : hasPin ? t("withdraw") : ti("create_pin")
        }
        disabled={step === 1 && hasPin && (!method || pin.length !== 4)}
        loading={submitting}
      />

      <CreatePinDialog
        open={pinModal}
        onOpenChange={setPinModal}
        organisationId={organisation.organisationId}
        onCreated={() => {
          setHasPin(true);
          setPinModal(false);
        }}
      />
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-neutral-600">{label}</span>
      <span
        className={cn("text-deep-100 text-right", strong && "font-semibold")}
      >
        {value}
      </span>
    </div>
  );
}

function MethodTile({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative flex items-center gap-3 rounded-[1.2rem] border-2 px-4 py-4 text-left cursor-pointer transition-colors",
        active
          ? "border-primary-500 bg-primary-50"
          : "border-neutral-100 hover:border-neutral-200",
      )}
    >
      <span className="w-[4rem] h-[4rem] shrink-0 rounded-[1rem] bg-white flex items-center justify-center">
        {icon}
      </span>
      <span className="font-sans font-medium text-[1.4rem] leading-6 text-deep-100">
        {label}
      </span>
      <motion.span
        initial={false}
        animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className="absolute top-2 right-2 flex"
      >
        <TickCircle size="16" variant="Bold" color="#E45B00" />
      </motion.span>
    </motion.button>
  );
}
