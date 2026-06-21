import { EventTicketType } from "@ticketwaze/typescript-config";
import { FeeBreakdown, PaymentType, SelectedTicket } from "./checkout.types";

export const SERVICE_FEE_RATE = 0.03;           // 3% Ticketwaze service fee
export const STRIPE_TX_FEE_RATE = 0.03;          // 3% Stripe transaction fee
export const MONCASH_TX_FEE_RATE = 0.025;        // 2.5% MonCash transaction fee
export const PER_TICKET_FEE_USD = 1.49;           // flat fee per ticket in USD
export const PER_TICKET_FEE_HTG_LOW = 100;        // flat fee for HTG tickets priced <= 500 HTG
export const HTG_LOW_PRICE_THRESHOLD = 500;
export const HTG_EXCHANGE_RATE = 136.55;          // approximate, used for display only
export const PER_TICKET_FEE_HTG = PER_TICKET_FEE_USD * HTG_EXCHANGE_RATE; // ~$1.49 in HTG

/**
 * Per-ticket platform fee for a single ticket.
 * Edge case: HTG event with price <= 500 HTG → 100 HTG flat fee.
 */
export function getPerTicketFee(currency: string, ticketPrice: number): number {
  if (currency === "HTG") {
    return ticketPrice <= HTG_LOW_PRICE_THRESHOLD
      ? PER_TICKET_FEE_HTG_LOW
      : PER_TICKET_FEE_HTG;
  }
  return PER_TICKET_FEE_USD;
}

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
): FeeBreakdown {
  let subtotal = 0;
  let platformFee = 0;

  selectedTickets.forEach((ticket) => {
    const ticketType = ticketTypes.find(
      (tt) => tt.eventTicketTypeId === ticket.ticketTypeId,
    );
    if (!ticketType) return;
    const price = Number(
      currency === "USD" ? ticketType.usdPrice : ticketType.ticketTypePrice,
    );
    subtotal += price * ticket.quantity;
    platformFee += getPerTicketFee(currency, price) * ticket.quantity;
  });

  const serviceFee = SERVICE_FEE_RATE * subtotal;
  const txRate = getTransactionFeeRate(paymentType);
  const transactionFee = txRate * (subtotal + serviceFee + platformFee);
  const total = subtotal + serviceFee + platformFee + transactionFee;

  return { subtotal, serviceFee, platformFee, transactionFee, total };
}
