import { Ticket } from "@ticketwaze/typescript-config";

/**
 * WHAT THE ORGANISATION EARNED on a sale, as opposed to what the buyer paid.
 *
 * The two are the same number whenever the buyer carries the fees, which is why
 * every revenue tile used to read `ticketPrice` and be right. On an activity
 * with `absorbFees` the buyer pays the face price and Ticketwaze takes its cut
 * off the top, so the organisation receives less than the ticket says — and how
 * much less depends on the payment route THAT buyer chose, which is not
 * recorded on the ticket. The API therefore snapshots the earned amount at sale
 * time onto `organisationAmount` / `organisationUsdAmount`, and this mirrors its
 * `ticketOrganisationAmount()` so the dashboard never re-derives it.
 *
 * NULL FALLS BACK TO THE TICKET PRICE, AND THAT IS EXACT: every ticket sold
 * before the columns existed was credited its base price, so the fallback is
 * the historical truth rather than an estimate.
 *
 * Only totals that answer "what is mine" belong here. A line showing what a
 * buyer PAID — an order row, a ticket drawer, a refund amount — must keep
 * reading `ticketPrice`.
 */

/** One ticket's earnings, in the currency the caller is displaying. */
export function ticketOrganisationAmount(
  ticket: Pick<
    Ticket,
    | "ticketPrice"
    | "ticketUsdPrice"
    | "organisationAmount"
    | "organisationUsdAmount"
  >,
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
  tickets: Pick<
    Ticket,
    | "ticketPrice"
    | "ticketUsdPrice"
    | "organisationAmount"
    | "organisationUsdAmount"
  >[],
  currency: string | null | undefined,
): number {
  const total = tickets.reduce(
    (sum, ticket) => sum + ticketOrganisationAmount(ticket, currency),
    0,
  );
  return Math.round(total * 100) / 100;
}
