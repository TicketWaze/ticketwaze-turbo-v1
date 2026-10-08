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

  // Then check authentication - req.auth is available in the Auth.js callback
  const onAuthPage = req.nextUrl.pathname.startsWith(`/${locale}/auth/`);
  if (!req.auth && !onAuthPage) {
    const newUrl = new URL(`/${locale}/auth/login`, req.nextUrl.origin);
    return Response.redirect(newUrl);
  }

  // A signed-in admin has nothing to do on sign-in or reset. /auth/join stays
  // open: an invitation link may be opened in a browser signed in as someone
  // else, and accepting it replaces that session.
  const sessionExpired =
    (req.auth as { error?: string } | null)?.error === "AccessTokenExpired";
  if (
    req.auth &&
    !sessionExpired &&
    /^\/(en|fr)\/auth\/(login|reset)\/?$/.test(req.nextUrl.pathname)
  ) {
    return Response.redirect(new URL(`/${locale}/analytics`, req.nextUrl.origin));
  }

  return intlResponse;
});

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
