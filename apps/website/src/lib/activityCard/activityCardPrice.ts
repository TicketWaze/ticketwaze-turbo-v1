import { Event } from "@ticketwaze/typescript-config";

export type ActivityCardPrice =
  | { kind: "teaser" }
  | { kind: "free" }
  | { kind: "priced"; amount: number; currency: string };

/**
 * The price to advertise on an activity card — the ORGANISER'S price, with no
 * fees added.
 *
 * Cards used to quote the all-in total instead, which meant a listing shouted a
 * number 20% above the one the organiser set and the one every other surface
 * shows. `TicketSelectionStep` renders `ticketTypePrice` / `usdPrice`,
 * `structuredData` publishes the same, and `RaffleCard` never marked anything
 * up — the event card was alone in disagreeing with all of them.
 *
 * So the fee stack now appears in exactly one place, `SummaryStep`, where the
 * buyer can see what each line is for. A card is a browsing surface; an
 * itemisable total belongs where it can actually be itemised.
 *
 * NOTHING CHANGES WHEN THE ORGANISER ABSORBS THE FEES, which is why this
 * function no longer asks. In absorb mode the price they set already IS what
 * the buyer pays, so base price was always the right answer there; in pass-on
 * mode it is now the right answer too. One rule, no branch.
 */
export function getActivityCardPrice(event: Event): ActivityCardPrice {
  // A teaser has no ticket types at all, so there is no price to quote — not
  // even a free one.
  if (event.isComingSoon === true) return { kind: "teaser" };

  const ticketTypes = event.eventTicketTypes ?? [];
  if (ticketTypes.length === 0) return { kind: "free" };

  const currency = event.currency === "USD" ? "USD" : "HTG";

  /**
   * The cheapest base price, taken directly.
   *
   * This used to have to total every tier and then take the minimum, because
   * the flat per-ticket fee steps at the 500 HTG threshold and the cheapest
   * base was therefore not guaranteed to produce the cheapest total. With no
   * fee curve in the way, cheapest base is simply cheapest.
   */
  const prices = ticketTypes
    .map((ticketType) =>
      Number(
        currency === "USD"
          ? (ticketType.usdPrice ?? 0)
          : (ticketType.ticketTypePrice ?? 0),
      ),
    )
    .filter((price) => Number.isFinite(price) && price > 0);

  // Every type priced at zero — a genuinely free activity, and no fee is
  // charged on a free checkout.
  if (prices.length === 0) return { kind: "free" };

  /**
   * An activity that MIXES a free tier with paid ones lands here, and quotes
   * the cheapest PAID tier rather than "Free".
   *
   * Deliberate: the card is rendered with a "from" prefix, so quoting the
   * cheapest paid tier understates how cheaply someone can get in — they
   * discover a free option on the activity page — whereas "Free" would promise
   * a price the food ticket does not honour. Under-promising beats
   * over-promising on a public listing.
   */
  return { kind: "priced", amount: Math.min(...prices), currency };
}
