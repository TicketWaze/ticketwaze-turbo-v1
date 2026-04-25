import { EventTicketType } from "@ticketwaze/typescript-config";
import { FeeBreakdown, PaymentType, SelectedTicket } from "./checkout.types";

export const PLATFORM_FEE_USD = 1.49;
export const PLATFORM_FEE_HTG = 1.49 * 131;
export const SERVICE_FEE_RATE = 0.025;

export function getPlatformFeePerTicket(
  currency: string,
  paymentType: PaymentType,
): number {
  if (paymentType === "wallet") return 0;
  return currency === "USD" ? PLATFORM_FEE_USD : PLATFORM_FEE_HTG;
}

export function calculateFeeBreakdown(
  selectedTickets: SelectedTicket[],
  ticketTypes: EventTicketType[],
  currency: string,
  paymentType: PaymentType,
): FeeBreakdown {
  let subtotal = 0;
  let totalQuantity = 0;

  selectedTickets.forEach((ticket) => {
    const ticketType = ticketTypes.find(
      (tt) => tt.eventTicketTypeId === ticket.ticketTypeId,
    );
    if (!ticketType) return;
    const price = Number(
      currency === "USD" ? ticketType.usdPrice : ticketType.ticketTypePrice,
    );
    subtotal += price * ticket.quantity;
    totalQuantity += ticket.quantity;
  });

  const serviceFee = SERVICE_FEE_RATE * subtotal;
  const platformFee =
    getPlatformFeePerTicket(currency, paymentType) * totalQuantity;
  const total = subtotal + serviceFee + platformFee;

  return { subtotal, serviceFee, platformFee, total };
}
