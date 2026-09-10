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

/**
 * THE HTG PER-TICKET FEE, BY PRICE BAND.
 *
 * A flat fee is regressive by construction: the same 100 HTG that is a rounding
 * error on a 2,000 HTG ticket was 40% of a 250 HTG one. These bands scale the
 * fee down with the ticket so a small event stays worth running.
 *
 * Read as "price <= maxPrice", first match wins, and anything above the last
 * band falls through to the USD fee at the live rate — the "tarif normal".
 *
 *   100 - 299  ->  50 HTG
 *   300 - 499  ->  75 HTG
 *   500 - 749  -> 100 HTG
 *   750 +      -> 1.49 USD at the live rate (~201 HTG)
 *
 * Mirrors `HTG_PER_TICKET_FEE_BANDS` in the API's `utils/pricing.ts`, which is
 * what actually charges. The two must agree or the buyer is quoted a total
 * they are not charged.
 */
export const HTG_PER_TICKET_FEE_BANDS = [
  { maxPrice: 299, fee: 50 },
  { maxPrice: 499, fee: 75 },
  { maxPrice: 749, fee: 100 },
] as const;

// Last-resort fallback only. The real HTG/USD rate MUST come from the API
// (GET /currencies) — it is the same value the backend charges with, and any
// difference makes the displayed total diverge from the charged amount.
export const FALLBACK_HTG_EXCHANGE_RATE = 135;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Per-ticket platform fee for a single ticket, using the live exchange rate.
 * HTG follows `HTG_PER_TICKET_FEE_BANDS`; USD is a single flat $1.49.
 *
 * A FREE ticket type (price 0) carries no fee in either currency. Without the
 * first line a 0-price ticket falls into the lowest HTG band and is quoted a
 * 50 HTG flat fee, so the tier labelled "Free" would cost money. Mirrors
 * `perTicketFeeHTG` / `perTicketFeeUSD` in the API's pricing utils.
 */
export function getPerTicketFee(
  currency: string,
  ticketPrice: number,
  htgExchangeRate: number,
): number {
  if (ticketPrice <= 0) return 0;
  if (currency === "HTG") {
    const band = HTG_PER_TICKET_FEE_BANDS.find(
      (b) => ticketPrice <= b.maxPrice,
    );
    return band ? band.fee : PER_TICKET_FEE_USD * htgExchangeRate;
  }
  return PER_TICKET_FEE_USD;
}

/**
 * THE FLAT FEE FOR AN HTG PRICE INSIDE A BAND, OR NULL ABOVE THEM.
 *
 * Below the top band the flat fee is not one line in a stack — it IS the whole
 * charge on top of the ticket. No 3% service fee, and no payment-processor
 * percentage on any route, so a 250 HTG ticket costs 300 HTG whether the buyer
 * pays by MonCash, NatCash, card or wallet. Ticketwaze carries the processor's
 * cut out of the flat; the organiser is credited the full base either way.
 *
 * Mirrors `htgFlatBandFee` in the API's `utils/pricing.ts`.
 */
export function htgFlatBandFee(htgPrice: number): number | null {
  if (!Number.isFinite(htgPrice) || htgPrice <= 0) return null;
  const band = HTG_PER_TICKET_FEE_BANDS.find((b) => htgPrice <= b.maxPrice);
  return band ? band.fee : null;
}

