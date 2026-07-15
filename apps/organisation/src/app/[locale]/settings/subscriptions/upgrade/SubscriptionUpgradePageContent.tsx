"use client";
import { formatMoney } from "@ticketwaze/currency";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Input } from "@/components/shared/Inputs";
import { MembershipTier, OrganisationSubscription } from "@ticketwaze/typescript-config";
import {
  ArrowLeft2,
  CardPos,
  Crown,
  Mobile,
  TickCircle,
} from "iconsax-reactjs";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ReactNode, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

const TRIAL_DAYS = 15; // change this to update the free trial duration
const YEARLY_DISCOUNT = 0.1; // 10% off for annual billing

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type BillingCycle = "monthly" | "yearly";
type PaymentMethod = "stripe" | "moncash";
type Step = "plans" | "payment" | "checkout";

function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-[0.3rem] shrink-0">
        <TickCircle size="15" color="#E45B00" variant="Bulk" />
      </div>
      <span className="text-[1.3rem] leading-[1.6] text-neutral-600 flex items-center gap-2">
        {children}
      </span>
    </li>
  );
}

function StepIndicator({
  step,
  t,
}: {
  step: Step;
  t: ReturnType<typeof useTranslations<"Settings.subscriptions">>;
}) {
  const isDone = (s: Step) => {
    if (s === "plans") return step === "payment" || step === "checkout";
    if (s === "payment") return step === "checkout";
    return false;
  };
  const isActive = (s: Step) => step === s;

  return (
    <div className="flex items-center  gap-3 mb-10">
      {(["plans", "payment", "checkout"] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center gap-3 ">
          {i > 0 && (
            <div
              className={`w-8 h-px transition-colors duration-400 ${isDone(["plans", "payment", "checkout"][i - 1] as Step) || isActive(s) ? "bg-primary-500" : "bg-neutral-200"}`}
            />
          )}
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${isDone(s) || isActive(s) ? "bg-primary-500" : "bg-neutral-200"}`}
            >
              {isDone(s) ? (
                <TickCircle size="14" color="#fff" variant="Bulk" />
              ) : (
                <span
                  className={`text-[1.1rem] font-bold leading-none ${isActive(s) ? "text-white" : "text-neutral-400"}`}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <span
              className={`text-[1.6rem] font-medium transition-colors duration-300 hidden sm:block ${isActive(s) || isDone(s) ? "text-black" : "text-neutral-400"}`}
            >
              {s === "plans"
                ? t("payment.step_plan")
                : s === "payment"
                  ? t("payment.step_payment")
                  : t("payment.step_checkout")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SubscriptionUpgradePageContent({
  membershipTier,
  membershipTiers,
  organisationSubscriptions,
}: {
  membershipTier: MembershipTier;
  membershipTiers: MembershipTier[];
  organisationSubscriptions: OrganisationSubscription[];
}) {
  const t = useTranslations("Settings.subscriptions");
  const { data: session } = useSession();
  const router = useRouter();
  const currentPlan = membershipTier.membershipName;

  const activeSub =
    organisationSubscriptions.find((s) => s.status === "ACTIVE") ??
    organisationSubscriptions.find((s) => s.status === "CANCELED");
  const isOnTrial = activeSub?.isTrial === true;

  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<MembershipTier | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [phone, setPhone] = useState("");

  const proTier = membershipTiers.find((m) => m.membershipName === "pro");
  const premiumTier = membershipTiers.find(
    (m) => m.membershipName === "premium",
  );

  function selectPlan(tier: MembershipTier) {
    setSelectedPlan(tier);
    setPaymentMethod(null);
    setStep("payment");
  }

  async function startStripeCheckout() {
    if (!selectedPlan) return;
    setIsCreatingSession(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/memberships/${selectedPlan.membershipTierId}/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken ?? ""}`,
            origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          },
          body: JSON.stringify({
            organisationId: session?.activeOrganisation?.organisationId ?? "",
            billingCycle,
          }),
        },
      );
      const data = await res.json();
      if (data.status === "success" && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep("checkout");
      } else {
        toast.error(data.message ?? t("payment.error"));
      }
    } catch {
      toast.error(t("payment.error"));
    } finally {
      setIsCreatingSession(false);
    }
  }

  async function startTrial() {
    if (!proTier) return;
    setIsStartingTrial(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/memberships/${proTier.membershipTierId}/trial`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken ?? ""}`,
            origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          },
          body: JSON.stringify({
            organisationId: session?.activeOrganisation?.organisationId ?? "",
          }),
        },
      );
      const data = await res.json();
      if (data.status === "success") {
        toast.success(t("trial_success", { days: TRIAL_DAYS }));
        router.push("/settings/subscriptions");
      } else {
        toast.error(data.message ?? t("trial_error"));
      }
    } catch {
      toast.error(t("trial_error"));
    } finally {
      setIsStartingTrial(false);
    }
  }

  const planLabel = (tier: MembershipTier) =>
    tier.membershipName === "pro" ? t("pro.title") : t("premium.title");

  const basePrice = (tier: MembershipTier) => Number(tier.membershipUsdPrice);
  const displayPrice = (tier: MembershipTier) => {
    const price = billingCycle === "yearly"
      ? basePrice(tier) * (1 - YEARLY_DISCOUNT)
      : basePrice(tier);
    return formatMoney(price, "USD");
  };
  const originalPrice = (tier: MembershipTier) =>
    formatMoney(basePrice(tier), "USD");

  return (
    <div className="overflow-y-auto pb-16">
      <StepIndicator step={step} t={t} />

      <AnimatePresence mode="wait">
        {/* ─── STEP 1: PLAN SELECTION ─── */}
        {step === "plans" && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-8"
          >
            {/* Billing cycle toggle */}
            <div className="flex items-center self-center bg-neutral-100 rounded-full p-1 gap-1">
              {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={`px-6 py-2 rounded-full text-[1.3rem] font-medium transition-all duration-200 cursor-pointer ${
                    billingCycle === cycle
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {cycle === "monthly"
                    ? t("payment.billing_monthly")
                    : t("payment.billing_yearly")}
                  {cycle === "yearly" && (
                    <span className="ml-2 text-[1rem] font-bold text-primary-500">
                      {t("payment.billing_save")}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Plan cards */}
            <div className="flex flex-col lg:flex-row items-stretch gap-6">
              {/* PRO */}
              {proTier && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className={`flex-1 flex flex-col rounded-[25px] overflow-hidden ${currentPlan === "pro" && !isOnTrial ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <div className="bg-primary-900 px-8 pt-8 pb-12 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-white/50 text-[1.1rem] font-medium uppercase tracking-widest">
                        {billingCycle === "monthly"
                          ? t("pro.subtitle")
                          : t("payment.billed_yearly")}
                      </span>
                      <span
                        className={`shrink-0 text-[1rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${currentPlan === "pro" && !isOnTrial ? "bg-primary-500 text-white" : "bg-white/10 text-white/70"}`}
                      >
                        {currentPlan === "pro" && !isOnTrial ? t("pro.tag") : t("pro.most")}
                      </span>
                    </div>
                    <h2 className="text-white font-primary font-medium text-[4.5rem] leading-none">
                      {t("pro.title")}
                    </h2>
                    <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                      {billingCycle === "yearly" && (
                        <span className="text-white/40 text-[2rem] font-primary font-medium line-through">
                          {originalPrice(proTier)}
                        </span>
                      )}
                      <span className="text-white text-[2.8rem] font-primary font-medium">
                        {displayPrice(proTier)}
                      </span>
                      <span className="text-white/50 text-[1.3rem]">/mo</span>
                    </div>
                  </div>

                  <div className="bg-white flex flex-col gap-8 p-8 flex-1 justify-between -mt-5 rounded-t-[20px]">
                    <ul className="flex flex-col gap-4">
                      <Feature>{t("pro.list.1")}</Feature>
                      <Feature>{t("pro.list.2")}</Feature>
                      <Feature>{t("pro.list.3")}</Feature>
                      <Feature>{t("pro.list.4")}</Feature>
                      <Feature>{t("pro.list.5")}</Feature>
                      <Feature>{t("pro.list.6")}</Feature>
                      <Feature>{t("pro.list.7")}</Feature>
                    </ul>

                    {currentPlan === "pro" && !isOnTrial ? (
                      <p className="text-center text-[1.3rem] font-medium text-primary-500 py-2">
                        {t("pro.tag")} ✓
                      </p>
                    ) : currentPlan === "free" || isOnTrial ? (
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => selectPlan(proTier)}
                          className="w-full py-[1.4rem] rounded-full bg-primary-900 text-white font-medium text-[1.4rem] cursor-pointer hover:bg-primary-900/85 transition-colors flex items-center justify-center gap-3"
                        >
                          <Crown size="18" color="#fff" variant="Bulk" />
                          {t("pro.cta")}
                        </button>
                        {!isOnTrial && (
                          <button
                            onClick={startTrial}
                            disabled={isStartingTrial}
                            className="w-full py-[1.4rem] rounded-full border border-primary-900/25 text-primary-900 font-medium text-[1.4rem] cursor-pointer hover:bg-primary-900/5 transition-colors flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isStartingTrial ? (
                              <LoadingCircleSmall />
                            ) : (
                              t("trial_cta", { days: TRIAL_DAYS })
                            )}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )}

              {/* PREMIUM */}
              {premiumTier && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className={`flex-1 flex flex-col rounded-[25px] overflow-hidden ${currentPlan === "premium" ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <div className="p-[0.2rem] bg-linear-to-b from-primary-500 via-[#E752AE] to-[#DD068B] flex flex-col flex-1 rounded-[25px]">
                    <div className="bg-linear-to-br from-primary-500 via-[#E752AE] to-[#DD068B] px-8 pt-8 pb-12 flex flex-col gap-3 rounded-t-[22px]">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-white/70 text-[1.1rem] font-medium uppercase tracking-widest">
                          {billingCycle === "monthly"
                            ? t("premium.subtitle")
                            : t("payment.billed_yearly")}
                        </span>
                        {currentPlan === "premium" && (
                          <span className="shrink-0 text-[1rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 text-white">
                            {t("pro.tag")}
                          </span>
                        )}
                      </div>
                      <h2 className="text-white font-primary font-medium text-[4.5rem] leading-none">
                        {t("premium.title")}
                      </h2>
                      <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                        {billingCycle === "yearly" && (
                          <span className="text-white/40 text-[2rem] font-primary font-medium line-through">
                            {originalPrice(premiumTier)}
                          </span>
                        )}
                        <span className="text-white text-[2.8rem] font-primary font-medium">
                          {displayPrice(premiumTier)}
                        </span>
                        <span className="text-white/60 text-[1.3rem]">/mo</span>
                      </div>
                    </div>

                    <div className="bg-white flex flex-col gap-8 p-8 flex-1 justify-between -mt-5 rounded-t-[20px] rounded-b-[22px]">
                      <ul className="flex flex-col gap-4">
                        <Feature>{t("premium.list.1")}</Feature>
                        <Feature>{t("premium.list.2")}</Feature>
                        <Feature>{t("premium.list.3")}</Feature>
                        <Feature>{t("premium.list.4")}</Feature>
                        <Feature>{t("premium.list.5")}</Feature>
                        <Feature>{t("premium.list.6")}</Feature>
                        <Feature>
                          {t("premium.list.7")}
                          <VerifiedOrganisationCheckMark />
                        </Feature>
                      </ul>

                      {currentPlan === "premium" ? (
                        <p className="text-center text-[1.3rem] font-medium text-primary-500 py-2">
                          {t("pro.tag")} ✓
                        </p>
                      ) : (
                        <div className="p-[0.2rem] rounded-full bg-linear-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
                          <button
                            onClick={() => selectPlan(premiumTier)}
                            className="w-full py-[1.4rem] rounded-full bg-white font-medium text-[1.4rem] cursor-pointer hover:bg-neutral-50 transition-colors flex items-center justify-center gap-3"
                          >
                            <Crown size="18" color="#E45B00" variant="Bulk" />
                            <span className="bg-linear-to-r from-primary-500 via-[#E752AE] to-[#DD068B] bg-clip-text text-transparent">
                              {t("premium.cta")}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── STEP 2: PAYMENT METHOD ─── */}
        {step === "payment" && selectedPlan && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-8"
          >
            <button
              onClick={() => setStep("plans")}
              className="flex items-center gap-2 text-neutral-500 text-[1.3rem] hover:text-black transition-colors w-fit cursor-pointer"
            >
              <ArrowLeft2 size="16" color="currentColor" variant="Bulk" />
              {t("payment.back_plan")}
            </button>

            {/* Order summary */}
            <div
              className={`rounded-[20px] p-5 flex items-center justify-between gap-4 ${
                selectedPlan.membershipName === "premium"
                  ? "bg-linear-to-r from-primary-500/[0.07] via-[#E752AE]/[0.07] to-[#DD068B]/[0.07] border border-[#E752AE]/20"
                  : "bg-primary-900/5 border border-primary-900/15"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                    selectedPlan.membershipName === "premium"
                      ? "bg-linear-to-br from-primary-500 via-[#E752AE] to-[#DD068B]"
                      : "bg-primary-900"
                  }`}
                >
                  <Crown size="18" color="#fff" variant="Bulk" />
                </div>
                <div>
                  <p className="text-[1.5rem] font-medium text-black">
                    {planLabel(selectedPlan)}
                  </p>
                  <p className="text-[1.2rem] text-neutral-400 capitalize">
                    {billingCycle === "monthly"
                      ? t("payment.billing_monthly")
                      : t("payment.billing_yearly")}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                {billingCycle === "yearly" && (
                  <div className="text-[1.4rem] text-neutral-400 line-through font-primary leading-none mb-0.5">
                    {originalPrice(selectedPlan)}
                  </div>
                )}
                <span className="text-[2rem] font-primary font-medium text-black">
                  {displayPrice(selectedPlan)}
                </span>
                <span className="text-[1.2rem] text-neutral-400 font-normal">
                  /mo
                </span>
              </div>
            </div>

            {/* Payment method heading */}
            <div>
              <h3 className="text-[1.8rem] font-medium text-black">
                {t("payment.title")}
              </h3>
              <p className="text-[1.3rem] text-neutral-500 mt-1">
                {t("payment.subtitle")}
              </p>
            </div>

            {/* Method cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(
                [
                  {
                    id: "stripe" as PaymentMethod,
                    icon: CardPos,
                    label: t("payment.card"),
                    desc: t("payment.card_desc"),
                  },
                  {
                    id: "moncash" as PaymentMethod,
                    icon: Mobile,
                    label: t("payment.moncash"),
                    desc: t("payment.moncash_desc"),
                  },
                ] as const
              ).map(({ id, icon: Icon, label, desc }) => (
                <button
                  key={id}
                  onClick={() =>
                    setPaymentMethod(paymentMethod === id ? null : id)
                  }
                  className={`p-6 rounded-[20px] border-2 text-left transition-all duration-200 cursor-pointer ${
                    paymentMethod === id
                      ? "border-primary-500 bg-primary-500/5"
                      : "border-neutral-200 bg-white hover:border-primary-500/40"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${paymentMethod === id ? "bg-primary-500" : "bg-neutral-100"}`}
                    >
                      <Icon
                        size="20"
                        color={paymentMethod === id ? "#fff" : "#737c8a"}
                        variant="Bulk"
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-[1.4rem] font-medium ${paymentMethod === id ? "text-primary-500" : "text-black"}`}
                      >
                        {label}
                      </p>
                      <p className="text-[1.2rem] text-neutral-500 mt-0.5">
                        {desc}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${paymentMethod === id ? "border-primary-500 bg-primary-500" : "border-neutral-300"}`}
                    >
                      {paymentMethod === id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* CTA / Mon Cash inline form */}
            <AnimatePresence mode="wait">
              {paymentMethod === "stripe" && (
                <motion.div
                  key="stripe-cta"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ButtonPrimary
                    onClick={startStripeCheckout}
                    disabled={isCreatingSession}
                    className="w-full"
                  >
                    {isCreatingSession ? (
                      <LoadingCircleSmall />
                    ) : (
                      <>
                        <CardPos
                          size="20"
                          color="#fff"
                          variant="Bulk"
                          className="mr-3"
                        />
                        {t("payment.proceed_stripe")} —{" "}
                        {displayPrice(selectedPlan)}/mo
                      </>
                    )}
                  </ButtonPrimary>
                </motion.div>
              )}

              {paymentMethod === "moncash" && (
                <motion.div
                  key="moncash-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="bg-neutral-100 rounded-[20px] p-8 flex flex-col gap-6"
                >
                  <p className="text-[1.4rem] font-medium text-black">
                    {t("payment.moncash_enter")}
                  </p>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder=" "
                  >
                    {t("payment.phone")}
                  </Input>
                  <ButtonPrimary
                    disabled={phone.trim().length < 8}
                    onClick={() => toast.info(t("soon"))}
                    className="w-full"
                  >
                    {t("payment.confirm")} — {displayPrice(selectedPlan)}/mo
                  </ButtonPrimary>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ─── STEP 3: STRIPE EMBEDDED CHECKOUT ─── */}
        {step === "checkout" && clientSecret && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            <button
              onClick={() => {
                setClientSecret(null);
                setStep("payment");
              }}
              className="flex items-center gap-2 text-neutral-500 text-[1.3rem] hover:text-black transition-colors w-fit cursor-pointer"
            >
              <ArrowLeft2 size="16" color="currentColor" variant="Bulk" />
              {t("payment.back_payment")}
            </button>

            {/* Plan reminder */}
            {selectedPlan && (
              <div className="flex items-center gap-3 px-5 py-3 rounded-[14px] bg-neutral-100 w-fit">
                <Crown size="16" color="#E45B00" variant="Bulk" />
                <span className="text-[1.3rem] font-medium text-black">
                  {planLabel(selectedPlan)} · {displayPrice(selectedPlan)}/mo ·{" "}
                  <span className="text-neutral-500 capitalize">
                    {billingCycle}
                  </span>
                </span>
              </div>
            )}

            <div className="rounded-[20px] overflow-hidden border border-neutral-200">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
