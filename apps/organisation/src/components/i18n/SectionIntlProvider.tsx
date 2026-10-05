import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

/**
 * Top-level message namespaces. Each section lists the ones its client
 * components use, directly or through what they import (shared components
 * included) — server components read the full catalogue regardless.
 */
export type Namespace =
  | "Analytics"
  | "Auth"
  | "Consent"
  | "Events"
  | "Finance"
  | "Layout"
  | "Raffles"
  | "Sales"
  | "Settings"
  | "WelcomeModal";

/**
 * Hands a section's client components only the messages they can use. The
 * whole catalogue is ~40 KB gzipped and is inlined into the HTML of every full
 * page load, uncached; Analytics (the landing page) and the sign-in pages need
 * about a quarter of it.
 *
 * Adding `useTranslations("X")` in a client component of a section means
 * adding "X" to that section's list in its layout — otherwise the text shows
 * as its key.
 */
export default async function SectionIntlProvider({
  namespaces,
  children,
}: {
  namespaces: Namespace[];
  children: React.ReactNode;
}) {
  const all = await getMessages();
  const messages = Object.fromEntries(
    namespaces.filter((n) => n in all).map((n) => [n, all[n]]),
  );
  return (
    <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
  );
}
