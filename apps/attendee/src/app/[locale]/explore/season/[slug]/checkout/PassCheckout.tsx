"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Add, ArrowRight2, Card, Minus, MoneyRecive } from "iconsax-reactjs";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { formatMoney } from "@ticketwaze/currency";
import { useSession } from "next-auth/react";
import { useRouter, Link } from "@/i18n/navigation";
import { isSuspendedResponse } from "@/lib/suspension";
import {
  BuySeasonPassWallet,
  PassQuote,
  QuoteSeasonPass,
  StartSeasonPassPayment,
} from "@/actions/seasonPassActions";
import moncashLogo from "../../../[slug]/checkout/moncash.svg";
import natcashLogo from "@/assets/images/natcash.png";
import Logo from "../../../[slug]/checkout/Logo.svg";
import { NATCASH_ENABLED } from "@/lib/paymentMethods";
import { ButtonPrimary } from "@/components/shared/buttons";
import BackButton from "@/components/shared/BackButton";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type Method = "" | "wallet" | "card" | "moncash" | "natcash";
/** The API's cap per order (season_pass_payments_controller). */
const MAX_PER_ORDER = 10;

export type CheckoutPass = {
  seasonPassTypeId: string;
  name: string;
  description: string | null;
  currency: "HTG" | "USD";
  /** Null = no limit. */
  remaining: number | null;
};

/**
 * Buying season passes: how many, who (a guest gives their name and email),
 * and how to pay. Every total comes from the API's quote, priced by the same
 * planner the payment uses, so the button never promises a different amount.
 */
