"use client";

import { useEffect } from "react";
import { trackEngagement } from "@/lib/engagement";

/** Matches the API's dedupe window; saves a request on reloads in between. */
const WINDOW_MS = 30 * 60 * 1000;

/**
 * Counts one view of an activity page for the organiser's analytics. Renders
 * nothing. The API dedupes too; this only spares the request on a reload or a
 * back-navigation within the same window.
 */
export default function TrackActivityView({
  activityId,
}: {
  activityId: string;
}) {
  useEffect(() => {
    const key = `tw:view:${activityId}`;
    try {
      const last = Number(window.sessionStorage.getItem(key) ?? 0);
      if (Date.now() - last < WINDOW_MS) return;
      window.sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // Storage blocked: report anyway, the API dedupes.
    }
    trackEngagement(activityId, "view");
  }, [activityId]);
  return null;
}
