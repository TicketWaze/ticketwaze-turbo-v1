import type { PublicSale } from "@ticketwaze/typescript-config";

/** The four ways a digital product can be paid for. */
export type SalePaymentMethod = "" | "wallet" | "card" | "moncash" | "natcash";

/**
 * The answer to "can this product be sent to this address", carrying the
 * address it answers.
 *
 * Storing the email alongside the verdict is what makes "still checking"
 * derivable rather than a second piece of state: a result for a stale address
 * is not a result for what is currently typed, and the two flags could
 * otherwise disagree and enable the pay button for the wrong person.
 */
export interface RecipientCheck {
  email: string;
  /** Whether an account exists at all — decides if an invite can be offered. */
  found: boolean;
  /** Account exists, is not the buyer, and does not already own the product. */
  canReceive: boolean;
  firstName?: string;
  message: string | null;
}

export type { PublicSale };
