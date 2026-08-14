"use client";
import { useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight2, Card, Wallet3 } from "iconsax-reactjs";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { PublicSale } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { useSession } from "next-auth/react";
import { useRouter, Link } from "@/i18n/navigation";
import {
  BuySaleWallet,
  StartSaleStripe,
  StartSaleMoncash,
  StartSaleNatcash,
} from "@/actions/paymentActions";
import moncashLogo from "../../../[slug]/checkout/moncash.svg";
import natcashLogo from "@/assets/images/natcash.png";
import { NATCASH_ENABLED } from "@/lib/paymentMethods";
import { ButtonPrimary } from "@/components/shared/buttons";
import BackButton from "@/components/shared/BackButton";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { fileKind, formatFileSize } from "@/lib/saleFile";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

type Method = "" | "wallet" | "card" | "moncash" | "natcash";

/**
 * Buying a digital product.
 *
 * Deliberately simpler than the raffle and event checkouts, because the product
 * is: no quantity, no seat count, no sales window. One file, one price, one
 * purchase.
 *
 * **The price is NOT computed here.** `sale.pricing.buyerPays` comes from the
 * API, which derives it from the sale's own currency and the fee rule — the
 * ticket checkouts recompute fees client-side to preview them, and doing that
 * here would mean two implementations of one surcharge that could disagree.
 * Nothing in this component sends an amount.
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
  const ct = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const [method, setMethod] = useState<Method>("");
  const [isLoading, setIsLoading] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const [stripeOpen, setStripeOpen] = useState(false);

  const isLoggedIn = Boolean(session?.user);
  const accessToken = session?.user.accessToken ?? "";

  const walletShort = walletUsd < sale.pricing.buyerPays && sale.currencyCode === "USD";

  const optionClass = (type: Method) =>
    `flex items-center justify-between cursor-pointer p-[15px] rounded-[15px] border transition-all ease-in-out duration-300 ${
      method === type
        ? "border-2 border-primary-500 bg-primary-50"
        : "border-neutral-100 hover:border-primary-500"
    }`;

  async function pay() {
    if (!method) {
      toast.error(t("selectMethod"));
      return;
    }
    setIsLoading(true);

    if (method === "wallet") {
      const result = await BuySaleWallet(accessToken, sale.saleId, locale);
      if (result.status === "success") {
        toast.success(t("purchaseComplete"));
        router.push("/purchases");
      } else {
        // The API's own words: "you already own this", "not on sale", and the
        // USD/gourde mismatch all need to reach the buyer intact.
        toast.error(result.message ?? t("failed"));
      }
      setIsLoading(false);
      return;
    }

    if (method === "card") {
      const result = await StartSaleStripe(accessToken, sale.saleId, locale);
      if (result.status === "success" && result.clientSecret) {
        setStripeClientSecret(result.clientSecret);
        setStripeOpen(true);
      } else {
        toast.error(result.message ?? t("failed"));
      }
      setIsLoading(false);
      return;
    }

    const result =
      method === "moncash"
        ? await StartSaleMoncash(accessToken, sale.saleId, locale)
        : await StartSaleNatcash(accessToken, sale.saleId, locale);

    if (result.status === "success" && result.paymentURL) {
      window.location.href = result.paymentURL;
      return;
    }
    toast.error(result.message ?? t("failed"));
    setIsLoading(false);
  }

  if (stripeOpen && stripeClientSecret) {
    return (
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret: stripeClientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-200 w-full mx-auto pb-16">
      <BackButton text={t("back")} />

      <span className="font-primary font-medium text-[2.2rem] leading-10 text-black">
        {t("checkoutTitle")}
      </span>

      {/* What is being bought. A file cannot be previewed before payment, so
          the name, type and size are the whole description of the goods. */}
      <div className="flex items-center gap-6 rounded-[15px] border border-neutral-100 p-6">
        {sale.coverImageUrl && (
          <Image
            src={sale.coverImageUrl}
            alt={sale.title}
            width={72}
            height={72}
            className="rounded-[10px] object-cover w-[72px] h-[72px]"
          />
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-semibold text-[1.6rem] leading-8 text-deep-100 truncate">
            {sale.title}
          </span>
          {sale.file && (
            <span className="text-[1.4rem] leading-8 text-neutral-600">
              {fileKind(sale.file.originalFilename, sale.file.mimeType)} ·{" "}
              {formatFileSize(sale.file.byteSize)}
            </span>
          )}
        </div>
      </div>

      {/* One number, never itemised. */}
      <div className="flex items-center justify-between rounded-[15px] bg-neutral-100 p-6">
        <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
          {t("total")}
        </span>
        <span className="font-primary font-medium text-[2.2rem] leading-10 text-primary-500">
          {formatMoney(sale.pricing.buyerPays, sale.pricing.currency, locale)}
        </span>
      </div>

      {/* Guest checkout is not built yet, so signing in is required rather than
          silently offered and then failing at the API. */}
      {!isLoggedIn ? (
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
      ) : (
        <>
          {/* Every method is offered for every product. A USD-priced product
              is charged against its registered HTG price when paid in gourdes,
              so MonCash and NatCash are never unavailable. */}
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
            {NATCASH_ENABLED && (
              <button
                className={optionClass("natcash")}
                onClick={() => setMethod("natcash")}
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={natcashLogo}
                    alt="Logo of natcash"
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
            <button
              className={optionClass("wallet")}
              onClick={() => setMethod("wallet")}
            >
              <div className="flex items-center gap-4">
                <Wallet3 size="20" color="#0d0d0d" variant="Bulk" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-[1.6rem] leading-[2.2rem] text-deep-100">
                    {ct("payment.wallet")}
                  </span>
                  {walletShort && (
                    <span className="text-[1.3rem] leading-6 text-failure">
                      {t("walletShort")}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
            </button>
          </div>

          {/* Restated at the moment of paying, not only on the listing. */}
          <p className="text-[1.4rem] leading-8 text-neutral-600">
            {t("finalSaleNote")}
          </p>

          <ButtonPrimary
            className="w-full py-[12px]"
            disabled={isLoading || !method}
            onClick={pay}
          >
            {isLoading ? <LoadingCircleSmall /> : t("payNow")}
          </ButtonPrimary>
        </>
      )}
    </div>
  );
}
