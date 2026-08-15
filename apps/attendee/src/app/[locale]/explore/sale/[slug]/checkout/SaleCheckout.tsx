"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft2 } from "iconsax-reactjs";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { PublicSale } from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import { useRouter, Link } from "@/i18n/navigation";
import {
  BuySaleWallet,
  StartSaleStripe,
  StartSaleMoncash,
  StartSaleNatcash,
  CheckSaleRecipient,
  InviteSaleRecipient,
} from "@/actions/paymentActions";
import { ButtonPrimary } from "@/components/shared/buttons";
import BackButton from "@/components/shared/BackButton";
import PageLoader from "@/components/PageLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SaleSummaryCard from "./SaleSummaryCard";
import ProductStep from "./steps/ProductStep";
import SaleRecipientStep from "./steps/SaleRecipientStep";
import SalePaymentStep from "./steps/SalePaymentStep";
import SaleSummaryStep from "./steps/SaleSummaryStep";
import type { RecipientCheck, SalePaymentMethod } from "./saleCheckout.types";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

/**
 * BUYING A DIGITAL PRODUCT, AS A FOUR-STEP FLOW.
 *
 * Built to match the event checkout exactly — same header, same animated step
 * bodies, same footer with the progress rail on desktop and an n/4 counter on
 * mobile, same persistent summary in the desktop sidebar. It used to be a
 * single scrolling page, which made a purchase of a paid file feel like a
 * different product from a purchase of a ticket.
 *
 * The steps are: what you are buying, who it is for, how you pay, then
 * everything once before the money moves.
 *
 * **The price is never computed here.** `sale.pricing.buyerPays` comes from the
 * API, which derives it from the sale's currency and the fee rule. The ticket
 * checkout recomputes fees client-side to preview them; doing that here would
 * mean two implementations of one surcharge that could disagree. Nothing in
 * this component sends an amount.
 */
