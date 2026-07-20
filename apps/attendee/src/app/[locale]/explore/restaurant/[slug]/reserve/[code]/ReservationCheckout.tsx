"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, MoneyRecive, ShieldSecurity } from "iconsax-reactjs";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { formatMoney } from "@ticketwaze/currency";
import { useRouter } from "@/i18n/navigation";
import {
  PayReservationWallet,
  StartReservationStripe,
  StartReservationMoncash,
} from "@/actions/reservationActions";
import { ButtonPrimary } from "@/components/shared/buttons";
import BackButton from "@/components/shared/BackButton";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import moncashLogo from "../../../../[slug]/checkout/moncash.svg";

/**
 * Mirrors app/controllers/utils/restaurant_pricing.ts so the total shown here is
 * the total charged. Restaurants are PERCENTAGE-ONLY — no flat per-item fee,
 * unlike events and raffles.
 */
const SERVICE_FEE_RATE = 0.03;
const STRIPE_TX_FEE_RATE = 0.03;
const MONCASH_TX_FEE_RATE = 0.025;
const round2 = (n: number) => Math.round(n * 100) / 100;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type Method = "" | "wallet" | "card" | "moncash";

export interface HeldReservation {
  reservationId: string;
  reservationCode: string;
  restaurantId: string;
  partySize: number;
  reservedFor: string;
  fee: number;
  usdFee: number;
  currency: string;
  status: "pending" | "confirmed" | "seated" | "cancelled" | "no_show";
  holdExpiresAt: string | null;
  guestName: string;
  restaurant?: { name: string; slug: string };
}

