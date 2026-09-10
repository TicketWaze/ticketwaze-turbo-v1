import { EventTicketType } from "@ticketwaze/typescript-config";
import { FeeBreakdown, PaymentType, SelectedTicket } from "./checkout.types";

// The fee constants and the per-ticket fee rule live in one place now, shared
// with the activity cards. Re-exported so existing importers keep working.
export {
  SERVICE_FEE_RATE,
  STRIPE_TX_FEE_RATE,
  MONCASH_TX_FEE_RATE,
  NATCASH_TX_FEE_RATE,
  PER_TICKET_FEE_USD,
  FALLBACK_HTG_EXCHANGE_RATE,
  getPerTicketFee,
  htgFlatBandFee,
  round2,
} from "@/lib/pricing";

import {
  SERVICE_FEE_RATE,
  STRIPE_TX_FEE_RATE,
  MONCASH_TX_FEE_RATE,
  NATCASH_TX_FEE_RATE,
  FALLBACK_HTG_EXCHANGE_RATE,
  getPerTicketFee,
  htgFlatBandFee,
  round2,
} from "@/lib/pricing";

/**
 * Is this tier given away?
 *
 * The price is the whole answer — there is no `isFree` column on a ticket type.
 * `event.isFree` is a different question: it means EVERY tier is free, which is
 * what routes the buyer to the free-claim endpoint. On an activity that mixes
 * the two, `event.isFree` is false while some tiers here are still free.
 */
export function isFreeTicketType(
  ticketType: Pick<EventTicketType, "ticketTypePrice" | "usdPrice">,
): boolean {
  return Number(ticketType.ticketTypePrice) <= 0 && Number(ticketType.usdPrice) <= 0;
}

/**
 * Payment-processor transaction fee rate for a given payment type.
 * Wallet has no processor fee.
 */
export function getTransactionFeeRate(paymentType: PaymentType): number {
  if (paymentType === "card") return STRIPE_TX_FEE_RATE;
  if (paymentType === "moncash") return MONCASH_TX_FEE_RATE;
  if (paymentType === "natcash") return NATCASH_TX_FEE_RATE;
  return 0;
}

/**
 * Computes the full fee breakdown for the selected tickets.
 *
 * Two formulas, chosen per ticket line by the price.
 *
 * An HTG price inside a flat band (below 750) is the simple case and the one
 * most baskets hit:
 *   platformFee   = the band's flat fee
 *   serviceFee    = 0
 *   transactionFee = 0
 *   line total    = price + flat        — identical on every payment method
 *
 * Anything above the bands, and every USD price, keeps the percentage stack:
 *   serviceFee    = 3% × price
 *   platformFee   = getPerTicketFee(price)
 *   transactionFee = txRate × (price + serviceFee + platformFee)
 *                    (3% Stripe | 2.5% MonCash | 2.5% NatCash | 0% Wallet)
 *   line total    = (price + serviceFee + platformFee) × (1 + txRate)
 *
 * TWO WAYS THE TOTAL COLLAPSES TO THE SUBTOTAL, and they are not the same
 * thing. `feeWaived` is the waitlist perk — Ticketwaze forgoes its margin for
 * this buyer, and the fee rows stay populated so the UI can show what was
 * saved. `absorbFees` is the organiser carrying them — the fees exist but on
 * the other side of the transaction, so they are zeroed out here rather than
 * merely excluded from the total. Nothing about them belongs on the buyer's
 * receipt.
 */
export function calculateFeeBreakdown(
  selectedTickets: SelectedTicket[],
  ticketTypes: EventTicketType[],
  currency: string,
  paymentType: PaymentType = "",
  feeWaived: boolean = false,
  htgExchangeRate: number = FALLBACK_HTG_EXCHANGE_RATE,
  absorbFees: boolean = false,
): FeeBreakdown {
  let subtotal = 0;
  let platformFee = 0;
  let serviceFee = 0;
  let transactionFee = 0;
  /**
   * THE TOTAL, ACCUMULATED THE WAY THE BACKEND CHARGES IT.
   *
   * `payments_controller` rounds each ticket to the cent and sums those,
   * so summing the unrounded component rows and rounding once at the end can
   * land a cent apart — it did, on a two-ticket basket above the bands. The
   * rows stay unrounded for display and may therefore not add up on screen to
   * the cent; quoting a total the buyer is actually charged matters more.
   */
  let chargedTotal = 0;
  const rate =
    htgExchangeRate > 0 ? htgExchangeRate : FALLBACK_HTG_EXCHANGE_RATE;
  const txRate = getTransactionFeeRate(paymentType);

  /**
   * ACCUMULATED PER TICKET LINE, NOT ONCE OVER THE SUBTOTAL.
   *
   * An HTG ticket inside a flat band carries no service percentage and no
   * processor cut — the flat fee is the entire charge — while one above the
   * bands carries both. A cart can hold tiers on either side of 750 HTG at the
   * same time, so a single `SERVICE_FEE_RATE * subtotal` would invent fees on
   * the cheap tiers and quote a total the API does not charge.
   *
   * This also matches how the backend adds up: `payments_controller` computes a
   * per-ticket total and sums those, rather than pricing the basket as a whole.
   */
  selectedTickets.forEach((ticket) => {
    const ticketType = ticketTypes.find(
      (tt) => tt.eventTicketTypeId === ticket.ticketTypeId,
    );
    if (!ticketType) return;
    const price = Number(
      currency === "USD" ? ticketType.usdPrice : ticketType.ticketTypePrice,
    );
    const quantity = ticket.quantity;
    subtotal += price * quantity;

    const flatFee = currency === "HTG" ? htgFlatBandFee(price) : null;
    if (flatFee !== null) {
      platformFee += flatFee * quantity;
      chargedTotal += round2(price + flatFee) * quantity;
      return;
    }

    const perTicket = getPerTicketFee(currency, price, rate);
    const lineService = SERVICE_FEE_RATE * price;
    platformFee += perTicket * quantity;
    serviceFee += lineService * quantity;
    transactionFee += txRate * (price + lineService + perTicket) * quantity;
    chargedTotal +=
      round2((price + lineService + perTicket) * (1 + txRate)) * quantity;
  });

  // The organiser is paying these, so as far as this buyer is concerned they do
  // not exist. Zeroed rather than merely excluded from the total, so no surface
  // downstream can render a fee the buyer was never going to be charged.
  if (absorbFees) {
    return {
      subtotal,
      serviceFee: 0,
      platformFee: 0,
      transactionFee: 0,
      total: subtotal,
      feeWaived: false,
      absorbedByOrganiser: true,
    };
  }

  // Waitlist first-purchase perk: the buyer pays only the subtotal. The fee
  // amounts are still returned so the UI can show them struck-through, but they
  // are excluded from the total — mirroring the backend's fee waiver exactly.
  const total = feeWaived ? subtotal : round2(chargedTotal);

  return {
    subtotal,
    serviceFee,
    platformFee,
    transactionFee,
    total,
    feeWaived,
    absorbedByOrganiser: false,
  };
}