/** The same rule expressed as the all-in total the buyer pays. */
function htgFlatTotal(htgPrice: number): number | null {
  const fee = htgFlatBandFee(htgPrice);
  return fee === null ? null : round2(htgPrice + fee);
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
  const flat = htgFlatTotal(htgPrice);
  if (flat !== null) return flat;
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
  const flat = htgFlatTotal(htgPrice);
  if (flat !== null) return flat;
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
  const flat = htgFlatTotal(htgPrice);
  if (flat !== null) return flat;
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
  /** The price on the listing, whichever way the surcharge falls. */
  listedPrice: number;
  /**
   * What the seller is CREDITED — the listed price when the buyer carries the
   * surcharge, that price minus the surcharge when the seller absorbs it.
   */
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
 * Passing the surcharge on (the default):
 *   surcharge = max(floor, 12% x price)
 *   buyerPays = price + surcharge
 *   seller    = price
 *
 * Absorbing it, which reverses only the direction:
 *   buyerPays = price
 *   seller    = price - surcharge
 *
 * Mirrors `calculateSaleTotal` in the API's `utils/pricing.ts`, which is what
 * actually charges the buyer. Any change here has to be made there too.
 */
export function getSalePrice(
  currency: string,
  price: number,
  absorbFees: boolean = false,
): SalePrice {
  const listedPrice = Number.isFinite(price) && price > 0 ? price : 0;
  const surcharge = Math.max(
    getSaleFeeFloor(currency),
    SALE_FEE_RATE * listedPrice,
  );

  return {
    listedPrice: round2(listedPrice),
    sellerPrice: round2(absorbFees ? listedPrice - surcharge : listedPrice),
    surcharge: round2(surcharge),
    buyerPays: round2(absorbFees ? listedPrice : listedPrice + surcharge),
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

  /**
   * Inside an HTG flat band the stack collapses to one line. Showing a 3%
   * service row and a processor row here would itemise money the buyer is not
   * charged, and the rows would not add up to the total they pay.
   */
  if (currency === "HTG") {
    const flatFee = htgFlatBandFee(basePrice);
    if (flatFee !== null) {
      return {
        basePrice,
        serviceFee: 0,
        platformFee: flatFee,
        transactionFee: 0,
        total: round2(basePrice + flatFee),
        currency,
        route,
      };
    }
  }

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

// ── Who pays the fees ─────────────────────────────────────────────────────────

/**
 * WHO CARRIES THE FEE STACK.
 *
 * `pass_on` is the original behaviour and still the default: the fees are added
 * ON TOP of the organiser's price, the buyer pays base + fees, and the
 * organisation is credited the base whole.
 *
 * `absorb` reverses it. The price the organiser typed IS the price the buyer
 * pays — no fee lines, no surcharge — and the same fees are taken OUT of it
 * before the organisation is credited. The activity carries the choice
 * (`absorbFees` on events/raffles/restaurants/sales).
 *
 * Mirrors `FeeMode` in the API's `utils/pricing.ts`, which is what actually
 * charges the buyer.
 */
export type FeeMode = "pass_on" | "absorb";

/** Reads an activity's flag as a fee mode. */
export function getFeeMode(absorbFees: boolean | null | undefined): FeeMode {
  return absorbFees === true ? "absorb" : "pass_on";
}

export interface AbsorbedFees {
  /** What the buyer is charged — exactly the price the organiser set. */
  buyerPays: number;
  serviceFee: number;
  platformFee: number;
  transactionFee: number;
  /** Everything Ticketwaze and the processor take, together. */
  fees: number;
  /** What actually reaches the organisation's pending balance. */
  net: number;
}

/**
 * The fees an organiser absorbs on ONE unit sold at face price `price`.
 *
 *   serviceFee     = 3% × price
 *   platformFee    = the same flat per-unit fee as pass-on mode, same bands
 *   transactionFee = the route's rate × price
 *   net            = price − serviceFee − platformFee − transactionFee
 *
 * Mirrors `getAbsorbedFees` in the API. Components are returned unrounded so
 * the caller can round at the point of display; `net` is rounded because it is
 * a money amount that gets credited, not a display row.
 */
export function getAbsorbedFees(
  currency: string,
  price: number,
  htgExchangeRate: number = FALLBACK_HTG_EXCHANGE_RATE,
  route: PaymentRoute = getDefaultRoute(currency),
): AbsorbedFees {
  const rate =
    htgExchangeRate > 0 ? htgExchangeRate : FALLBACK_HTG_EXCHANGE_RATE;
  const buyerPays = Number.isFinite(price) && price > 0 ? price : 0;

  /**
   * Inside an HTG flat band there are no percentages to take out — the flat fee
   * is the entire stack. An absorbing organiser gives up exactly that, on every
   * route. Mirrors the API's `getAbsorbedFees`.
   */
  if (currency === "HTG") {
    const flatFee = htgFlatBandFee(buyerPays);
    if (flatFee !== null) {
      return {
        buyerPays: round2(buyerPays),
        serviceFee: 0,
        platformFee: flatFee,
        transactionFee: 0,
        fees: flatFee,
        net: round2(buyerPays - flatFee),
      };
    }
  }

  const serviceFee = SERVICE_FEE_RATE * buyerPays;
  const platformFee = getPerTicketFee(currency, buyerPays, rate);
  const transactionFee = getRouteFeeRate(route) * buyerPays;
  const fees = serviceFee + platformFee + transactionFee;

  return {
    buyerPays: round2(buyerPays),
    serviceFee,
    platformFee,
    transactionFee,
    fees,
    net: round2(buyerPays - fees),
  };
}

/**
 * WHY THERE IS A FLOOR ON AN ABSORBED PRICE.
 *
 * The flat per-unit fee does not scale down. At 100 HTG it is the entire
 * ticket, and an organiser absorbing fees on a 150 HTG ticket would be paying
 * for the privilege of selling it.
 *
 * So an absorbed price must leave the organiser at least HALF of it, judged
 * against the worst-case route (card, 3%) because the organiser sets the price
 * once and cannot know how anyone will pay:
 *
 *   price × (1 − 0.03 − 0.03) − flat(price) ≥ 0.5 × price
 *   price ≥ flat(price) / 0.44
 *
 * Mirrors `getMinAbsorbedPrice` in the API, which is what refuses the save.
 */
export const ABSORBED_MIN_NET_SHARE = 0.5;

export function getMinAbsorbedPrice(
  currency: string,
  htgExchangeRate: number = FALLBACK_HTG_EXCHANGE_RATE,
): number {
  const headroom =
    1 - SERVICE_FEE_RATE - STRIPE_TX_FEE_RATE - ABSORBED_MIN_NET_SHARE;
  const rate =
    htgExchangeRate > 0 ? htgExchangeRate : FALLBACK_HTG_EXCHANGE_RATE;

  if (currency === "USD") {
    return Math.ceil((PER_TICKET_FEE_USD / headroom) * 2) / 2;
  }

  /**
   * HTG has four bands that do not all price the same way, so the floor is
   * solved per band and the cheapest workable answer wins. Inside a flat band
   * only the flat fee is deducted, so `price >= fee / (1 - share)`; above the
   * bands the percentages return and `fee / headroom` applies. See the API's
   * copy for the full reasoning.
   */
  const flatShare = 1 - ABSORBED_MIN_NET_SHARE;
  const bands: { start: number; end: number; need: number }[] = [];
  let start = 0;
  for (const band of HTG_PER_TICKET_FEE_BANDS) {
    bands.push({ start, end: band.maxPrice, need: band.fee / flatShare });
    start = band.maxPrice + 1;
  }
  bands.push({
    start,
    end: Number.POSITIVE_INFINITY,
    need: (PER_TICKET_FEE_USD * rate) / headroom,
  });

  let cheapest = Number.POSITIVE_INFINITY;
  for (const band of bands) {
    const candidate = Math.max(band.need, band.start);
    if (candidate <= band.end) cheapest = Math.min(cheapest, candidate);
  }

  return Math.ceil(cheapest / 10) * 10;
}

/** Is this price high enough to absorb its own fees? Free is always fine. */
export function canAbsorbFeesAtPrice(
  currency: string,
  price: number,
  htgExchangeRate: number = FALLBACK_HTG_EXCHANGE_RATE,
): boolean {
  if (!Number.isFinite(price) || price <= 0) return true;
  return price >= getMinAbsorbedPrice(currency, htgExchangeRate);
}

/**
 * What the organiser receives per unit, expressed as the RANGE it can land in.
 *
 * In absorb mode the processor's cut comes out of the organiser's side, and
 * processors do not all charge the same — so unlike pass-on mode, where the
 * organiser always receives exactly their base price, the net now depends on
 * how each individual buyer chose to pay. A wallet purchase costs them nothing
 * extra; a card purchase costs 3%.
 *
 * Both ends are shown rather than an average, because an average is a number
 * no organiser will ever actually be paid.
 */
export interface OrganiserNetRange {
  /** Wallet — no processor involved. */
  best: number;
  /** Card at 3%, the most any route costs. */
  worst: number;
  /** True when every route pays the same, so the UI can show one number. */
  isFixed: boolean;
}

export function getOrganiserNetRange(
  currency: string,
  price: number,
  htgExchangeRate: number = FALLBACK_HTG_EXCHANGE_RATE,
  feeMode: FeeMode = "pass_on",
): OrganiserNetRange {
  if (feeMode !== "absorb") {
    const base = round2(Number.isFinite(price) && price > 0 ? price : 0);
    return { best: base, worst: base, isFixed: true };
  }

  const best = getAbsorbedFees(currency, price, htgExchangeRate, "wallet").net;
  const worst = getAbsorbedFees(currency, price, htgExchangeRate, "card").net;
  return { best, worst, isFixed: best === worst };
}

// ── Digital sales, absorbed ───────────────────────────────────────────────────

/**
 * A sale's surcharge is a single all-in figure rather than a fee stack, so
 * absorbing it is a one-line reversal: the buyer pays the listed price and the
 * seller is credited what is left after the surcharge.
 *
 *   net = price − max(floor, 12% × price)
 *
 * Mirrors `getAbsorbedSaleNet` in the API.
 */
export function getAbsorbedSaleNet(currency: string, price: number): number {
  const listed = Number.isFinite(price) && price > 0 ? price : 0;
  const surcharge = Math.max(
    getSaleFeeFloor(currency),
    SALE_FEE_RATE * listed,
  );
  return round2(listed - surcharge);
}

/** The floor is flat below ~$25, so half-the-price reduces to twice the floor. */
export function getMinAbsorbedSalePrice(currency: string): number {
  return round2(getSaleFeeFloor(currency) / ABSORBED_MIN_NET_SHARE);
}

/**
 * The all-in price to quote for one unit, whichever way the fees fall.
 *
 * In absorb mode that is simply the organiser's price — which is the whole
 * point of the mode, and why every quoting surface can call this instead of
 * branching on its own.
 */
export function getBuyerUnitTotal(
  currency: string,
  price: number,
  htgExchangeRate: number = FALLBACK_HTG_EXCHANGE_RATE,
  route: PaymentRoute = getDefaultRoute(currency),
  feeMode: FeeMode = "pass_on",
): number {
  if (feeMode === "absorb") {
    return round2(Number.isFinite(price) && price > 0 ? price : 0);
  }
  return getUnitPriceBreakdown(currency, price, htgExchangeRate, route).total;
}