export default function ReservationCheckout({
  reservation,
  slug,
  walletHtg,
  walletUsd,
  feeWaived,
  isLoggedIn,
  accessToken,
}: {
  reservation: HeldReservation;
  slug: string;
  walletHtg: number;
  walletUsd: number;
  feeWaived: boolean;
  isLoggedIn: boolean;
  accessToken: string;
}) {
  const t = useTranslations("Event.reserve");
  const ct = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();

  const [method, setMethod] = useState<Method>("");
  const [paying, setPaying] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const [stripeOpen, setStripeOpen] = useState(false);

  // The hold is the thing that expires, so it is counted down in front of the
  // guest rather than failing silently when they finally press pay.
  const [secondsLeft, setSecondsLeft] = useState(() =>
    reservation.holdExpiresAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(reservation.holdExpiresAt).getTime() - Date.now()) / 1000,
          ),
        )
      : 0,
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const expired = reservation.status === "pending" && secondsLeft <= 0;
  const alreadyPaid = reservation.status !== "pending";

  const pricing = useMemo(() => {
    const isUsd = reservation.currency === "USD";
    const htgBase = Number(reservation.fee);
    const usdBase = Number(reservation.usdFee);
    const base = isUsd ? usdBase : htgBase;

    const walletTotal = feeWaived ? base : round2(base * (1 + SERVICE_FEE_RATE));
    // The server checks the USD side of the wallet whatever the venue's
    // currency, so this must too or the button enables and the request 400s.
    const walletTotalUsd = feeWaived
      ? usdBase
      : round2(usdBase * (1 + SERVICE_FEE_RATE));
    const stripeUsd = feeWaived
      ? usdBase
      : round2(usdBase * (1 + SERVICE_FEE_RATE) * (1 + STRIPE_TX_FEE_RATE));
    const moncashHtg = feeWaived
      ? htgBase
      : round2(htgBase * (1 + SERVICE_FEE_RATE) * (1 + MONCASH_TX_FEE_RATE));

    return {
      isUsd,
      base,
      htgBase,
      usdBase,
      currency: reservation.currency,
      walletTotal,
      walletTotalUsd,
      stripeUsd,
      moncashHtg,
      walletBalance: isUsd ? walletUsd : walletHtg,
    };
  }, [reservation, walletHtg, walletUsd, feeWaived]);

  const isCard = method === "card";
  const isMoncash = method === "moncash";
  const displayCurrency = isCard ? "USD" : isMoncash ? "HTG" : pricing.currency;
  const total = isCard
    ? pricing.stripeUsd
    : isMoncash
      ? pricing.moncashHtg
      : pricing.walletTotal;
  const subtotal = isCard
    ? pricing.usdBase
    : isMoncash
      ? pricing.htgBase
      : pricing.base;
  const fees = round2(total - subtotal);
  const insufficient = method === "wallet" && walletUsd < pricing.walletTotalUsd;

  const optionClass = (type: Method) =>
    `flex items-center justify-between cursor-pointer p-[15px] rounded-[15px] border transition-all ease-in-out duration-300 ${
      method === type
        ? "border-2 border-primary-500 bg-primary-50"
        : "border-neutral-100 hover:border-primary-500"
    }`;

  const when = new Date(reservation.reservedFor).toLocaleString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function pay() {
    if (!method) return toast.error(ct("payment.paymentType"));
    if (expired) return toast.error(t("hold_expired"));

    setPaying(true);

    if (isCard) {
      const result = await StartReservationStripe(
        reservation.reservationId,
        locale,
        isLoggedIn ? accessToken : undefined,
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
      const result = await StartReservationMoncash(
        reservation.reservationId,
        locale,
        isLoggedIn ? accessToken : undefined,
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

    const result = await PayReservationWallet(
      reservation.reservationId,
      accessToken,
      locale,
    );
    if (result.status === "success") {
      // Land on the confirmation, not back on the venue — the guest needs the
      // code they are about to be asked for at the door.
      router.push(`/explore/reservations/${reservation.reservationCode}`);
      return;
    }
    toast.error(
      ("message" in result && result.message) ||
        ("error" in result && result.error) ||
        "",
    );
    setPaying(false);
  }

  if (alreadyPaid) {
    return (
      <div className="flex flex-col gap-8 py-8 max-w-[520px]">
        <BackButton text={t("back")} />
        <h1 className="text-[2.6rem] font-medium leading-12 text-black font-primary">
          {t("already_confirmed")}
        </h1>
        <p className="text-[1.5rem] leading-8 text-neutral-600">
          {t("code_is", { code: reservation.reservationCode })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 py-8 max-w-[720px]">
      <BackButton text={t("back")} />

      <div className="flex flex-col gap-2">
        <h1 className="text-[2.6rem] font-medium leading-12 text-black font-primary">
          {t("checkout_title")}
        </h1>
        <p className="text-[1.5rem] leading-8 text-neutral-600">
          {reservation.restaurant?.name} · {when} ·{" "}
          {t("guests", { count: reservation.partySize })}
        </p>
      </div>

      {/* Seeing the hold run down is the difference between "pay now" meaning
          something and a guest losing the table without warning. */}
      {expired ? (
        <div className="p-6 rounded-[15px] bg-failure/10 flex flex-col gap-3">
          <p className="text-[1.5rem] leading-8 text-failure font-medium">
            {t("hold_expired")}
          </p>
          <ButtonPrimary
            className="w-fit"
            onClick={() => router.push(`/explore/restaurant/${slug}/reserve`)}
          >
            {t("pick_again")}
          </ButtonPrimary>
        </div>
      ) : (
        <div className="p-6 rounded-[15px] bg-neutral-100 flex items-center justify-between">
          <span className="text-[1.5rem] leading-8 text-neutral-600">
            {t("hold_countdown")}
          </span>
          <span className="text-[1.8rem] font-medium text-deep-100">
            {Math.floor(secondsLeft / 60)}:
            {String(secondsLeft % 60).padStart(2, "0")}
          </span>
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-[1.8rem] font-medium leading-10 text-black">
          {ct("payment.paymentType")}
        </h2>

        {isLoggedIn && (
          <button
            type="button"
            onClick={() => setMethod("wallet")}
            className={optionClass("wallet")}
          >
            <span className="flex items-center gap-4">
              <MoneyRecive size="24" color="#E45B00" variant="Bulk" />
              <span className="text-[1.5rem] leading-8 text-deep-100">
                {ct("payment.wallet")}
              </span>
            </span>
            <span className="text-[1.4rem] text-neutral-600">
              {formatMoney(pricing.walletBalance, pricing.currency, locale)}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setMethod("card")}
          className={optionClass("card")}
        >
          <span className="flex items-center gap-4">
            <Card size="24" color="#E45B00" variant="Bulk" />
            <span className="text-[1.5rem] leading-8 text-deep-100">
              {ct("payment.card")}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMethod("moncash")}
          className={optionClass("moncash")}
        >
          <span className="flex items-center gap-4">
            <Image src={moncashLogo} alt="MonCash" width={24} height={24} />
            <span className="text-[1.5rem] leading-8 text-deep-100">
              MonCash
            </span>
          </span>
        </button>
      </section>

      <section className="flex flex-col gap-3 border-t border-neutral-100 pt-6">
        <div className="flex items-center justify-between text-[1.5rem] text-neutral-600">
          <span>{ct("summary.subtotal")}</span>
          <span>{formatMoney(subtotal, displayCurrency, locale)}</span>
        </div>
        <div className="flex items-center justify-between text-[1.5rem] text-neutral-600">
          <span>{ct("summary.transaction_fee")}</span>
          <span>{formatMoney(fees, displayCurrency, locale)}</span>
        </div>
        <div className="flex items-center justify-between text-[1.8rem] font-medium text-deep-100 border-t border-neutral-100 pt-3">
          <span>{ct("summary.total")}</span>
          <span className="text-primary-500">
            {formatMoney(total, displayCurrency, locale)}
          </span>
        </div>
        <p className="text-[1.3rem] leading-7 text-neutral-600">
          {t("non_refundable")}
        </p>
      </section>

      {insufficient && (
        <span className="text-[1.3rem] text-failure">
          {t("insufficient")}
        </span>
      )}

      <ButtonPrimary
        className="w-full"
        disabled={paying || expired || insufficient || !method}
        onClick={pay}
      >
        {paying ? <LoadingCircleSmall /> : t("pay_now")}
      </ButtonPrimary>

      <div className="flex items-center gap-3 text-[1.3rem] text-neutral-600">
        <ShieldSecurity size="18" color="#737C8A" variant="Bulk" />
        <span>{ct("payment.secured")}</span>
      </div>

      <Dialog open={stripeOpen} onOpenChange={setStripeOpen}>
        <DialogContent className="w-xl lg:w-208 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Stripe</DialogTitle>
          </DialogHeader>
          {stripeClientSecret && (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret: stripeClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
