import createMiddleware from "next-intl/middleware";
import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";

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
    return Response.redirect(newUrl);
  }

  // Authenticated users who never completed onboarding are sent there before
  // anything else (covers Google sign-ups mid-browse and abandoned flows).
  // Auth pages stay reachable so the onboarding flow itself is not blocked.
  // `isOnboarded === false` is checked strictly: sessions created before this
  // field existed are left untouched. Long-lived sessions seeded before the
  // user onboarded can carry a stale root flag, but their userPreference
  // (written when onboarding completed) tells the truth — trust either.
  const isAuthPath = req.nextUrl.pathname.startsWith(`/${locale}/auth/`);
  const sessionUser = req.auth?.user as
    | { isOnboarded?: boolean; userPreference?: { isOnboarded?: boolean } }
    | undefined;
  const isOnboarded =
    sessionUser?.isOnboarded === true ||
    sessionUser?.userPreference?.isOnboarded === true;
  if (sessionUser && sessionUser.isOnboarded === false && !isOnboarded && !isAuthPath) {
    const onboardingUrl = new URL(
      `/${locale}/auth/onboarding`,
      req.nextUrl.origin,
    );
    return Response.redirect(onboardingUrl);
  }

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
