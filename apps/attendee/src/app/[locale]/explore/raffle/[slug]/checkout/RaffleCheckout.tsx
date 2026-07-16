"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Add,
  ArrowRight2,
  Card,
  Minus,
  MoneyRecive,
  ShieldSecurity,
} from "iconsax-reactjs";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Raffle } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { useRouter, Link } from "@/i18n/navigation";
import {
  BuyRaffleEntriesWallet,
  StartRaffleStripe,
  StartRaffleMoncash,
  StartRaffleGuestStripe,
  StartRaffleGuestMoncash,
} from "@/actions/paymentActions";
import moncashLogo from "../../../[slug]/checkout/moncash.svg";
import { ButtonPrimary } from "@/components/shared/buttons";
import BackButton from "@/components/shared/BackButton";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Logo from "../../../[slug]/checkout/Logo.svg";

// Mirrors app/controllers/utils/raffle_pricing.ts so shown totals match the
// charge. Raffle tiers: <500 HTG → +25 flat, 500–1000 HTG → +50 flat, then
// provider %; above 1000 HTG the standard event pricing applies.
const SERVICE_FEE_RATE = 0.03;
const PER_TICKET_FEE_USD = 1.49;
const PER_TICKET_FEE_HTG_LOW = 100;
const HTG_LOW_THRESHOLD = 500;
const STRIPE_TX_FEE_RATE = 0.03;
const MONCASH_TX_FEE_RATE = 0.025;
const RAFFLE_LOW_THRESHOLD_HTG = 500;
const RAFFLE_MID_THRESHOLD_HTG = 1000;
const RAFFLE_FLAT_FEE_LOW_HTG = 25;
const RAFFLE_FLAT_FEE_MID_HTG = 50;
const round2 = (n: number) => Math.round(n * 100) / 100;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type Method = "" | "wallet" | "card" | "moncash";

