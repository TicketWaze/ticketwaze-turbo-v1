"use client";
import { useLocale, useTranslations } from "next-intl";
import { Control, useWatch } from "react-hook-form";
import { Receipt2 } from "iconsax-reactjs";
import { formatAmount } from "@ticketwaze/currency";
import { getUnitPriceBreakdown } from "@ticketwaze/pricing";
import useHtgExchangeRate from "@/hooks/useHtgExchangeRate";

type Props = {
  /**
   * The raw field value. Deliberately `unknown`: a plain text/number input
   * hands back a string while typing, a `z.coerce.number()` field types as
   * unknown, and an untouched field is undefined. `toNumber` sorts it out.
   */
  price: unknown;
  /** "HTG" | "USD" — the activity's currency. */
  currency: string;
};

/** Parses a form field value into a number, or NaN when it is not one yet. */
function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return Number.NaN;
}

/**
 * What the attendee will actually be charged for one ticket at the price the
 * organiser is currently typing.
 *
 * Ticketwaze fees are added on top of the organiser's price rather than taken
 * out of it — the API credits the organisation the full base price (see
 * `payments_controller.ts`) — so the preview ends on both numbers that matter:
 * what the buyer pays and what the organiser receives.
 *
 * The quoted route follows the activity's currency (HTG → MonCash, USD → card),
 * the same rule the attendee activity cards use, so this preview and the card a
 * buyer eventually sees agree.
 */
export default function AttendeePricePreview({ price, currency }: Props) {
  const t = useTranslations("Events.price_preview");
  const locale = useLocale();
  const htgExchangeRate = useHtgExchangeRate();

  const numericPrice = toNumber(price);
  // Nothing to preview until there is a real, positive price in the field.
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) return null;

  const { basePrice, serviceFee, platformFee, transactionFee, total } =
    getUnitPriceBreakdown(currency, numericPrice, htgExchangeRate);

  // The organiser needs to know what the fees cost them, not how they split
  // three ways internally — so the service fee, the flat per-ticket fee and the
  // payment processor's cut are summed into a single line.
  const fees = serviceFee + platformFee + transactionFee;

  const money = (amount: number) =>
    `${formatAmount(amount, locale)} ${currency}`;

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

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-[1.4rem]">
          <span className="text-neutral-500">{t("base_price")}</span>
          <span className="text-deep-100 font-medium">{money(basePrice)}</span>
        </div>
        <div className="flex items-center justify-between text-[1.4rem]">
          <span className="text-neutral-500">{t("transaction_fees")}</span>
          <span className="text-deep-100 font-medium">{money(fees)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-dashed border-neutral-300 pt-4">
        <span className="text-[1.4rem] font-medium text-deep-100">
          {t("attendee_pays")}
        </span>
        <span className="text-[1.6rem] font-semibold text-primary-500">
          {money(total)}
        </span>
      </div>

      <div className="flex items-center justify-between text-[1.4rem]">
        <span className="text-neutral-500">{t("you_receive")}</span>
        <span className="font-medium text-success">{money(basePrice)}</span>
      </div>

      <p className="text-[1.2rem] leading-6 text-neutral-600">{t("note")}</p>
    </div>
  );
}

/**
 * The preview wired to one entry of a `ticketTypes` field array.
 *
 * Subscribing to the price here rather than in the parent keeps the rest of the
 * ticket-class form off the per-keystroke render path, and lets the preview sit
 * inside a `.map()` where a hook call could not.
 */
export function TicketTypePricePreview({
  control,
  index,
  currency,
}: {
  // The four ticket-class forms each have their own form value type; the field
  // path below is identical across all of them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  index: number;
  currency: string;
}) {
  const price = useWatch({
    control,
    name: `ticketTypes.${index}.ticketTypePrice`,
  });
  return <AttendeePricePreview price={price} currency={currency} />;
}
