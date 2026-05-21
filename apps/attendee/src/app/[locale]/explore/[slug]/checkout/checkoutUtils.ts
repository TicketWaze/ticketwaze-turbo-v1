import { EventTicketType } from "@ticketwaze/typescript-config";
import { FeeBreakdown, SelectedTicket } from "./checkout.types";

export const TRANSACTION_FEE_RATE = 0.06;       // 6% of subtotal
export const PER_TICKET_FEE_USD = 1.49;          // flat fee per ticket in USD
export const PER_TICKET_FEE_HTG_LOW = 100;       // flat fee when HTG ticket < 500
export const HTG_LOW_PRICE_THRESHOLD = 500;
export const HTG_EXCHANGE_RATE = 136.55;
export const PER_TICKET_FEE_HTG = PER_TICKET_FEE_USD * HTG_EXCHANGE_RATE; // ~197.99 HTG

/**
 * Returns the flat per-ticket platform fee for a single ticket.
 * - HTG event, price < 500 HTG  → 100 HTG
 * - HTG event, price ≥ 500 HTG  → USD fee converted to HTG
 * - USD event                   → $1.45
 */
export function getPerTicketFee(currency: string, ticketPrice: number): number {
  if (currency === "HTG") {
    return ticketPrice < HTG_LOW_PRICE_THRESHOLD
      ? PER_TICKET_FEE_HTG_LOW
      : PER_TICKET_FEE_HTG;
  }
  return PER_TICKET_FEE_USD;
}

/**
 * Computes the full fee breakdown for the selected tickets.
 *
 * Formula:
 *   serviceFee  = 6% × subtotal
 *   platformFee = Σ getPerTicketFee(price) × quantity
 *   total       = subtotal + serviceFee + platformFee
 *
 * Payment method does NOT affect fees — all methods share the same structure.
 */
export function calculateFeeBreakdown(
  selectedTickets: SelectedTicket[],
  ticketTypes: EventTicketType[],
  currency: string,
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

  const serviceFee = TRANSACTION_FEE_RATE * subtotal;
  const total = subtotal + serviceFee + platformFee;

  return { subtotal, serviceFee, platformFee, total };
}
