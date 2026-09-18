import { Ticket } from "@ticketwaze/typescript-config";

/**
 * WHAT THE ORGANISATION EARNED on a sale, as opposed to what the buyer paid.
 *
 * The same helper the organisation dashboard uses, and mirroring the API's
 * `ticketOrganisationAmount()`, so the three cannot disagree about one ticket.
 * The two figures are identical whenever the buyer carries the fees, which is
 * why revenue tiles read `ticketPrice` for so long and looked right. They part
 * company twice:
 *
 *  - an ADMIN GIVEAWAY: the holder paid nothing, so the price is 0, while the
 *    organisation was credited the tier's face value. Reading the price made
 *    the admin's revenue lower than the balance it had just moved.
 *  - an activity that ABSORBS THE FEES: the buyer pays the face price and
 *    Ticketwaze takes its cut off the top, so the price overstates the earnings.
 *
 * NULL FALLS BACK TO THE TICKET PRICE, AND THAT IS EXACT: every ticket sold
 * before the columns existed was credited its base price.
 *
 * Only totals answering "what did the organisation get" belong here. A line
 * showing what a BUYER paid — an order row, a ticket drawer, a refund amount —
 * must keep reading `ticketPrice`.
 */

type EarningTicket = Pick<
  Ticket,
  | "ticketPrice"
  | "ticketUsdPrice"
  | "organisationAmount"
  | "organisationUsdAmount"
>;

/** One ticket's earnings, in the currency being displayed. */
export function ticketOrganisationAmount(
  ticket: EarningTicket,
  currency: string | null | undefined,
): number {
  const earned =
    currency === "USD"
      ? (ticket.organisationUsdAmount ?? ticket.ticketUsdPrice)
      : (ticket.organisationAmount ?? ticket.ticketPrice);
  return Number(earned) || 0;
}

/** What a set of tickets earned the organisation, rounded like the ledger. */
export function ticketsOrganisationTotal(
  tickets: EarningTicket[],
  currency: string | null | undefined,
): number {
  const total = tickets.reduce(
    (sum, ticket) => sum + ticketOrganisationAmount(ticket, currency),
    0,
  );
  return Math.round(total * 100) / 100;
}
