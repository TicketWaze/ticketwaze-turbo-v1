import { Event } from "@ticketwaze/typescript-config";
import {
  calculateMoncashTotalHTG,
  calculateStripeTotalUSD,
  FALLBACK_HTG_EXCHANGE_RATE,
} from "@/lib/pricing";

export type ActivityCardPrice =
  | { kind: "teaser" }
  | { kind: "free" }
  | { kind: "priced"; amount: number; currency: string };

/**
 * The all-in price to advertise on an activity card — what the buyer actually
 * pays, not the organiser's base price.
 *
 * Which processor's fees apply follows the activity's own currency, because
 * that is the only payment route the price can be quoted in honestly:
 *   HTG activity → MonCash  (price + 3% + flat per-ticket fee) × 1.025
 *   USD activity → Stripe   (price + 3% + $1.49) × 1.03
 *
 * The waitlist first-purchase fee waiver is deliberately ignored. It is
 * per-user state, and cards render in public listings that are the same for
 * everyone; a waived buyer simply sees a lower total at checkout than the card
 * promised, which errs toward under-promising rather than over.
 */
export function getActivityCardPrice(
  event: Event,
  htgExchangeRate: number = FALLBACK_HTG_EXCHANGE_RATE,
): ActivityCardPrice {
  // A teaser has no ticket types at all, so there is no price to quote — not
  // even a free one.
  if (event.isComingSoon === true) return { kind: "teaser" };

  const ticketTypes = event.eventTicketTypes ?? [];
  if (ticketTypes.length === 0) return { kind: "free" };

  const currency = event.currency === "USD" ? "USD" : "HTG";
  const rate =
    htgExchangeRate > 0 ? htgExchangeRate : FALLBACK_HTG_EXCHANGE_RATE;

  /**
   * The all-in total of each type, then the lowest — rather than the lowest
   * base price fed through the fee formula. The flat per-ticket fee steps at
   * the 500 HTG threshold, so deriving the cheapest total from the cheapest
   * base assumes a monotonicity the fee curve does not owe us.
   */
  const totals = ticketTypes
    .map((ticketType) => {
      const base = Number(
        currency === "USD"
          ? (ticketType.usdPrice ?? 0)
          : (ticketType.ticketTypePrice ?? 0),
      );
      if (!Number.isFinite(base) || base <= 0) return null;
      return currency === "USD"
        ? calculateStripeTotalUSD(base)
        : calculateMoncashTotalHTG(base, rate);
    })
    .filter((total): total is number => total !== null);

  // Every type priced at zero — a genuinely free activity, and no fee is
  // charged on a free checkout.
  if (totals.length === 0) return { kind: "free" };

  return { kind: "priced", amount: Math.min(...totals), currency };
}
