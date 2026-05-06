import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

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

  // Check our custom expiry field. NextAuth v5 overwrites the reserved `exp`
  // JWT claim with iat+maxAge, so we store midnight expiry in `accessTokenExpires`
  // which NextAuth leaves untouched. Redirect 60s early to avoid the race
  // condition where the request passes middleware right before midnight.
  const now = Math.floor(Date.now() / 1000);
  const tokenExp = req.auth?.user?.accessTokenExpires;
  const isExpired = tokenExp !== undefined && tokenExp - 60 < now;

  if ((!req.auth || isExpired) && !req.nextUrl.pathname.startsWith(`/${locale}/auth/`)) {
    const newUrl = new URL(`/${locale}/auth/login`, req.nextUrl.origin);
    return Response.redirect(newUrl);
  }

  return intlResponse;
});

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
