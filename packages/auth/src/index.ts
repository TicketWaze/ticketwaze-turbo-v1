/**
 * ONE SIGN-IN FOR THE WEBSITE, THE ATTENDEE APP AND THE ORGANISATION APP.
 *
 * The three apps live on subdomains of one domain (ticketwaze.com,
 * app.ticketwaze.com, organisation.ticketwaze.com). Each used to keep its own
 * Auth.js session cookie, scoped to its own host, so signing in on one meant
 * nothing to the others. They now share a single cookie, set on the parent
 * domain: signing in anywhere signs you in everywhere, and signing out
 * anywhere signs you out everywhere.
 *
 * What makes sharing safe:
 * - Same AUTH_SECRET in the three apps, and the same cookie name — Auth.js
 *   derives the encryption key from both, so any other name (the admin app's)
 *   can never decrypt this cookie, even with the same secret.
 * - One token shape. Each app may add fields (the organisation app adds
 *   `activeOrganisation`) but must carry over the ones it does not own.
 * - No stale credentials written back: see `sanitizeSessionUpdate`.
 *
 * Configuration:
 * - AUTH_COOKIE_DOMAIN: the parent domain, e.g. `.ticketwaze.com`. Unset on
 *   localhost, where cookies are already shared across ports. A staging
 *   deployment on the same parent domain MUST use its own value (e.g.
 *   `.staging.ticketwaze.com`) or it will share sessions with production.
 * - AUTH_URL: https makes the cookie `__Secure-` and Secure.
 *
 * The admin app deliberately does NOT use this: an admin session must never
 * come from an attendee sign-in.
 */
import type { NextAuthConfig } from "next-auth";
import { decode } from "next-auth/jwt";

const BASE_COOKIE_NAME = "ticketwaze.session-token";

function useSecureCookies() {
  return (process.env.AUTH_URL ?? "").startsWith("https://");
}

/** The shared session cookie's name in this environment. */
export function sessionCookieName() {
  return `${useSecureCookies() ? "__Secure-" : ""}${BASE_COOKIE_NAME}`;
}

/** Drop into `NextAuth({ cookies: sharedSessionCookies() })`. */
export function sharedSessionCookies(): NextAuthConfig["cookies"] {
  const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();
  return {
    sessionToken: {
      name: sessionCookieName(),
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies(),
        ...(domain ? { domain } : {}),
      },
    },
  };
}

/**
 * Read a response body as JSON without trusting it to BE JSON.
 *
 * POST /auth/refresh does not always answer in JSON: when its throttle trips,
 * the API replies with the plain-text body "Too many requests". Calling
 * res.json() on that threw, which kept the EXPIRED access token in the session
 * and turned a rate limit into what looked like a broken session.
 */
export async function readJsonBody<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type RefreshResponse = {
  status?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  isOnboarded?: boolean;
  isSuspended?: boolean;
  suspensionReason?: string | null;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string | null;
};

type Token = Record<string, unknown>;

/**
 * Swap the refresh token for a new pair.
 *
 * Returns `null` only when the refresh token itself is dead (a 401) — which
 * clears the session in every app. Anything transient keeps the session and
 * flags the attempt, so the next request retries.
 *
 * Two apps may refresh the same token at once now that they share it. The API
 * keeps a rotated refresh token valid for a short grace window, so both
 * succeed; whichever cookie is written last wins, and both are valid.
 */
export async function refreshApiTokens(token: Token): Promise<Token | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.refreshToken}`,
        // Without it the API renders its errors as plain text.
        Accept: "application/json",
      },
    });
    const data = await readJsonBody<RefreshResponse>(res);

    if (res.status === 401) return null;
    if (!res.ok || data?.status !== "success") {
      return { ...token, error: "RefreshAccessTokenError" };
    }

    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpires: data.accessTokenExpires,
      // Self-heal stale sessions: a token seeded before onboarding or before a
      // suspension would otherwise carry the old state for up to 30 days.
      ...(typeof data.isOnboarded === "boolean"
        ? { isOnboarded: data.isOnboarded }
        : {}),
      ...(typeof data.isSuspended === "boolean"
        ? {
            isSuspended: data.isSuspended,
            suspensionReason: data.suspensionReason ?? null,
          }
        : {}),
      // Name and photo, so a change made in one app (or the mobile app) reaches
      // every navbar within one access-token period.
      ...(typeof data.firstName === "string" ? { firstName: data.firstName } : {}),
      ...(typeof data.lastName === "string" ? { lastName: data.lastName } : {}),
      ...("profileImageUrl" in (data ?? {})
        ? { profileImageUrl: data.profileImageUrl ?? null }
        : {}),
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/** Whether the access token is within a minute of expiring. */
export function needsRefresh(token: Token) {
  if (!token.accessTokenExpires || !token.refreshToken) return false;
  return Date.now() >= (token.accessTokenExpires as number) - 60_000;
}

/**
 * Fields a client `update()` may never write.
 *
 * Pages call `update({ user: { ...session.user, ... } })`, and `session.user`
 * carries the tokens as they were when the page loaded. If another app has
 * refreshed since, writing them back would replace the live refresh token with
 * one the API is about to expire — and sign the user out of every app a
 * minute later. Credentials only ever come from a login or a refresh.
 */
const SERVER_OWNED_FIELDS = [
  "accessToken",
  "refreshToken",
  "accessTokenExpires",
  "error",
  // Owned by the organisation app, which updates it through its own path.
  "activeOrganisation",
  // JWT claims.
  "iat",
  "exp",
  "jti",
  "sub",
] as const;

export function sanitizeSessionUpdate(patch: unknown): Token {
  if (!patch || typeof patch !== "object") return {};
  const clean: Token = { ...(patch as Token) };
  for (const field of SERVER_OWNED_FIELDS) delete clean[field];
  return clean;
}

/**
 * Decode the shared session READ-ONLY, for an app that shows who is signed in
 * but never signs anyone in (the marketing website).
 *
 * Deliberately not a NextAuth instance: Auth.js re-writes the session cookie
 * on every read, and an app that never refreshes would write back tokens that
 * another app has already rotated.
 *
 * Takes every cookie of the request; Auth.js splits a large session into
 * `<name>.0`, `<name>.1`… chunks.
 */
export async function readSharedSession(
  cookies: { name: string; value: string }[],
): Promise<Token | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  // Try both spellings, so a mismatched AUTH_URL cannot hide the session.
  for (const name of [`__Secure-${BASE_COOKIE_NAME}`, BASE_COOKIE_NAME]) {
    const whole = cookies.find((c) => c.name === name)?.value;
    const chunks = cookies
      .filter((c) => c.name.startsWith(`${name}.`))
      .sort(
        (a, b) =>
          Number(a.name.slice(name.length + 1)) -
          Number(b.name.slice(name.length + 1)),
      )
      .map((c) => c.value)
      .join("");
    const value = whole ?? (chunks || undefined);
    if (!value) continue;
    try {
      const token = await decode({ token: value, secret, salt: name });
      if (token) return token as Token;
    } catch {
      // Tampered, or from another secret: treat as signed out.
    }
  }
  return null;
}
