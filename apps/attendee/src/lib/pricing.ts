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
  HTG_PER_TICKET_FEE_BANDS,
  htgFlatBandFee,
  FALLBACK_HTG_EXCHANGE_RATE,
  round2,
  getPerTicketFee,
  calculateMoncashTotalHTG,
  calculateNatcashTotalHTG,
  calculateStripeTotalHTG,
  calculateStripeTotalUSD,
  // Discount codes and Ticketwaze tokens — the browser"s copy of the rules
  // the API charges by. See the package for why the order of the two matters.
  TOKENS_PER_HTG,
  unitTokenValue,
  tokenValue,
  maxSpendableTokens,
  quoteWithReductions,
} from "@ticketwaze/pricing";
