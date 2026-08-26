export type PaymentType = "" | "moncash" | "natcash" | "card" | "wallet";

/**
 * The steps a checkout can contain, in the order they can appear.
 *
 * The flow used to be four fixed indices with skips written against the
 * numbers, which meant every conditional step had to be expressed twice — once
 * where it was skipped forward and once where it was skipped back. The list is
 * now built from the cart and the activity, and every navigation reads a KEY
 * rather than a position, so adding or removing a step cannot silently
 * renumber the ones around it.
 */
export type StepKey =
  | "tickets"
  | "recipient"
  | "questions"
  | "payment"
  | "summary";

/** One seat's answers, keyed by question id. */
export type SeatAnswers = Record<
  string,
  { answer: string; isOther: boolean }
>;

/** One answer as the API receives it, per seat. */
export interface SubmittedAnswer {
  questionId: string;
  answer: string;
  isOther: boolean;
}

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
  // True when the waitlist first-purchase perk zeroes out all fees. The fee
  // amounts above stay populated (shown struck-through) but `total` == subtotal.
  feeWaived: boolean;
  /**
   * True when the ORGANISER carries the fees, so the buyer pays the ticket
   * price and nothing else.
   *
   * Different from `feeWaived` in what it means for the display, which is why
   * it is a second flag rather than a reuse of the first. A waived fee is a
   * perk: the buyer is shown what they are NOT paying, struck through, because
   * seeing the saving is the point. An absorbed fee is not the buyer's
   * business at all — it never appears on their side of the transaction, so
   * itemising it (struck through or otherwise) would invent a fee they were
   * never going to be charged.
   */
  absorbedByOrganiser: boolean;
}