export default function RaffleCheckout({
  raffle,
  slug,
  remaining,
  htgExchangeRate,
  walletHtg,
  walletUsd,
  feeWaived,
  isLoggedIn,
  accessToken,
}: {
  raffle: Raffle;
  slug: string;
  remaining: number | null;
  htgExchangeRate: number;
  walletHtg: number;
  walletUsd: number;
  feeWaived: boolean;
  isLoggedIn: boolean;
  accessToken: string;
}) {
  const t = useTranslations("Raffle.checkout");
  const ct = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<Method>("");
  const [paying, setPaying] = useState(false);
  // Guest buyer details (shown only when signed out).
  const [guestFirst, setGuestFirst] = useState("");
  const [guestLast, setGuestLast] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const [stripeOpen, setStripeOpen] = useState(false);

  const maxQty = remaining !== null ? Math.max(0, remaining) : 20;

  const pricing = useMemo(() => {
    const isUsd = raffle.currency === "USD";
    const rate = htgExchangeRate || 1;
    // ticketPrice is the canonical HTG base; the tier is decided on it.
    const htgBase = Number(raffle.ticketPrice);
    const usdBase = Number(raffle.usdPrice);
    const base = isUsd ? usdBase : htgBase;

    // Raffle flat Ticketwaze fee (HTG). null => event pricing (> 1000 HTG).
    const flat =
      htgBase < RAFFLE_LOW_THRESHOLD_HTG
        ? RAFFLE_FLAT_FEE_LOW_HTG
        : htgBase <= RAFFLE_MID_THRESHOLD_HTG
          ? RAFFLE_FLAT_FEE_MID_HTG
          : null;
    const perFeeHtg =
      htgBase <= HTG_LOW_THRESHOLD
        ? PER_TICKET_FEE_HTG_LOW
        : PER_TICKET_FEE_USD * rate;

    // Wallet — no processor fee, shown in the raffle currency.
    let walletPerEntry: number;
    if (feeWaived) walletPerEntry = base;
    else if (flat === null)
      walletPerEntry = isUsd
        ? round2(usdBase * (1 + SERVICE_FEE_RATE) + PER_TICKET_FEE_USD)
        : round2(htgBase * (1 + SERVICE_FEE_RATE) + perFeeHtg);
    else walletPerEntry = isUsd ? round2(usdBase + flat / rate) : round2(htgBase + flat);

    // Stripe — charged in USD.
    let stripePerEntryUsd: number;
    if (feeWaived) stripePerEntryUsd = usdBase;
    else if (flat === null)
      stripePerEntryUsd = round2(
        ((htgBase * (1 + SERVICE_FEE_RATE) + perFeeHtg) *
          (1 + STRIPE_TX_FEE_RATE)) /
          rate,
      );
    else
      stripePerEntryUsd = round2(
        (usdBase + flat / rate) * (1 + STRIPE_TX_FEE_RATE),
      );

    // MonCash — charged in HTG.
    let moncashPerEntryHtg: number;
    if (feeWaived) moncashPerEntryHtg = htgBase;
    else if (flat === null)
      moncashPerEntryHtg = round2(
        (htgBase * (1 + SERVICE_FEE_RATE) + perFeeHtg) *
          (1 + MONCASH_TX_FEE_RATE),
      );
    else moncashPerEntryHtg = round2((htgBase + flat) * (1 + MONCASH_TX_FEE_RATE));

    return {
      base,
      usdBase,
      htgBase,
      currency: raffle.currency as "HTG" | "USD",
      walletPerEntry,
      stripePerEntryUsd,
      moncashPerEntryHtg,
      walletBalance: isUsd ? walletUsd : walletHtg,
    };
  }, [raffle, htgExchangeRate, walletHtg, walletUsd, feeWaived]);

  const isCard = method === "card";
  const isMoncash = method === "moncash";
  const displayCurrency = isCard ? "USD" : isMoncash ? "HTG" : pricing.currency;
  const perEntry = isCard
    ? pricing.stripePerEntryUsd
    : isMoncash
      ? pricing.moncashPerEntryHtg
      : pricing.walletPerEntry;
  const baseForDisplay = isCard
    ? pricing.usdBase
    : isMoncash
      ? pricing.htgBase
      : pricing.base;

  const subtotal = round2(baseForDisplay * quantity);
  const total = round2(perEntry * quantity);
  const fees = round2(total - subtotal);
  const insufficient = method === "wallet" && pricing.walletBalance < total;

  const optionClass = (type: Method) =>
    `flex items-center justify-between cursor-pointer p-[15px] rounded-[15px] border transition-all ease-in-out duration-300 ${
      method === type
        ? "border-2 border-primary-500 bg-primary-50"
        : "border-neutral-100 hover:border-primary-500"
    }`;

  async function pay() {
    if (!method) {
      toast.error(ct("payment.paymentType"));
      return;
    }

    // Guest checkout: capture the buyer details, then use the guest endpoints.
    if (!isLoggedIn) {
      const guest = {
        firstName: guestFirst.trim(),
        lastName: guestLast.trim(),
        email: guestEmail.trim(),
      };
      if (!guest.firstName || !guest.lastName || !guest.email) {
        toast.error(t("guest.required"));
        return;
      }
      setPaying(true);
      if (isCard) {
        const result = await StartRaffleGuestStripe(
          raffle.raffleId,
          quantity,
          guest,
          locale,
        );
        if (result.status === "success" && result.clientSecret) {
          setStripeClientSecret(result.clientSecret);
          setStripeOpen(true);
        } else {
          toast.error(
            ("message" in result && result.message) ||
              ("error" in result && result.error) ||
              "",
          );
        }
        setPaying(false);
      } else {
        const result = await StartRaffleGuestMoncash(
          raffle.raffleId,
          quantity,
          guest,
          locale,
        );
        if (result.status === "success" && result.paymentURL) {
          window.location.href = result.paymentURL;
        } else {
          toast.error(
            ("message" in result && result.message) ||
              ("error" in result && result.error) ||
              "",
          );
          setPaying(false);
        }
      }
      return;
    }

    setPaying(true);
    if (isCard) {
      const result = await StartRaffleStripe(
        accessToken,
        raffle.raffleId,
        quantity,
        locale,
      );
      if (result.status === "success" && result.clientSecret) {
        setStripeClientSecret(result.clientSecret);
        setStripeOpen(true);
      } else {
        toast.error(
          ("message" in result && result.message) ||
            ("error" in result && result.error) ||
            "",
        );
      }
      setPaying(false);
      return;
    }
    if (isMoncash) {
      const result = await StartRaffleMoncash(
        accessToken,
        raffle.raffleId,
        quantity,
        locale,
      );
      if (result.status === "success" && result.paymentURL) {
        window.location.href = result.paymentURL;
      } else {
        toast.error(
          ("message" in result && result.message) ||
            ("error" in result && result.error) ||
            "",
        );
        setPaying(false);
      }
      return;
    }
    const result = await BuyRaffleEntriesWallet(
      accessToken,
      raffle.raffleId,
      quantity,
      locale,
    );
    if (result.status === "success") {
      toast.success(t("success"));
      router.push(`/explore/raffle/${slug}`);
    } else {
      toast.error(
        ("message" in result && result.message) ||
          ("error" in result && result.error) ||
          "",
      );
      setPaying(false);
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex flex-col gap-4">
        <BackButton text={ct("back")} />
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {raffle.title}
        </span>
      </div>
      <main className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto pb-4 lg:pb-0 lg:overflow-hidden lg:grid lg:grid-cols-[29fr_23fr] lg:grid-rows-1 gap-8">
        <div className="flex flex-col gap-8 lg:h-full lg:min-h-0 lg:overflow-y-auto">
          {/* Quantity */}
          <div className="flex items-center justify-between p-[15px] rounded-[15px] border border-neutral-100">
            <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
              {t("quantity")}
            </span>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center disabled:opacity-40 cursor-pointer"
              >
                <Minus size="18" color="#0d0d0d" />
              </button>
              <span className="text-[1.8rem] font-medium w-10 text-center">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) => {
                    if (q >= maxQty) {
                      toast.error(t("max", { count: maxQty }));
                      return q;
                    }
                    return q + 1;
                  })
                }
                disabled={quantity >= maxQty}
                className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center disabled:opacity-40 cursor-pointer"
              >
                <Add size="18" color="#ffffff" />
              </button>
            </div>
          </div>

          {/* Guest details */}
          {!isLoggedIn && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                  {t("guest.title")}
                </span>
                <Link
                  href="/auth/login"
                  className="text-[1.4rem] text-primary-500 leading-8"
                >
                  {t("login")}
                </Link>
              </div>
              <div className="flex flex-col lg:flex-row gap-4">
                <input
                  value={guestFirst}
                  onChange={(e) => setGuestFirst(e.target.value)}
                  placeholder={t("guest.firstName")}
                  className="bg-neutral-100 w-full rounded-[15px] p-[15px] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500"
                />
                <input
                  value={guestLast}
                  onChange={(e) => setGuestLast(e.target.value)}
                  placeholder={t("guest.lastName")}
                  className="bg-neutral-100 w-full rounded-[15px] p-[15px] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500"
                />
              </div>
              <input
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                type="email"
                placeholder={t("guest.email")}
                className="bg-neutral-100 w-full rounded-[15px] p-[15px] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500"
              />
            </div>
          )}

          {/* Payment method */}
          <div className="flex flex-col gap-4">
            <button
              className={optionClass("moncash")}
              onClick={() => setMethod("moncash")}
            >
              <div className="flex items-center gap-4">
                <Image src={moncashLogo} alt="MonCash" />
                <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                  {ct("payment.moncash")}
                </span>
              </div>
              <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
            </button>
            <button
              className={optionClass("card")}
              onClick={() => setMethod("card")}
            >
              <div className="flex items-center gap-4">
                <Card size="20" color="#0d0d0d" variant="Bulk" />
                <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                  {ct("payment.card")}
                </span>
              </div>
              <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
            </button>
            {isLoggedIn && (
              <button
                className={optionClass("wallet")}
                onClick={() => setMethod("wallet")}
              >
                <div className="flex items-center gap-4">
                  <MoneyRecive size="20" color="#0d0d0d" variant="Bulk" />
                  <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                    {ct("payment.wallet")}
                  </span>
                </div>
                <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
              </button>
            )}
            <div className="flex flex-col items-start gap-4 p-6 rounded-[15px] border border-neutral-100 text-[1.2rem] leading-8 text-neutral-700">
              <ShieldSecurity size="20" color="#E45B00" />
              {ct("payment.secured")}
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-4 rounded-[15px] border border-neutral-100 p-6">
            <Row
              label={t("subtotal")}
              value={formatMoney(subtotal, displayCurrency, locale)}
            />
            <Row
              label={t("fees")}
              value={formatMoney(fees, displayCurrency, locale)}
            />
            <div className="border-t border-neutral-100 pt-4">
              <Row
                label={t("total")}
                value={formatMoney(total, displayCurrency, locale)}
                bold
              />
            </div>
            {method === "wallet" && (
              <div className="flex items-center justify-between text-[1.3rem] text-neutral-600 pt-2">
                <span>{t("walletBalance")}</span>
                <span>
                  {formatMoney(pricing.walletBalance, displayCurrency, locale)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: brand panel — same as the event checkout */}
        <div className="lg:flex items-center justify-center h-full hidden">
          <Image src={Logo} width={300} alt="Ticketwaze" />
        </div>
      </main>

      <div className="shrink-0 pt-4">
        <ButtonPrimary
          onClick={pay}
          disabled={paying || insufficient || maxQty === 0}
          className="w-full"
        >
          {paying ? (
            <LoadingCircleSmall />
          ) : insufficient ? (
            t("insufficient")
          ) : (
            `${t("total")} · ${formatMoney(total, displayCurrency, locale)}`
          )}
        </ButtonPrimary>
      </div>

      {/* Stripe embedded checkout */}
      <Dialog open={stripeOpen} onOpenChange={setStripeOpen}>
        <DialogContent className="max-w-240 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ct("payment.card")}</DialogTitle>
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
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-[1.5rem] ${bold ? "font-medium text-deep-100" : "text-neutral-600"}`}
      >
        {label}
      </span>
      <span
        className={`text-[1.5rem] ${bold ? "font-medium text-deep-100" : "text-neutral-700"}`}
      >
        {value}
      </span>
    </div>
  );
}
