import { EventTicketType } from "@ticketwaze/typescript-config";
import { FeeBreakdown, PaymentType, SelectedTicket } from "./checkout.types";

export const PLATFORM_FEE_USD = 1.49;
export const PLATFORM_FEE_HTG = 1.49 * 136.55;

export function getServiceFeeRate(paymentType: PaymentType): number {
  if (paymentType === "card") return 0.03;
  if (paymentType === "moncash") return 0.025;
  return 0;
}

export function getPlatformFeePerTicket(
  currency: string,
  paymentType: PaymentType,
  ticketPrice: number,
): number {
  if (paymentType === "wallet") return 0;
  if (currency === "HTG" && ticketPrice < 750) return ticketPrice * 0.5;
  return currency === "USD" ? PLATFORM_FEE_USD : PLATFORM_FEE_HTG;
}

export function calculateFeeBreakdown(
  selectedTickets: SelectedTicket[],
  ticketTypes: EventTicketType[],
  currency: string,
  paymentType: PaymentType,
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
    platformFee +=
      getPlatformFeePerTicket(currency, paymentType, price) * ticket.quantity;
  });

  const serviceFee = getServiceFeeRate(paymentType) * subtotal;
  const total = subtotal + serviceFee + platformFee;

  return { subtotal, serviceFee, platformFee, total };
}
