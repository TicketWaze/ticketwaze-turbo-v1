import { FALLBACK_HTG_EXCHANGE_RATE } from "@/lib/pricing";

/**
 * The HTG/USD rate the backend prices with, for server components that need to
 * display an all-in price.
 *
 * Cached for a minute rather than fetched per render: this feeds listing pages
 * that render many cards, and the rate moves far more slowly than the lists do.
 * Checkout deliberately does NOT use this helper — it fetches with `no-store`,
 * because there the displayed total must match the amount about to be charged
 * exactly, and a minute-stale rate could differ.
 *
 * Falls back rather than throwing: a listing page that cannot reach the
 * currencies endpoint should still render its activities.
 */
export async function getHtgExchangeRate(): Promise<number> {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/currencies`,
      { next: { revalidate: 60 } },
    );
    const response = await request.json();
    const htg = response?.currencies?.find(
      (currency: { isoCode: string }) => currency.isoCode === "HTG",
    );
    return Number(htg?.exchangeRate) || FALLBACK_HTG_EXCHANGE_RATE;
  } catch {
    return FALLBACK_HTG_EXCHANGE_RATE;
  }
}
