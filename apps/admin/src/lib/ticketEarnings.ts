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
 *    organisation is paid the seat (net of our fee) if it is used. See
 *    `isUnearnedGiveaway`.
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
  | "status"
>;

/**
 * AN ADMIN-GIVEAWAY SEAT EARNS ONLY ONCE IT IS USED. Nobody paid for it
 * (`ticketPrice` 0); the row carries what Ticketwaze pays the organisation for
 * it (`organisationAmount`, net of our fee), and that is paid after the event
 * only if the ticket was scanned (`CHECKED`) — or on any online event, where
 * there is nothing to scan. Mirrors the API's `ticketEarnedAmount`.
 */
function isUnearnedGiveaway(
  ticket: Pick<Ticket, "ticketPrice" | "organisationAmount" | "status">,
  onlineEvent: boolean,
): boolean {
  const isGiveaway =
    Number(ticket.ticketPrice) === 0 &&
    Number(ticket.organisationAmount ?? 0) > 0;
  return isGiveaway && !onlineEvent && ticket.status !== "CHECKED";
}

/** One ticket's earnings, in the currency being displayed. */
export function ticketOrganisationAmount(
  ticket: EarningTicket,
  currency: string | null | undefined,
  /** The ticket's event is online (`eventCategory` "meet"). */
  onlineEvent = false,
): number {
  if (isUnearnedGiveaway(ticket, onlineEvent)) return 0;
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
  onlineEvent = false,
): number {
  const total = tickets.reduce(
    (sum, ticket) =>
      sum + ticketOrganisationAmount(ticket, currency, onlineEvent),
    0,
  );
  return Math.round(total * 100) / 100;
}
