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
  PER_TICKET_FEE_HTG_LOW,
  HTG_LOW_PRICE_THRESHOLD,
  FALLBACK_HTG_EXCHANGE_RATE,
  getPerTicketFee,
} from "@/lib/pricing";

import {
  SERVICE_FEE_RATE,
  STRIPE_TX_FEE_RATE,
  MONCASH_TX_FEE_RATE,
  NATCASH_TX_FEE_RATE,
  FALLBACK_HTG_EXCHANGE_RATE,
  getPerTicketFee,
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
 * Formula (per ticket):
 *   serviceFee    = 3% × subtotal
 *   platformFee   = Σ getPerTicketFee(price) × quantity
 *   transactionFee = txRate × (subtotal + serviceFee + platformFee)
 *                    (3% Stripe | 2.5% MonCash | 2.5% NatCash | 0% Wallet)
 *   total         = subtotal + serviceFee + platformFee + transactionFee
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
  const rate =
    htgExchangeRate > 0 ? htgExchangeRate : FALLBACK_HTG_EXCHANGE_RATE;

  selectedTickets.forEach((ticket) => {
    const ticketType = ticketTypes.find(
      (tt) => tt.eventTicketTypeId === ticket.ticketTypeId,
    );
    if (!ticketType) return;
    const price = Number(
      currency === "USD" ? ticketType.usdPrice : ticketType.ticketTypePrice,
    );
    subtotal += price * ticket.quantity;
    platformFee += getPerTicketFee(currency, price, rate) * ticket.quantity;
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

  const serviceFee = SERVICE_FEE_RATE * subtotal;
  const txRate = getTransactionFeeRate(paymentType);
  const transactionFee = txRate * (subtotal + serviceFee + platformFee);
  // Waitlist first-purchase perk: the buyer pays only the subtotal. The fee
  // amounts are still returned so the UI can show them struck-through, but they
  // are excluded from the total — mirroring the backend's fee waiver exactly.
  const total = feeWaived
    ? subtotal
    : subtotal + serviceFee + platformFee + transactionFee;

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
