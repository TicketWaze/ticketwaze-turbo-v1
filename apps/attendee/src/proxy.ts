import createMiddleware from "next-intl/middleware";
import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";

/**
 * The /auth pages a signed-in person may still open; every other one (login,
 * register, verify-account) sends them back to the app.
 */
const SIGNED_IN_AUTH_PATHS = [
  "/auth/onboarding", // the set-up after sign-up, and the organizer hand-off
  "/auth/forgot-password", // Settings → change password → forgot it
  "/auth/new-password",
];

const middleware = auth(async (req) => {
  const locale = await getLocale();

  // Handle referral code if present
  const referralCode = req.nextUrl.searchParams.get("referral");

  // Define paths that don't require authentication
  const publicPaths = [
    `/${locale}/auth/`,
    `/${locale}/explore`,
    `/${locale}/organizers`,
    `/`,
  ];

  // Check if the current path is public
  const isPublicPath = publicPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path),
  );

  // Redirect to login only if user is not authenticated AND path is not public
  if (!req.auth && !isPublicPath) {
    const newUrl = new URL(`/${locale}/auth/login`, req.nextUrl.origin);
    // Back to the page that was asked for (e.g. the profile reminder email's
    // /profile?edit=1) once signed in. Locale-less, as the login page expects.
    const path = req.nextUrl.pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "");
    if (path && path !== "/") {
      newUrl.searchParams.set("callbackUrl", path + req.nextUrl.search);
    }
    return Response.redirect(newUrl);
  }

  // Already signed in — possibly on the website or the organisation app, which
  // share this session. The auth pages have nothing to do, except the few a
  // signed-in person still needs. Skipped when the page carries a sign-in
  // error to report.
  const authPrefix = `/${locale}/auth/`;
  if (
    req.auth &&
    req.nextUrl.pathname.startsWith(authPrefix) &&
    !SIGNED_IN_AUTH_PATHS.some((path) =>
      req.nextUrl.pathname.startsWith(`/${locale}${path}`),
    ) &&
    !req.nextUrl.searchParams.has("error")
  ) {
    // Back to where the login was headed, when that is a page of this app.
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const target =
      callbackUrl?.startsWith("/") &&
      !callbackUrl.startsWith("//") &&
      !callbackUrl.startsWith("/auth/")
        ? `/${locale}${callbackUrl}`
        : `/${locale}/explore`;
    return Response.redirect(new URL(target, req.nextUrl.origin));
  }

  // Accounts that skipped "Complete Account Set-up" (notably ones made from
  // the organisation app) are NOT redirected there: they browse freely, and
  // the API's Tuesday profile reminder (email + bell) asks for the details.

  // Get the response from next-intl middleware
  const response = createMiddleware(routing)(req);

  // Set referral cookie if ref parameter exists
  if (referralCode && response) {
    response.cookies.set("referral_code", referralCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 30, // 30 minutes
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
});

export default middleware;

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
