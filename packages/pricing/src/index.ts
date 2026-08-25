/**
 * Fee constants and the fee rules every Ticketwaze surface prices with.
 *
 * These mirror `app/controllers/utils/pricing.ts` in the API, which is what
 * actually charges the buyer. Any change here has to be made there too — a
 * divergence means the price a buyer is shown is not the price they pay.
 *
 * This package exists so the attendee apps (which quote the price) and the
 * organisation dashboard (which previews it while the organiser sets it) read
 * from one definition instead of drifting copies.
 */

export const SERVICE_FEE_RATE = 0.03; // 3% Ticketwaze service fee
export const STRIPE_TX_FEE_RATE = 0.03; // 3% Stripe transaction fee
export const MONCASH_TX_FEE_RATE = 0.025; // 2.5% MonCash transaction fee
export const NATCASH_TX_FEE_RATE = 0.025; // 2.5% NatCash transaction fee
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
 *
 * A FREE ticket type (price 0) carries no fee in either currency. Without the
 * first line a 0-price ticket falls into the HTG low-price band and is quoted
 * a 100 HTG flat fee, so the tier labelled "Free" would cost money. Mirrors
 * `perTicketFeeHTG` / `perTicketFeeUSD` in the API's pricing utils.
 */
export function getPerTicketFee(
  currency: string,
  ticketPrice: number,
  htgExchangeRate: number,
): number {
  if (ticketPrice <= 0) return 0;
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
 * All-in NatCash price for one HTG ticket — the API's `calculateNatcashTotal`.
 *
 *   (price + 3% service + flat per-ticket fee) × 1.025
 */
export function calculateNatcashTotalHTG(
  htgPrice: number,
  htgExchangeRate: number,
): number {
  const perFee = getPerTicketFee("HTG", htgPrice, htgExchangeRate);
  const subtotal = htgPrice * (1 + SERVICE_FEE_RATE) + perFee;
  return round2(subtotal * (1 + NATCASH_TX_FEE_RATE));
}

/**
 * All-in Stripe price for one HTG ticket — the API's `calculateStripeTotalHTG`.
 *
 *   (price + 3% service + flat per-ticket fee) × 1.03
 */
export function calculateStripeTotalHTG(
  htgPrice: number,
  htgExchangeRate: number,
): number {
  const perFee = getPerTicketFee("HTG", htgPrice, htgExchangeRate);
  const subtotal = htgPrice * (1 + SERVICE_FEE_RATE) + perFee;
  return round2(subtotal * (1 + STRIPE_TX_FEE_RATE));
}

/**
 * All-in Stripe price for one USD ticket — the API's `calculateStripeTotalUSD`.
 *
 *   (price + 3% service + $1.49) × 1.03
 */
export function calculateStripeTotalUSD(usdPrice: number): number {
  const subtotal =
    usdPrice * (1 + SERVICE_FEE_RATE) +
    getPerTicketFee("USD", usdPrice, FALLBACK_HTG_EXCHANGE_RATE);
  return round2(subtotal * (1 + STRIPE_TX_FEE_RATE));
}

// ── Digital sales ─────────────────────────────────────────────────────────────

/**
 * Sales price differently from tickets: the buyer sees one all-in number and no
 * itemised fees, and the seller receives exactly the price they set. Ticketwaze
 * absorbs the payment-processor fee out of the surcharge.
 *
 * The percentage arm is what makes absorbing it safe. A flat-only surcharge goes
 * underwater as soon as the processor's own percentage exceeds it — break-even
 * is `floor / (rate / (1 - rate))`, about $97 at a $3 floor and Stripe's 3%.
 * Above that the percentage takes over and the margin keeps growing.
 */
export const SALE_FEE_RATE = 0.12;
export const SALE_FEE_FLOOR_USD = 3;
export const SALE_FEE_FLOOR_HTG = 400;

/** Below these a sale is refused, so the floor can never dwarf the product. */
export const SALE_MIN_PRICE_USD = 3;
export const SALE_MIN_PRICE_HTG = 500;

export function getSaleFeeFloor(currency: string): number {
  return currency === "USD" ? SALE_FEE_FLOOR_USD : SALE_FEE_FLOOR_HTG;
}

export function getSaleMinPrice(currency: string): number {
  return currency === "USD" ? SALE_MIN_PRICE_USD : SALE_MIN_PRICE_HTG;
}

export interface SalePrice {
  /** What the seller set, and exactly what the seller is credited. */
  sellerPrice: number;
  /** Ticketwaze's margin; never shown itemised to a buyer. */
  surcharge: number;
  /** The single all-in number the buyer pays. */
  buyerPays: number;
  currency: string;
}

/**
 * All-in price of one digital sale.
 *
 *   surcharge = max(floor, 12% x price)
 *   buyerPays = price + surcharge
 *
 * Mirrors `calculateSaleTotal` in the API's `utils/pricing.ts`, which is what
 * actually charges the buyer. Any change here has to be made there too.
 */
export function getSalePrice(currency: string, price: number): SalePrice {
  const sellerPrice = Number.isFinite(price) && price > 0 ? price : 0;
  const surcharge = Math.max(
    getSaleFeeFloor(currency),
    SALE_FEE_RATE * sellerPrice,
  );

  return {
    sellerPrice: round2(sellerPrice),
    surcharge: round2(surcharge),
    buyerPays: round2(sellerPrice + surcharge),
    currency,
  };
}

// ── Single-ticket breakdown ───────────────────────────────────────────────────

/** How the buyer pays. `wallet` carries no payment-processor fee. */
export type PaymentRoute = "moncash" | "natcash" | "card" | "wallet";

/** Payment-processor transaction fee rate for a route. */
export function getRouteFeeRate(route: PaymentRoute): number {
  if (route === "card") return STRIPE_TX_FEE_RATE;
  if (route === "moncash") return MONCASH_TX_FEE_RATE;
  if (route === "natcash") return NATCASH_TX_FEE_RATE;
  return 0;
}

/**
 * The route an activity's price is quoted in when no buyer has chosen one yet.
 *
 * It follows the activity's own currency, because that is the only route the
 * price can be quoted in honestly — the same rule `getActivityCardPrice` uses,
 * so an organiser's preview matches the card attendees will actually see.
 */
export function getDefaultRoute(currency: string): PaymentRoute {
  return currency === "USD" ? "card" : "moncash";
}

export interface UnitPriceBreakdown {
  /** What the organiser set, and what the organiser is credited. */
  basePrice: number;
  /** 3% Ticketwaze service fee. */
  serviceFee: number;
  /** Flat per-ticket platform fee, in the activity's currency. */
  platformFee: number;
  /** Payment-processor fee; 0 for the wallet route. */
  transactionFee: number;
  /** What the buyer pays for one ticket — the charged amount, not a sum of the rounded rows. */
  total: number;
  currency: string;
  route: PaymentRoute;
}

/**
 * The full fee stack for a single ticket at a given base price.
 *
 * `total` is computed from the unrounded components and rounded once, so it is
 * identical to what `calculate*Total*` (and therefore the API) charges. The
 * individual components are returned unrounded; round them at the point of
 * display. Displayed rows can consequently be a cent off the total — quoting a
 * total that matches the charge matters more than rows that add up on screen.
 */
export function getUnitPriceBreakdown(
  currency: string,
  price: number,
  htgExchangeRate: number = FALLBACK_HTG_EXCHANGE_RATE,
  route: PaymentRoute = getDefaultRoute(currency),
): UnitPriceBreakdown {
  const rate =
    htgExchangeRate > 0 ? htgExchangeRate : FALLBACK_HTG_EXCHANGE_RATE;
  const basePrice = Number.isFinite(price) && price > 0 ? price : 0;

  const serviceFee = SERVICE_FEE_RATE * basePrice;
  const platformFee = getPerTicketFee(currency, basePrice, rate);
  const subtotal = basePrice + serviceFee + platformFee;
  const transactionFee = getRouteFeeRate(route) * subtotal;

  return {
    basePrice,
    serviceFee,
    platformFee,
    transactionFee,
    total: round2(subtotal + transactionFee),
    currency,
    route,
  };
}