export default function PassCheckout({
  seasonName,
  slug,
  pass,
  walletHtg,
  walletUsd,
  isLoggedIn,
}: {
  seasonName: string;
  slug: string;
  pass: CheckoutPass;
  walletHtg: number;
  walletUsd: number;
  isLoggedIn: boolean;
}) {
  const t = useTranslations("Season.checkout");
  const tMine = useTranslations("Season.mine");
  const ct = useTranslations("Checkout");
  const tSuspension = useTranslations("Suspension");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<Method>("");
  const [quote, setQuote] = useState<PassQuote | null>(null);
  const [paying, setPaying] = useState(false);
  const [guestFirst, setGuestFirst] = useState("");
  const [guestLast, setGuestLast] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const maxQty = Math.max(
    0,
    Math.min(MAX_PER_ORDER, pass.remaining ?? MAX_PER_ORDER),
  );
  // Waiting on a price for the quantity on screen.
  const quoting = quote?.quantity !== quantity;

  useEffect(() => {
    let cancelled = false;
    QuoteSeasonPass(pass.seasonPassTypeId, quantity, locale).then((result) => {
      if (cancelled) return;
      if (result.status === "success") setQuote(result as PassQuote);
      else toast.error(result.message ?? t("quote_failed"));
    });
    return () => {
      cancelled = true;
    };
  }, [pass.seasonPassTypeId, quantity, locale, t]);

  function failureMessage(result: unknown) {
    if (isSuspendedResponse(result)) return tSuspension("blocked_action");
    const r = result as {
      message?: string;
      code?: string;
      accountExists?: boolean;
    };
    if (r?.accountExists) return t("account_exists");
    if (r?.code === "PASS_SOLD_OUT" || r?.code === "NOT_ENOUGH_SEATS")
      return t("sold_out");
    return r?.message ?? "";
  }

  // Card charges in USD, mobile money in HTG, the wallet in the pass currency.
  const isCard = method === "card";
  const isGateway = method === "moncash" || method === "natcash";
  const currency: "HTG" | "USD" = isCard
    ? "USD"
    : isGateway
      ? "HTG"
      : pass.currency;
  const pick = (money: { htg: number; usd: number }) =>
    currency === "USD" ? money.usd : money.htg;
  const routeMoney = quote
    ? method === "card"
      ? quote.card
      : method === "moncash"
        ? quote.moncash
        : method === "natcash"
          ? quote.natcash
          : quote.wallet
    : null;
  const total = routeMoney ? pick(routeMoney) : null;
  const subtotal = quote ? pick(quote.base) : null;
  const fees = total !== null && subtotal !== null ? total - subtotal : null;
  const walletBalance = pass.currency === "USD" ? walletUsd : walletHtg;
  const insufficient =
    method === "wallet" && total !== null && walletBalance < total;

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
    if (session?.user?.isSuspended) {
      toast.error(tSuspension("blocked_action"), { duration: 10000 });
      return;
    }
    let guest:
      | { firstName: string; lastName: string; email: string }
      | undefined;
    if (!isLoggedIn) {
      guest = {
        firstName: guestFirst.trim(),
        lastName: guestLast.trim(),
        email: guestEmail.trim(),
      };
      if (!guest.firstName || !guest.lastName || !guest.email) {
        toast.error(t("guest.required"));
        return;
      }
    }
    setPaying(true);

    if (method === "wallet") {
      const result = await BuySeasonPassWallet(
        pass.seasonPassTypeId,
        quantity,
        locale,
      );
      if (result.status === "success") {
        toast.success(t("success"));
        // The passes are the buyer's now: their pass page, with the QR.
        router.push(`/upcoming/season/${slug}?from=checkout`);
        return;
      }
      toast.error(failureMessage(result));
      setPaying(false);
      return;
    }

    const result = await StartSeasonPassPayment(
      pass.seasonPassTypeId,
      isCard ? "stripe" : (method as "moncash" | "natcash"),
      quantity,
      locale,
      guest,
    );
    if (
      result.status === "success" &&
      "clientSecret" in result &&
      result.clientSecret
    ) {
      setStripeClientSecret(result.clientSecret);
      setPaying(false);
      return;
    }
    if (
      result.status === "success" &&
      "paymentURL" in result &&
      result.paymentURL
    ) {
      window.location.href = result.paymentURL;
      return;
    }
    toast.error(failureMessage(result));
    setPaying(false);
  }

  const inputClass =
    "bg-neutral-100 w-full rounded-[15px] p-[15px] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500";

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex flex-col gap-4">
        <BackButton text={ct("back")} />
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {seasonName}
        </span>
      </div>
      <main className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto pb-4 lg:pb-0 lg:overflow-hidden lg:grid lg:grid-cols-[29fr_23fr] lg:grid-rows-1 gap-8">
        <div className="flex flex-col gap-8 lg:h-full lg:min-h-0 lg:overflow-y-auto">
          <div className="flex flex-col gap-2 rounded-[15px] bg-neutral-50 p-6">
            <span className="font-semibold text-[1.7rem] leading-8 text-deep-100">
              {tMine("pass")}
            </span>
            {pass.description && (
              <span className="text-[1.4rem] leading-8 text-neutral-600">
                {pass.description}
              </span>
            )}
            <span className="text-[1.3rem] leading-7 text-neutral-600">
              {t("covers")}
            </span>
          </div>

          <div className="flex items-center justify-between p-[15px] rounded-[15px] border border-neutral-100">
            <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
              {t("quantity")}
            </span>
            <div className="flex items-center gap-6">
              <button
                type="button"
                aria-label={t("less")}
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
                type="button"
                aria-label={t("more")}
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
                  className={inputClass}
                />
                <input
                  value={guestLast}
                  onChange={(e) => setGuestLast(e.target.value)}
                  placeholder={t("guest.lastName")}
                  className={inputClass}
                />
              </div>
              <input
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                type="email"
                placeholder={t("guest.email")}
                className={inputClass}
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <button
              type="button"
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
            {NATCASH_ENABLED && (
              <button
                type="button"
                className={optionClass("natcash")}
                onClick={() => setMethod("natcash")}
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={natcashLogo}
                    alt="NatCash"
                    width={20}
                    height={21}
                  />
                  <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                    {ct("payment.natcash")}
                  </span>
                </div>
                <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
              </button>
            )}
            <button
              type="button"
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
                type="button"
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
          </div>

          <div className="flex flex-col gap-4 rounded-[15px] border border-neutral-100 p-6">
            <Row
              label={t("subtotal")}
              value={
                subtotal === null
                  ? "…"
                  : formatMoney(subtotal, currency, locale)
              }
            />
            <Row
              label={t("fees")}
              value={fees === null ? "…" : formatMoney(fees, currency, locale)}
            />
            <div className="border-t border-neutral-100 pt-4">
              <Row
                label={t("total")}
                value={
                  total === null ? "…" : formatMoney(total, currency, locale)
                }
                bold
              />
            </div>
            {method === "wallet" && (
              <div className="flex items-center justify-between text-[1.3rem] text-neutral-600 pt-2">
                <span>{t("walletBalance")}</span>
                <span>{formatMoney(walletBalance, pass.currency, locale)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:flex items-center justify-center h-full hidden">
          <Image src={Logo} width={300} alt="Ticketwaze" />
        </div>
      </main>

      <div className="shrink-0 pt-4">
        <ButtonPrimary
          onClick={pay}
          disabled={
            paying || quoting || insufficient || maxQty === 0 || total === null
          }
          className="w-full"
        >
          {paying ? (
            <LoadingCircleSmall />
          ) : maxQty === 0 ? (
            t("sold_out")
          ) : insufficient ? (
            t("insufficient")
          ) : total === null ? (
            t("total")
          ) : (
            `${t("total")} · ${formatMoney(total, currency, locale)}`
          )}
        </ButtonPrimary>
      </div>

      <Dialog
        open={stripeClientSecret !== null}
        onOpenChange={(open) => !open && setStripeClientSecret(null)}
      >
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
