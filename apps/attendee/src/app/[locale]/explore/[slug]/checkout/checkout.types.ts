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

  /**
   * THE ORGANISER'S DISCOUNT CODE, off the base price.
   *
   * Applied BEFORE the fees, which is why it is part of this breakdown rather
   * than subtracted from the total afterwards: the fee rows above are already
   * computed on the reduced subtotal, so the bill falls by more than this
   * figure. `totalSaved` is what actually came off.
   */
  discount: number;

  /**
   * TICKETWAZE TOKENS, off the grand total.
   *
   * After the fees, because this is Ticketwaze's own credit rather than the
   * organiser charging less — there is no margin of ours to protect from our
   * own promotion.
   */
  tokenValue: number;
  tokensSpent: number;

  /**
   * How much less the buyer pays than they would have at face price.
   *
   * Not `discount + tokenValue`: discounting the base shrinks the fees too, so
   * a 200-off code takes more than 200 off a fee-bearing cart. Shown as the
   * single "you saved" figure, because that is the one the buyer can check
   * against the total.
   */
  totalSaved: number;
}

/**
 * A discount code the buyer has entered and the API has accepted.
 *
 * Held on the client only to quote a figure and render the row. The payment
 * handler re-resolves the code against prices it reads itself, so nothing
 * here is trusted with money — a tampered `amount` produces a wrong preview
 * and the correct charge.
 */
export interface AppliedDiscount {
  code: string;
  type: "fixed" | "percentage";
  value: number;
  currency: string | null;
  /** What the API says it takes off the current subtotal. */
  amount: number;
}

/** Why a code was refused, as the API classifies it. */
export type DiscountRefusalReason =
  | "not_found"
  | "inactive"
  | "expired"
  | "usage_limit_reached"
  | "per_user_limit_reached"
  | "below_min_purchase";

/** The signed-in buyer's token balance and what it is worth here. */
export interface TokenBalance {
  tokens: number;
  exchangeRate: number;
  value: { htg: number; usd: number };
}
