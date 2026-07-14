/**
 * Shared money formatting for all Ticketwaze apps. The API stores amounts as
 * exact 2-decimal values (Postgres numeric) and may serialize them as strings,
 * so every helper accepts number | string | null | undefined.
 *
 * Usage:
 *   formatMoney(1500, "HTG")            -> "1,500.00 HTG"
 *   formatMoney("25.5", "USD")          -> "$25.50"
 *   formatMoney(1500, "HTG", "fr")      -> "1 500,00 HTG"
 */

export type CurrencyCode = "HTG" | "USD" | (string & {});

const CURRENCY_DISPLAY: Record<string, { symbol: string; position: "before" | "after" }> = {
  USD: { symbol: "$", position: "before" },
  // The gourde sign (G) is ambiguous in practice; the ISO code reads clearer.
  HTG: { symbol: "HTG", position: "after" },
};

/** Parses an API money value (number or numeric string) into a number. */
export function parseAmount(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Formats a monetary amount with grouping and exactly two decimals.
 * `locale` follows the app locale ("en" | "fr"); defaults to "en".
 */
export function formatMoney(
  value: number | string | null | undefined,
  currency: CurrencyCode = "HTG",
  locale: string = "en",
): string {
  const amount = parseAmount(value);
  const formatted = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  const display = CURRENCY_DISPLAY[currency] ?? { symbol: currency, position: "after" as const };
  return display.position === "before"
    ? `${display.symbol}${formatted}`
    : `${formatted} ${display.symbol}`;
}

/** Formats without the currency marker (for contexts that label it separately). */
export function formatAmount(
  value: number | string | null | undefined,
  locale: string = "en",
): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseAmount(value));
}
