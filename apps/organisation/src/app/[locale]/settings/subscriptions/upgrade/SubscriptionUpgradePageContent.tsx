"use client";
import { formatMoney } from "@ticketwaze/currency";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MembershipTier,
  OrganisationSubscription,
} from "@ticketwaze/typescript-config";
import {
  ArrowLeft2,
  ArrowRight2,
  Card,
  Crown,
  ShieldSecurity,
  TickCircle,
} from "iconsax-reactjs";
import Image from "next/image";
import moncash from "@/assets/icons/moncash.svg";
import natcash from "@/assets/icons/natcash.png";
import { NATCASH_ENABLED } from "@/lib/paymentMethods";
import pinwheel from "@/assets/images/logo-simple-orange.svg";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "motion/react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, ReactNode, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import ToggleIcon from "@/components/shared/ToggleIcon";

const YEARLY_DISCOUNT = 0.1; // 10% off for annual billing

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type BillingCycle = "monthly" | "yearly";
type PaymentMethod = "stripe" | "moncash" | "natcash";
type Step = "plans" | "payment";

// Base features render with a muted check; the tier's headline extras (below the
// "+" divider) render with the brand check to draw the eye — mirrors the
// reference pricing layout without leaning on a second accent colour.
function Feature({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <li className="flex items-start gap-4">
      <div className="mt-[0.1rem] shrink-0">
        <TickCircle
          size="18"
          color={accent ? "#E45B00" : "#737c8a"}
          variant="Bulk"
        />
      </div>
      <span
        className={`text-[1.5rem] leading-[1.5] flex items-center gap-2 ${accent ? "text-black font-medium" : "text-neutral-700"}`}
      >
        {children}
      </span>
    </li>
  );
}

// The "everything above, plus these" separator from the reference layout.
function PlusDivider() {
  return (
    <li className="relative flex items-center justify-center py-1">
      <span className="absolute inset-x-0 h-px bg-neutral-200" />
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-[1.8rem] leading-none text-neutral-400">
        +
      </span>
    </li>
  );
}

const STEPS: Step[] = ["plans", "payment"];

