"use client";
import { useEffect } from "react";
import { installClientErrorReporting } from "@ticketwaze/client-logging";

/**
 * Attaches the window-level error and unhandled-rejection listeners.
 *
 * A component rather than a bare call so it runs once on mount inside the
 * React tree, and tears its listeners down on unmount. Renders nothing.
 */
export default function ClientErrorReporter() {
  useEffect(() => installClientErrorReporting("attendee"), []);
  return null;
}
