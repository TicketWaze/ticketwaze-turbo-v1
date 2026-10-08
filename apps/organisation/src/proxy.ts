import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";

// Create the intl middleware first
const intlMiddleware = createMiddleware(routing);

/**
 * The /auth pages a signed-in person may still open; every other one (login,
 * register) sends them back to the app.
 */
const SIGNED_IN_AUTH_PATHS = [
  "/auth/onboarding", // routing after sign-in, the set-up form and its name step
  "/auth/verification", // KYC, step 3/3 and from the dashboard banner
  "/auth/invitation/", // "Join <organisation>" from a team invite link
  "/auth/logout",
  "/auth/forgot-password", // Settings → Security → reset password
  "/auth/new-password",
];

export default auth((req) => {
  // First, let next-intl handle locale detection and redirection
  const intlResponse = intlMiddleware(req as NextRequest);

  // Extract locale from pathname
  const pathnameLocale = req.nextUrl.pathname.split("/")[1];
  const locale = routing.locales.includes(pathnameLocale as "en" | "fr")
    ? pathnameLocale
    : routing.defaultLocale;

  // Auth pages are recognised with or without a locale prefix. Auth.js sends
  // failures to the locale-less `pages.error` (`/auth/login?error=...`), and
  // treating that as a protected path used to bounce it through the redirect
  // below — which rebuilds the URL from scratch and drops the query, so the
  // sign-in error never reached the page that reports it. Falling through to
  // the intl middleware instead adds the locale and keeps the search params.
  const pathname = req.nextUrl.pathname;
  const hasLocalePrefix = routing.locales.includes(pathnameLocale as "en" | "fr");
  const pathWithoutLocale = hasLocalePrefix
    ? pathname.slice(pathnameLocale.length + 1) || "/"
    : pathname;
  const isAuthPath = pathWithoutLocale.startsWith("/auth/");

  // Then check authentication - req.auth is available in the Auth.js callback
  if (!req.auth && !isAuthPath) {
    const newUrl = new URL(`/${locale}/auth/login`, req.nextUrl.origin);
    newUrl.search = req.nextUrl.search;
    return Response.redirect(newUrl);
  }

  // Already signed in (possibly on the website or the attendee app): the auth
  // pages have nothing to do, except the few a signed-in person still needs.
  // Skipped when the page carries a sign-in error to report.
  if (
    req.auth &&
    isAuthPath &&
    !SIGNED_IN_AUTH_PATHS.some((path) => pathWithoutLocale.startsWith(path)) &&
    !req.nextUrl.searchParams.has("error")
  ) {
    return Response.redirect(
      new URL(
        req.auth.activeOrganisation
          ? `/${locale}/analytics`
          : `/${locale}/auth/onboarding`,
        req.nextUrl.origin,
      ),
    );
  }

  // Signed in, but with no organisation chosen. The session is shared with the
  // website and the attendee app, so this is someone who signed in over there
  // — or whose organisation was suspended mid-session. Onboarding sorts out
  // which: pick an organisation, accept an invite, create one, or be told the
  // organisation is suspended.
  if (req.auth && !req.auth.activeOrganisation && !isAuthPath) {
    return Response.redirect(
      new URL(`/${locale}/auth/onboarding`, req.nextUrl.origin),
    );
  }

  return intlResponse;
});

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
