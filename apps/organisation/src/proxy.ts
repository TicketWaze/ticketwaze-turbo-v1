import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";

// Create the intl middleware first
const intlMiddleware = createMiddleware(routing);

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

  return intlResponse;
});

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
