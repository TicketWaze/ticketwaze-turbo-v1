/**
 * Fee constants and the per-ticket fee rule, shared by checkout and by the
 * activity cards.
 *
 * These mirror `app/controllers/utils/pricing.ts` in the API, which is what
 * actually charges the buyer. Any change here has to be made there too — a
 * divergence means the price a buyer is shown is not the price they pay.
 */

export const SERVICE_FEE_RATE = 0.03; // 3% Ticketwaze service fee
export const STRIPE_TX_FEE_RATE = 0.03; // 3% Stripe transaction fee
export const MONCASH_TX_FEE_RATE = 0.025; // 2.5% MonCash transaction fee
export const PER_TICKET_FEE_USD = 1.49; // flat fee per ticket in USD
export const PER_TICKET_FEE_HTG_LOW = 100; // flat fee for HTG tickets priced <= 500 HTG
export const HTG_LOW_PRICE_THRESHOLD = 500;

// Last-resort fallback only. The real HTG/USD rate MUST come from the API
// (GET /currencies) — it is the same value the backend charges with, and any
// difference makes the displayed total diverge from the charged amount.
export const FALLBACK_HTG_EXCHANGE_RATE = 135;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Per-ticket platform fee for a single ticket, using the live exchange rate.
 * Edge case: HTG event with price <= 500 HTG → 100 HTG flat fee.
 */
export function getPerTicketFee(
  currency: string,
  ticketPrice: number,
  htgExchangeRate: number,
): number {
  if (currency === "HTG") {
    return ticketPrice <= HTG_LOW_PRICE_THRESHOLD
      ? PER_TICKET_FEE_HTG_LOW
      : PER_TICKET_FEE_USD * htgExchangeRate;
  }
  return PER_TICKET_FEE_USD;
}

/**
 * All-in MonCash price for one HTG ticket — the API's `calculateMoncashTotal`.
 *
 *   (price + 3% service + flat per-ticket fee) × 1.025
 */
export function calculateMoncashTotalHTG(
  htgPrice: number,
  htgExchangeRate: number,
): number {
  const perFee = getPerTicketFee("HTG", htgPrice, htgExchangeRate);
  const subtotal = htgPrice * (1 + SERVICE_FEE_RATE) + perFee;
  return round2(subtotal * (1 + MONCASH_TX_FEE_RATE));
}

/**
 * All-in Stripe price for one USD ticket — the API's `calculateStripeTotalUSD`.
 *
 *   (price + 3% service + $1.49) × 1.03
 */
export function calculateStripeTotalUSD(usdPrice: number): number {
  const subtotal = usdPrice * (1 + SERVICE_FEE_RATE) + PER_TICKET_FEE_USD;
  return round2(subtotal * (1 + STRIPE_TX_FEE_RATE));
}
