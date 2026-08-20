"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type EventNameAvailability =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  /**
   * The check could not be performed — network error, 401, or the API
   * answering `status: "failed"`.
   *
   * Used to be folded into "idle", which renders NOTHING and lets submit
   * through. That made a broken check indistinguishable from one that had not
   * run yet: the organiser saw no indicator, no warning, and only found out the
   * name was taken when the create failed with a generic error three steps
   * later. Whatever the underlying cause, it presented as "the check passes".
   */
  | "unknown";

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
  /**
   * The activity being edited. Excluded from the lookup so it does not match
   * its own name — without it every edit screen reports "name taken" for a name
   * the organiser never touched.
   */
  excludeEventId?: string,
): EventNameAvailability {
  const { data: session } = useSession();
  const accessToken = session?.user.accessToken;
  const [result, setResult] = useState<CheckResult | null>(null);

  const name = eventName?.trim() ?? "";

  useEffect(() => {
    if (name.length < 3 || !accessToken) return;

    const controller = new AbortController();
    const query = new URLSearchParams({ eventName: name });
    if (excludeEventId) query.set("eventId", excludeEventId);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/validation/event-name?${query.toString()}`,
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
  }, [name, accessToken, excludeEventId]);

  // Status is derived: a result only counts if it matches the current value,
  // otherwise a request for that value is still in flight.
  if (name.length < 3 || !accessToken) return "idle";
  if (result?.name !== name) return "checking";
  // Reported, never silently swallowed. The create endpoint is still the
  // authority and will refuse a duplicate either way; this is about the
  // organiser knowing the name has not actually been cleared.
  if (result.available === null) return "unknown";
  return result.available ? "available" : "taken";
}