export default function SaleCheckout({
  sale,
  walletUsd,
}: {
  sale: PublicSale;
  /** Wallet balance in USD, for the insufficient-funds hint. */
  walletUsd: number;
}) {
  const t = useTranslations("Sale");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState(0);
  const [previousStep, setPreviousStep] = useState(0);
  const delta = currentStep - previousStep;

  const [method, setMethod] = useState<SalePaymentMethod>("");
  const [isLoading, setIsLoading] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);

  /* ── Buying for someone else ─────────────────────────────────────────── */
  const [isGift, setIsGift] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientCheck, setRecipientCheck] = useState<RecipientCheck | null>(
    null,
  );
  const [inviteSent, setInviteSent] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isLoggedIn = Boolean(session?.user);
  const accessToken = session?.user.accessToken ?? "";

  const trimmedRecipient = recipientEmail.trim().toLowerCase();
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedRecipient);
  /**
   * Derived, not stored: the check carries the address it answers, so a result
   * for a stale address cannot read as an answer for what is currently typed.
   */
  const isChecking =
    isGift && looksLikeEmail && recipientCheck?.email !== trimmedRecipient;
  const confirmedRecipient =
    isGift && recipientCheck?.canReceive ? recipientCheck : null;

  const walletShort =
    walletUsd < sale.pricing.buyerPays && sale.currencyCode === "USD";

  const goToStep = (step: number) => {
    setPreviousStep(currentStep);
    setCurrentStep(step);
  };

  /**
   * Verify the address as it is typed, aborting the previous check.
   *
   * Without the abort a slow early answer can land after a faster later one and
   * describe an address the buyer has already corrected — which here would mean
   * letting them past the step with the wrong person confirmed.
   */
  useEffect(() => {
    abortRef.current?.abort();

    if (!isGift || !looksLikeEmail || !accessToken) return;

    const controller = new AbortController();
    abortRef.current = controller;

    CheckSaleRecipient(accessToken, sale.saleId, trimmedRecipient, locale)
      .then((result) => {
        if (controller.signal.aborted) return;
        setRecipientCheck({
          email: trimmedRecipient,
          found: result.found,
          canReceive: result.canReceive,
          firstName: result.firstName,
          message: result.message,
        });
        setInviteSent(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setRecipientCheck({
          email: trimmedRecipient,
          found: false,
          canReceive: false,
          message: null,
        });
      });

    return () => controller.abort();
  }, [
    isGift,
    looksLikeEmail,
    trimmedRecipient,
    accessToken,
    sale.saleId,
    locale,
  ]);

  async function invite() {
    setIsLoading(true);
    const result = await InviteSaleRecipient(
      accessToken,
      sale.saleId,
      trimmedRecipient,
      locale,
    );
    setIsLoading(false);
    if (result.status === "success") {
      setInviteSent(true);
      toast.success(t("gift.inviteSent"));
    } else {
      toast.error(result.message ?? t("failed"));
    }
  }

  /** The last step's action. Everything before it just advances. */
  async function pay() {
    const giftTo = confirmedRecipient ? trimmedRecipient : undefined;
    setIsLoading(true);

    if (method === "wallet") {
      const result = await BuySaleWallet(
        accessToken,
        sale.saleId,
        locale,
        giftTo,
      );
      if (result.status === "success") {
        toast.success(t("purchaseComplete"));
        router.push("/purchases");
      } else {
        // The API's own words: "you already own this", "Marie already owns
        // this", "not on sale" all need to reach the buyer intact.
        toast.error(result.message ?? t("failed"));
      }
      setIsLoading(false);
      return;
    }

    if (method === "card") {
      const result = await StartSaleStripe(
        accessToken,
        sale.saleId,
        locale,
        giftTo,
      );
      if (result.status === "success" && result.clientSecret) {
        setStripeClientSecret(result.clientSecret);
        setStripeDialogOpen(true);
      } else {
        toast.error(result.message ?? t("failed"));
      }
      setIsLoading(false);
      return;
    }

    const result =
      method === "moncash"
        ? await StartSaleMoncash(accessToken, sale.saleId, locale, giftTo)
        : await StartSaleNatcash(accessToken, sale.saleId, locale, giftTo);

    if (result.status === "success" && result.paymentURL) {
      window.location.href = result.paymentURL;
      return;
    }
    toast.error(result.message ?? t("failed"));
    setIsLoading(false);
  }

  const prev = () => {
    if (currentStep === 0) return;
    goToStep(currentStep - 1);
  };

  const handleNext = () => {
    /**
     * The recipient step will not release a half-answered gift. Both refusals
     * are the API's rules restated early — it checks them again before charging
     * anything, this only saves the buyer the trip.
     */
    if (currentStep === 1 && isGift) {
      if (isChecking) return;
      if (!recipientCheck?.canReceive) {
        toast.error(recipientCheck?.message ?? t("gift.enterValidRecipient"));
        return;
      }
    }

    if (currentStep === 3) {
      void pay();
      return;
    }

    goToStep(currentStep + 1);
  };

  const stepTitle = [
    t("steps.product"),
    t("steps.recipient"),
    t("steps.payment"),
    t("steps.summary"),
  ][currentStep];

  const stepLabels = [
    t("steps.product"),
    t("steps.recipient"),
    t("steps.payment"),
    t("steps.summary"),
  ];

  const isFooterButtonDisabled =
    isLoading ||
    // A gift cannot leave step 2 unresolved, and no method means nothing to pay.
    (currentStep === 1 &&
      isGift &&
      (isChecking || !recipientCheck?.canReceive)) ||
    (currentStep === 2 && !method) ||
    (currentStep === 3 && !method);

  /**
   * Guest checkout is not built for products, so signing in is required rather
   * than silently offered and then refused by the API. Shown instead of the
   * flow entirely: there is nothing useful to step through without an account,
   * since even the first step ends at a wall.
   */
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col gap-8 max-w-200 w-full mx-auto pb-16">
        <BackButton text={t("back")} />
        <div className="flex flex-col gap-4 rounded-[15px] border border-neutral-100 p-6">
          <span className="text-[1.5rem] leading-8 text-neutral-700">
            {t("loginToBuy")}
          </span>
          <Link
            href="/auth/login"
            className="text-[1.5rem] text-primary-500 leading-8"
          >
            {t("login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLoader isLoading={isLoading} />
      <div className="h-full min-h-0 flex flex-col">
        {/* Header — the back arrow becomes a step-back once past the first. */}
        <div className="shrink-0 flex flex-col gap-4">
          {currentStep === 0 ? (
            <BackButton text={t("back")} />
          ) : (
            <button
              onClick={prev}
              className="flex max-w-32 cursor-pointer items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
                <ArrowLeft2 size="20" color="#0d0d0d" variant="Bulk" />
              </div>
              <span className="text-neutral-700 font-normal text-[1.4rem] leading-8">
                {t("back")}
              </span>
            </button>
          )}
          <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
            {stepTitle}
          </span>
        </div>

        {/* The mobile padding clears the pinned footer above: without it the
            last card of every step sits underneath the bar and cannot be read
            or tapped. Desktop needs none — the bar is in flow there. */}
        <main className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto pb-[9rem] lg:pb-0 lg:overflow-hidden lg:grid lg:grid-cols-[29fr_23fr] lg:grid-rows-1 gap-8">
          {currentStep === 0 && <ProductStep delta={delta} sale={sale} />}

          {currentStep === 1 && (
            <SaleRecipientStep
              delta={delta}
              isGift={isGift}
              onToggleGift={(next) => {
                setIsGift(next);
                // Cleared together: a stale verdict for an address the buyer
                // has abandoned must not survive to gate the footer button.
                setRecipientEmail("");
                setRecipientCheck(null);
                setInviteSent(false);
              }}
              recipientEmail={recipientEmail}
              onRecipientEmailChange={setRecipientEmail}
              recipientCheck={recipientCheck}
              isChecking={isChecking}
              inviteSent={inviteSent}
              onInvite={invite}
              isInviting={isLoading}
            />
          )}

          {currentStep === 2 && (
            <SalePaymentStep
              delta={delta}
              method={method}
              onSelect={setMethod}
              walletShort={walletShort}
            />
          )}

          {currentStep === 3 && (
            <SaleSummaryStep
              delta={delta}
              sale={sale}
              method={method}
              recipientName={confirmedRecipient?.firstName}
              recipientEmail={confirmedRecipient ? trimmedRecipient : null}
            />
          )}

          {/* Desktop sidebar — always visible, so the goods and the price never
              leave the screen while the buyer is deciding how to pay. */}
          <div className="hidden lg:flex lg:flex-col overflow-y-auto min-h-0 p-4 pt-0">
            <SaleSummaryCard
              sale={sale}
              recipientName={confirmedRecipient?.firstName}
            />
          </div>
        </main>

        {/*
          THE FOOTER IS PINNED ON MOBILE, IN FLOW ON DESKTOP.

          On desktop the layout bounds this column's height, so `flex-1` on the
          main area creates the scroll and the footer simply sits below it.

          On mobile nothing bounds it: `AttendeeLayout` is `min-h-dvh` and its
          card is `min-h-[...]`, so the column grows with its content, `flex-1`
          bounds nothing, and the bar scrolled away with the page — the buyer
          had to scroll to the very bottom to find Continue on every step.

          `fixed` rather than `sticky` because sticky cannot work here: `main`
          and the layout card both carry `overflow-x-hidden`, which makes them
          scroll containers, and a sticky child sticks to THOSE rather than to
          the viewport — which, since neither actually scrolls, means it does
          not move at all.

          The offsets: `bottom` clears the fixed MobileNavigation (the card
          already reserves the same 9rem + safe-area for it), and the 3rem
          insets match the card's content edges — the layout's own 1.5rem
          padding plus the card's 1.5rem.
        */}
        <div className="fixed left-[3rem] right-[3rem] bottom-[calc(9rem+env(safe-area-inset-bottom))] z-40 lg:static lg:z-auto lg:shrink-0 mt-3 py-4 px-6 border border-neutral-100 bg-white rounded-[40px] flex items-center w-auto lg:w-full justify-between mb-4 shadow-lg lg:shadow-none">
          <div className="hidden lg:flex gap-3 items-center">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className={`text-[1.5rem] leading-12 ${
                    currentStep >= i
                      ? "text-primary-500 font-medium"
                      : "text-neutral-600 font-normal"
                  }`}
                >
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`w-48 h-2 rounded-[100px] ${
                      currentStep > i ? "bg-primary-500" : "bg-neutral-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="text-[2.2rem] lg:hidden leading-12 text-neutral-600">
            <span className="text-primary-500">{currentStep + 1}</span>/4
          </div>

          <ButtonPrimary disabled={isFooterButtonDisabled} onClick={handleNext}>
            {currentStep === 3 ? t("payNow") : t("continue")}
          </ButtonPrimary>
        </div>
      </div>

      <Dialog open={stripeDialogOpen} onOpenChange={setStripeDialogOpen}>
        <DialogContent className="max-w-240 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("cardPayment")}</DialogTitle>
          </DialogHeader>
          {stripeClientSecret && (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret: stripeClientSecret }}
            >
              <EmbeddedCheckout className="w-full" />
            </EmbeddedCheckoutProvider>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
