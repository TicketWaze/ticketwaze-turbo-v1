"use client";
import { useEffect, useState } from "react";
import { FALLBACK_HTG_EXCHANGE_RATE } from "@ticketwaze/pricing";

/**
 * The HTG/USD rate the backend prices with. Needed wherever the dashboard
 * previews an attendee-facing price: above 500 HTG the flat per-ticket fee is
 * $1.49 converted at this rate, so a wrong rate means a wrong preview.
 *
 * `GET /currencies` is public, so this reads it straight from the browser
 * rather than threading a server prop through every create/edit wizard. The
 * in-flight promise is memoised at module scope, so several ticket-class cards
 * (or a form remounting between steps) share a single request per page load.
 */
let ratePromise: Promise<number> | null = null;

function fetchRate(): Promise<number> {
  if (ratePromise) return ratePromise;
  ratePromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/currencies`)
    .then((response) => response.json())
    .then((body) => {
      const htg = body?.currencies?.find(
        (currency: { isoCode: string }) => currency.isoCode === "HTG",
      );
      return Number(htg?.exchangeRate) || FALLBACK_HTG_EXCHANGE_RATE;
    })
    .catch(() => {
      // Let a later mount retry rather than caching the failure forever.
      ratePromise = null;
      return FALLBACK_HTG_EXCHANGE_RATE;
    });
  return ratePromise;
}

export default function useHtgExchangeRate(): number {
  const [rate, setRate] = useState(FALLBACK_HTG_EXCHANGE_RATE);

  useEffect(() => {
    let active = true;
    fetchRate().then((value) => {
      if (active) setRate(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return rate;
}
