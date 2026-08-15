"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { EventNameAvailability } from "./useEventNameAvailability";

type CheckResult = {
  title: string;
  // null means the check failed (network error) — treated as "idle" so the
  // create/update endpoint's uniqueness rule stays the final safety net.
  available: boolean | null;
};

/**
 * Live product-title availability check, the sale twin of
 * useRaffleTitleAvailability. Fires on every keystroke and aborts the previous
 * in-flight request, so only the response for the latest value ever lands.
 *
 * Advisory only. Two sellers can pass this at the same moment and both submit;
 * the unique index on `sales.title` is what actually prevents the collision,
 * and the API turns that into a readable message. This exists so the seller
 * finds out while typing rather than after filling in the whole form.
 *
 * Separate from the event and raffle hooks rather than generalised: they hit
 * different endpoints with different query parameters, and folding them
 * together would mean a caller passing a "kind" flag that decides more than it
 * explains.
 */
export default function useSaleTitleAvailability(
  title: string,
  /**
   * The product being edited. Excluded from the lookup so it does not match its
   * own title — without it the edit screen reports "taken" for a title the
   * seller never touched.
   */
  excludeSaleId?: string,
): EventNameAvailability {
  const { data: session } = useSession();
  const accessToken = session?.user.accessToken;
  const [result, setResult] = useState<CheckResult | null>(null);

  const value = title?.trim() ?? "";

  useEffect(() => {
    if (value.length < 3 || !accessToken) return;

    const controller = new AbortController();
    const query = new URLSearchParams({ title: value });
    if (excludeSaleId) query.set("saleId", excludeSaleId);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sales/validation/title?${query.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      },
    )
      .then((response) => response.json())
      .then((body) => {
        if (controller.signal.aborted) return;
        setResult({
          title: value,
          available: body.status === "success" ? Boolean(body.available) : null,
        });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setResult({ title: value, available: null });
      });

    return () => controller.abort();
  }, [value, accessToken, excludeSaleId]);

  // Status is derived: a result only counts if it matches the current value,
  // otherwise a request for that value is still in flight.
  if (value.length < 3 || !accessToken) return "idle";
  if (result?.title !== value) return "checking";
  if (result.available === null) return "idle";
  return result.available ? "available" : "taken";
}
