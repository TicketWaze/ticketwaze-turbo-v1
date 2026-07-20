import { EventTicketType } from "@ticketwaze/typescript-config";
import { FeeBreakdown, PaymentType, SelectedTicket } from "./checkout.types";

// The fee constants and the per-ticket fee rule live in one place now, shared
// with the activity cards. Re-exported so existing importers keep working.
export {
  SERVICE_FEE_RATE,
  STRIPE_TX_FEE_RATE,
  MONCASH_TX_FEE_RATE,
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
  FALLBACK_HTG_EXCHANGE_RATE,
  getPerTicketFee,
} from "@/lib/pricing";

/**
 * Payment-processor transaction fee rate for a given payment type.
 * Wallet has no processor fee.
 */
export function getTransactionFeeRate(paymentType: PaymentType): number {
  if (paymentType === "card") return STRIPE_TX_FEE_RATE;
  if (paymentType === "moncash") return MONCASH_TX_FEE_RATE;
  return 0;
}

/**
 * Computes the full fee breakdown for the selected tickets.
 *
 * Formula (per ticket):
 *   serviceFee    = 3% × subtotal
 *   platformFee   = Σ getPerTicketFee(price) × quantity
 *   transactionFee = txRate × (subtotal + serviceFee + platformFee)
 *                    (4% Stripe | 2.5% MonCash | 0% Wallet)
 *   total         = subtotal + serviceFee + platformFee + transactionFee
 */
export function calculateFeeBreakdown(
  selectedTickets: SelectedTicket[],
  ticketTypes: EventTicketType[],
  currency: string,
  paymentType: PaymentType = "",
  feeWaived: boolean = false,
  htgExchangeRate: number = FALLBACK_HTG_EXCHANGE_RATE,
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
  };
}
