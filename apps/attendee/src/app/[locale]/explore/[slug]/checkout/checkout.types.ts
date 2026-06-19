export type PaymentType = "" | "moncash" | "card" | "wallet";

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
}

export interface AttendeeFormData {
  ticketTypeId: string;
  name: string;
  email: string;
  isForSomeoneElse: boolean;
}

export interface TicketFormData {
  ticketTypeId: string;
  quantity: number;
}

export interface SelectedTicket {
  ticketTypeId: string;
  quantity: number;
  __index: number;
}

export interface FeeBreakdown {
  subtotal: number;
  serviceFee: number;
  platformFee: number;
  transactionFee: number;
  total: number;
}
