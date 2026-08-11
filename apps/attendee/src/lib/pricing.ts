/**
 * Fee constants and fee rules — now owned by `@ticketwaze/pricing`, so the
 * organisation dashboard's price preview and the price quoted here cannot
 * drift apart.
 *
 * Re-exported under the original path so existing `@/lib/pricing` importers
 * keep working unchanged.
 */

export {
  SERVICE_FEE_RATE,
  STRIPE_TX_FEE_RATE,
  MONCASH_TX_FEE_RATE,
  NATCASH_TX_FEE_RATE,
  PER_TICKET_FEE_USD,
  PER_TICKET_FEE_HTG_LOW,
  HTG_LOW_PRICE_THRESHOLD,
  FALLBACK_HTG_EXCHANGE_RATE,
  round2,
  getPerTicketFee,
  calculateMoncashTotalHTG,
  calculateNatcashTotalHTG,
  calculateStripeTotalHTG,
  calculateStripeTotalUSD,
} from "@ticketwaze/pricing";