function StepIndicator({
  step,
  onBack,
  t,
}: {
  step: Step;
  onBack: () => void;
  t: ReturnType<typeof useTranslations<"Settings.subscriptions">>;
}) {
  const stepLabel = (s: Step) =>
    s === "plans" ? t("payment.step_plan") : t("payment.step_payment");
  const currentIndex = STEPS.indexOf(step);

  return (
    <div className="flex items-center justify-between mb-10">
      <button
        onClick={onBack}
        className="flex max-w-32 cursor-pointer items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
          <ArrowLeft2 size="20" color="#0d0d0d" variant="Bulk" />
        </div>
        <span className="text-neutral-700 font-normal text-[1.4rem] leading-8">
          {t("back")}
        </span>
      </button>

      {/* Desktop: full labelled progress */}
      <div className="hidden lg:flex items-center gap-4">
        {STEPS.map((s, i) => (
          <Fragment key={s}>
            {i > 0 && (
              <div
                className={`w-[16.1rem] h-2 rounded-[100px] ${i <= currentIndex ? "bg-primary-500" : "bg-neutral-100"}`}
              />
            )}
            <span
              className={`${i <= currentIndex ? "text-primary-500" : "text-neutral-500"} font-medium text-[1.5rem] leading-12`}
            >
              {stepLabel(s)}
            </span>
          </Fragment>
        ))}
      </div>

      {/* Mobile: just the active step label */}
      <span className="lg:hidden text-primary-500 font-medium text-[1.5rem] leading-8">
        {stepLabel(step)}
      </span>
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
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const currentPlan = membershipTier.membershipName;

  const activeSub =
    organisationSubscriptions.find((s) => s.status === "ACTIVE") ??
    organisationSubscriptions.find((s) => s.status === "CANCELED");
  const isOnTrial = activeSub?.isTrial === true;

  // Being on a plan is not the same as that plan renewing itself. A MonCash
  // period never renews, and a cancelled card subscription stops at its end date
  // — in both cases the organisation still has days left, still reads as "pro",
  // and still needs a way to buy the next period. Only a card subscription that
  // will actually charge again has nothing to offer here.
  const isRenewing =
    activeSub?.paymentMethod === "stripe" &&
    activeSub.status !== "CANCELED" &&
    !activeSub.cancelAtPeriodEnd;

  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<MembershipTier | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);
  const [processing, setProcessing] = useState<PaymentMethod | null>(null);

  const proTier = membershipTiers.find((m) => m.membershipName === "pro");
  const premiumTier = membershipTiers.find(
    (m) => m.membershipName === "premium",
  );

  function selectPlan(tier: MembershipTier) {
    setSelectedPlan(tier);
    setStep("payment");
  }

  function goBack() {
    if (step === "payment") {
      setStep("plans");
    } else {
      router.push("/settings/subscriptions");
    }
  }

  const subscribeHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.user.accessToken ?? ""}`,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
  });
  const subscribeBody = () =>
    JSON.stringify({
      organisationId: session?.activeOrganisation?.organisationId ?? "",
      billingCycle,
    });

  // Card: opens Stripe's embedded checkout in a modal (like attendee checkout).
  async function payWithCard() {
    if (!selectedPlan || processing) return;
    setProcessing("stripe");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/memberships/${selectedPlan.membershipTierId}/subscribe`,
        { method: "POST", headers: subscribeHeaders(), body: subscribeBody() },
      );
      const data = await res.json();
      if (data.status === "success" && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStripeDialogOpen(true);
      } else {
        toast.error(data.message ?? t("payment.error"));
      }
    } catch {
      toast.error(t("payment.error"));
    } finally {
      setProcessing(null);
    }
  }

  // Mobile wallets: buy one period up front and redirect to the gateway (like
  // attendee checkout). The gateway sends the organiser back through the payment
  // app, which settles the membership and returns them here. MonCash and NatCash
  // differ only in the endpoint, so they share this.
  async function payWithWallet(wallet: "moncash" | "natcash") {
    if (!selectedPlan || processing) return;
    setProcessing(wallet);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/memberships/${selectedPlan.membershipTierId}/${wallet}`,
        { method: "POST", headers: subscribeHeaders(), body: subscribeBody() },
      );
      const data = await res.json();
      if (data.status === "success" && data.paymentURL) {
        // The gateway is external, so this must leave Next's router alone —
        // router.push would prefix the locale and mangle the URL.
        window.location.href = data.paymentURL;
        return; // leave `processing` set — the page is navigating away
      }
      toast.error(data.message ?? t("payment.error"));
    } catch {
      toast.error(t("payment.error"));
    }
    setProcessing(null);
  }

  const basePrice = (tier: MembershipTier) => Number(tier.membershipUsdPrice);
  const displayPrice = (tier: MembershipTier) => {
    const price =
      billingCycle === "yearly"
        ? basePrice(tier) * (1 - YEARLY_DISCOUNT)
        : basePrice(tier);
    return formatMoney(price, "USD");
  };
  const originalPrice = (tier: MembershipTier) =>
    formatMoney(basePrice(tier), "USD");

  // Mirrors the explore checkout payment rows so the flow stays consistent.
  const optionClass = (type: PaymentMethod) =>
    `flex items-center justify-between cursor-pointer p-[15px] rounded-[15px] border transition-all ease-in-out duration-300 disabled:cursor-default ${
      processing === type
        ? "border-2 border-primary-500 bg-primary-50"
        : "border-neutral-100 hover:border-primary-500"
    } ${processing && processing !== type ? "opacity-60" : ""}`;

  return (
    <div className="overflow-y-auto pb-16">
      <StepIndicator step={step} onBack={goBack} t={t} />

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
            <div className="flex items-center self-end gap-4">
              <span
                className={`text-[1.4rem] font-medium transition-colors duration-200 ${billingCycle === "monthly" ? "text-black" : "text-neutral-400"}`}
              >
                {t("payment.billing_monthly")}
              </span>
              <label className="relative inline-block h-12 w-20 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
                <input
                  className="peer sr-only"
                  type="checkbox"
                  checked={billingCycle === "yearly"}
                  onChange={() =>
                    setBillingCycle(
                      billingCycle === "yearly" ? "monthly" : "yearly",
                    )
                  }
                />
                <ToggleIcon />
              </label>
              <span
                className={`flex items-center gap-2 text-[1.4rem] font-medium transition-colors duration-200 ${billingCycle === "yearly" ? "text-black" : "text-neutral-400"}`}
              >
                {t("payment.billing_yearly")}
                <span className="text-[1rem] font-bold text-primary-500">
                  {t("payment.billing_save")}
                </span>
              </span>
            </div>

            {/* Plan cards */}
            <div className="flex flex-col lg:flex-row items-stretch gap-6">
              {/* PRO */}
              {proTier && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className={`flex-1 flex flex-col gap-8 rounded-[30px] bg-neutral-100 p-4 ${currentPlan === "pro" && isRenewing ? "opacity-60" : ""}`}
                >
                  {/* Header */}
                  <div className="bg-white rounded-[20px] p-8 flex flex-col gap-[3.5rem]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        {billingCycle === "yearly" && (
                          <span className="text-neutral-400 text-[1.4rem] font-primary line-through leading-none">
                            {originalPrice(proTier)}
                          </span>
                        )}
                        <span className="text-black font-medium text-[1.5rem] leading-8">
                          {displayPrice(proTier)}
                          <span className="text-neutral-400"> /mo</span>
                        </span>
                      </div>
                      <span className="shrink-0 text-[1rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-primary-500/10 text-primary-500">
                        {currentPlan === "pro" && !isOnTrial
                          ? t("pro.tag")
                          : t("pro.most")}
                      </span>
                    </div>
                    <span className="text-black text-[3rem] lg:text-[4rem] leading-[100%] font-primary font-medium text-center">
                      {t("pro.title")}
                    </span>
                  </div>

                  {/* CTA */}
                  {currentPlan === "pro" && isRenewing ? (
                    <p className="text-center text-[1.3rem] font-medium text-primary-500 py-2">
                      {t("pro.tag")} ✓
                    </p>
                  ) : (
                    <div className="px-2">
                      <ButtonPrimary
                        onClick={() => selectPlan(proTier)}
                        className="w-full"
                      >
                        <Crown
                          size="18"
                          color="#fff"
                          variant="Bulk"
                          className="mr-3"
                        />
                        {t("payment.upgrade")}
                      </ButtonPrimary>
                    </div>
                  )}

                  {/* Features */}
                  <ul className="flex flex-col gap-4 px-2">
                    <Feature>{t("pro.list.2")}</Feature>
                    <Feature>{t("pro.list.3")}</Feature>
                    <Feature>{t("pro.list.4")}</Feature>
                    <Feature>{t("pro.list.5")}</Feature>
                    <Feature>{t("pro.list.6")}</Feature>
                    <Feature>{t("pro.list.7")}</Feature>
                  </ul>
                </motion.div>
              )}

              {/* PREMIUM — same card, distinguished by the gradient border */}
              {premiumTier && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className={`flex-1 p-[2px] rounded-[30px] bg-linear-to-b from-primary-500 via-[#E752AE] to-[#DD068B] ${currentPlan === "premium" ? "opacity-60" : ""}`}
                >
                  <div className="h-full flex flex-col gap-8 rounded-[28px] bg-neutral-100 p-4">
                    {/* Header */}
                    <div className="bg-white rounded-[20px] p-8 flex flex-col gap-[3.5rem]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          {billingCycle === "yearly" && (
                            <span className="text-neutral-400 text-[1.4rem] font-primary line-through leading-none">
                              {originalPrice(premiumTier)}
                            </span>
                          )}
                          <span className="text-black font-medium text-[1.5rem] leading-8">
                            {displayPrice(premiumTier)}
                            <span className="text-neutral-400"> /mo</span>
                          </span>
                        </div>
                        {currentPlan === "premium" && (
                          <span className="shrink-0 text-[1rem] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-primary-500/10 text-primary-500">
                            {t("pro.tag")}
                          </span>
                        )}
                      </div>
                      <span className="text-black text-[3rem] lg:text-[4rem] leading-[100%] font-primary font-medium text-center">
                        {t("premium.title")}
                      </span>
                    </div>

                    {/* CTA */}
                    {currentPlan === "premium" ? (
                      <p className="text-center text-[1.3rem] font-medium text-primary-500 py-2">
                        {t("pro.tag")} ✓
                      </p>
                    ) : (
                      <div className="px-2">
                        {/* Premium self-serve is disabled for now — route to sales. */}
                        <ButtonPrimary
                          onClick={() =>
                            window.open(
                              `${process.env.NEXT_PUBLIC_WEBSITE_URL}/${locale}/contact`,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                          className="w-full"
                        >
                          {t("premium.cta")}
                        </ButtonPrimary>
                      </div>
                    )}

                    {/* Features: core set, then the "+" extras */}
                    <ul className="flex flex-col gap-4 px-2">
                      <Feature>{t("premium.list.2")}</Feature>
                      <Feature>{t("premium.list.3")}</Feature>
                      <Feature>{t("premium.list.4")}</Feature>
                      <Feature>{t("pro.list.5")}</Feature>
                      <Feature>{t("pro.list.6")}</Feature>
                      <Feature>{t("pro.list.7")}</Feature>
                      <PlusDivider />
                      <Feature accent>{t("premium.list.5")}</Feature>
                      <Feature accent>{t("premium.list.6")}</Feature>
                      <Feature accent>
                        {t("premium.list.7")}
                        <VerifiedOrganisationCheckMark />
                      </Feature>
                    </ul>
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
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-start">
              {/* Method selection */}
              <div className="flex flex-col gap-4">
                <h3 className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-2">
                  {t("payment.step_payment")}
                </h3>

                <button
                  className={optionClass("moncash")}
                  onClick={() => payWithWallet("moncash")}
                  disabled={processing !== null}
                >
                  <div className="flex items-center gap-4">
                    <Image src={moncash} alt="MonCash" />
                    <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                      {t("payment.pay_moncash")}
                    </span>
                  </div>
                  {processing === "moncash" ? (
                    <LoadingCircleSmall />
                  ) : (
                    <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
                  )}
                </button>

                {NATCASH_ENABLED && (
                  <button
                    className={optionClass("natcash")}
                    onClick={() => payWithWallet("natcash")}
                    disabled={processing !== null}
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={natcash}
                        alt="NatCash"
                        width={20}
                        height={21}
                      />
                      <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                        {t("payment.pay_natcash")}
                      </span>
                    </div>
                    {processing === "natcash" ? (
                      <LoadingCircleSmall />
                    ) : (
                      <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
                    )}
                  </button>
                )}

                <button
                  className={optionClass("stripe")}
                  onClick={payWithCard}
                  disabled={processing !== null}
                >
                  <div className="flex items-center gap-4">
                    <Card size="20" color="#0d0d0d" variant="Bulk" />
                    <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                      {t("payment.pay_card")}
                    </span>
                  </div>
                  {processing === "stripe" ? (
                    <LoadingCircleSmall />
                  ) : (
                    <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
                  )}
                </button>

                {/* Security notice */}
                <div className="flex flex-col items-start gap-4 p-6 rounded-[15px] border border-neutral-100 text-[1.2rem] leading-8 text-neutral-700">
                  <ShieldSecurity size="20" color="#E45B00" />
                  {t("payment.secured")}
                </div>
              </div>

              {/* Brand mark (desktop) */}
              <div className="hidden lg:flex items-center justify-center">
                <Image
                  src={pinwheel}
                  alt="Ticketwaze"
                  className="w-full max-w-[42rem] h-auto"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stripe embedded checkout — opens in a modal, like attendee checkout */}
      <Dialog
        open={stripeDialogOpen}
        onOpenChange={(open) => {
          setStripeDialogOpen(open);
          if (!open) setClientSecret(null);
        }}
      >
        <DialogContent className="max-w-240 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("payment.pay_card")}</DialogTitle>
          </DialogHeader>
          {clientSecret && (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout className="w-full" />
            </EmbeddedCheckoutProvider>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
