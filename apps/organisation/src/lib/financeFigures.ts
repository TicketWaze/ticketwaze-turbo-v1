import { Order, Organisation, Ticket } from "@ticketwaze/typescript-config";
import { ticketOrganisationAmount } from "@/lib/ticketEarnings";

/**
 * The Finance page's three figures (Figma "Total Revenue · Total Profit ·
 * Balance") and the withdrawal summary's breakdown, from one place so the two
 * screens can never disagree:
 *
 * - Revenue — what buyers paid for the tickets (face price), in `currency`.
 * - Profit  — what the organisation keeps of it (`ticketOrganisationAmount`).
 * - Fees    — the difference, i.e. what Ticketwaze took. Zero on activities
 *             where the buyer carries the fees on top.
 * - Balance / pending — the ledger's available and pending balances.
 *
 * Returned tickets count in none of them. Restaurant and counter sales issue no
 * tickets, so they are not in revenue or profit, but they are in the balance.
 */
export function financeFigures(
  orders: Order[],
  organisation: Pick<
    Organisation,
    | "availableBalance"
    | "usdAvailableBalance"
    | "pendingBalance"
    | "usdPendingBalance"
  >,
  currency: string,
) {
  const tickets: Ticket[] = orders
    .flatMap((order) => order.tickets ?? [])
    .filter((ticket) => ticket.status !== "RETURNED");
  const round = (n: number) => Math.round(n * 100) / 100;
  const revenue = round(
    tickets.reduce(
      (sum, ticket) =>
        sum +
        (Number(
          currency === "USD" ? ticket.ticketUsdPrice : ticket.ticketPrice,
        ) || 0),
      0,
    ),
  );
  const profit = round(
    tickets.reduce(
      (sum, ticket) => sum + ticketOrganisationAmount(ticket, currency),
      0,
    ),
  );
  const isUsd = currency === "USD";
  return {
    revenue,
    profit,
    fees: round(Math.max(0, revenue - profit)),
    balance:
      Number(
        isUsd
          ? organisation.usdAvailableBalance
          : organisation.availableBalance,
      ) || 0,
    pending:
      Number(
        isUsd ? organisation.usdPendingBalance : organisation.pendingBalance,
      ) || 0,
  };
}

/** "12,800" / "96.94" in the viewer's locale, at most two decimals. */
export function formatMoney(value: number, locale: string) {
  return value.toLocaleString(locale, { maximumFractionDigits: 2 });
}
