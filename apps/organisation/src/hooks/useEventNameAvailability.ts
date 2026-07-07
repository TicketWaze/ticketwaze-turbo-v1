"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type EventNameAvailability =
  | "idle"
  | "checking"
  | "available"
  | "taken";

type CheckResult = {
  name: string;
  // null means the check failed (network error) — treated as "idle" so the
  // create endpoint's unique rule stays the final safety net.
  available: boolean | null;
};

/**
 * Live activity-name availability check. Fires on every keystroke and aborts
 * the previous in-flight request, so only the response for the latest value
 * ever lands. Calls the API directly from the browser (server actions can't
 * be aborted), which the API's CORS allow-list already permits.
 */
export default function useEventNameAvailability(
  eventName: string,
): EventNameAvailability {
  const { data: session } = useSession();
  const accessToken = session?.user.accessToken;
  const [result, setResult] = useState<CheckResult | null>(null);

  const name = eventName?.trim() ?? "";

  useEffect(() => {
    if (name.length < 3 || !accessToken) return;

    const controller = new AbortController();
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/validation/event-name?eventName=${encodeURIComponent(name)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      },
    )
      .then((response) => response.json())
      .then((body) => {
        if (controller.signal.aborted) return;
        setResult({
          name,
          available: body.status === "success" ? Boolean(body.available) : null,
        });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setResult({ name, available: null });
      });

    return () => controller.abort();
  }, [name, accessToken]);

  // Status is derived: a result only counts if it matches the current value,
  // otherwise a request for that value is still in flight.
  if (name.length < 3 || !accessToken) return "idle";
  if (result?.name !== name) return "checking";
  if (result.available === null) return "idle";
  return result.available ? "available" : "taken";
}
