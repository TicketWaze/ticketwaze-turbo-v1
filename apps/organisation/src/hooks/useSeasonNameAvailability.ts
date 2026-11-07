"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { EventNameAvailability } from "./useEventNameAvailability";

type CheckResult = { name: string; available: boolean | null };

/**
 * Live season-name availability, the season twin of useSaleTitleAvailability:
 * one request per keystroke, the previous one aborted. Advisory only — the
 * API's unique rule is what actually refuses a duplicate.
 */
export default function useSeasonNameAvailability(
  name: string,
  /** The season being edited, so it does not match its own name. */
  excludeSeasonId?: string,
): EventNameAvailability {
  const { data: session } = useSession();
  const accessToken = session?.user.accessToken;
  const [result, setResult] = useState<CheckResult | null>(null);
  const value = name?.trim() ?? "";

  useEffect(() => {
    if (value.length < 3 || !accessToken) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ name: value });
    if (excludeSeasonId) query.set("seasonId", excludeSeasonId);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/seasons/validation/name?${query.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      },
    )
      .then((response) => response.json())
      .then((body) => {
        if (controller.signal.aborted) return;
        setResult({
          name: value,
          available: body.status === "success" ? Boolean(body.available) : null,
        });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setResult({ name: value, available: null });
      });

    return () => controller.abort();
  }, [value, accessToken, excludeSeasonId]);

  if (value.length < 3 || !accessToken) return "idle";
  if (result?.name !== value) return "checking";
  if (result.available === null) return "idle";
  return result.available ? "available" : "taken";
}
