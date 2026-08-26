"use client";
import { useLocale, useTranslations } from "next-intl";
import { Receipt2 } from "iconsax-reactjs";
import { formatAmount } from "@ticketwaze/currency";
import {
  getSalePrice,
  getSaleMinPrice,
  getMinAbsorbedSalePrice,
} from "@ticketwaze/pricing";

type Props = {
  /**
   * The raw field value. Deliberately `unknown` for the same reason as
   * AttendeePricePreview: a number input hands back a string while typing and
   * an untouched field is undefined.
   */
  price: unknown;
  /** "HTG" | "USD" — the product's currency. */
  currency: string;
  /** True when the seller has chosen to carry the fee themselves. */
  absorbFees?: boolean;
};

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return Number.NaN;
}

/**
 * What the buyer will be charged for the product at the price the seller is
 * currently typing.
 *
 * Sales price differently from tickets, so this is not AttendeePricePreview:
 * the buyer is shown ONE all-in number and never an itemised fee. The seller
 * still needs to see the gap, because it is the number that decides whether
 * their product is competitive — so it is shown here, on the seller's side only.
 *
 * WHICH SIDE THE GAP FALLS ON is the seller's choice. Passing the fee on, the
 * buyer pays price + surcharge and the seller receives their price. Absorbing
 * it, the buyer pays the price on the listing and the seller receives what is
 * left. Either way the buyer sees one number and no itemisation.
 *
 * Absorbing raises the minimum price, because the surcharge has a floor
 * (\$3 / 400 HTG) that does not scale down — at the ordinary minimum an
 * absorbing seller would be credited nothing at all.
 */
export default function SalePricePreview({
  price,
  currency,
  absorbFees = false,
}: Props) {
  const t = useTranslations("Events.sale_price_preview");
  const locale = useLocale();

  const numericPrice = toNumber(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return null;

  const money = (amount: number) =>
    `${formatAmount(amount, locale)} ${currency}`;

  const minimum = absorbFees
    ? getMinAbsorbedSalePrice(currency)
    : getSaleMinPrice(currency);
  // Below the minimum the surcharge would dwarf the product, so the API refuses
  // it. Saying so here saves a round trip that comes back as a raw error.
  if (numericPrice < minimum) {
    return (
      <div className="flex flex-col gap-4 border p-4 rounded-2xl border-neutral-300">
        <p className="text-[1.3rem] leading-7 text-failure">
          {t("below_minimum", { minimum: money(minimum) })}
        </p>
      </div>
    );
  }

  const { sellerPrice, buyerPays } = getSalePrice(
    currency,
    numericPrice,
    absorbFees,
  );

  return (
    <div className="flex flex-col gap-4 border p-4 rounded-2xl border-neutral-300">
      <div className="flex items-center gap-3">
        <Receipt2
          size="20"
          color="#737C8A"
          variant="Bulk"
          className="shrink-0"
        />
        <span className="text-[1.4rem] leading-8 font-semibold text-deep-100">
          {t("title")}
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-dashed border-neutral-300 pb-4">
        <span className="text-[1.4rem] font-medium text-deep-100">
          {t("buyer_pays")}
        </span>
        <span className="text-[1.6rem] font-semibold text-primary-500">
          {money(buyerPays)}
        </span>
      </div>

      <div className="flex items-center justify-between text-[1.4rem]">
        <span className="text-neutral-500">{t("you_receive")}</span>
        <span className="font-medium text-success">{money(sellerPrice)}</span>
      </div>

      <p className="text-[1.2rem] leading-6 text-neutral-600">{t("note")}</p>
    </div>
  );
}
