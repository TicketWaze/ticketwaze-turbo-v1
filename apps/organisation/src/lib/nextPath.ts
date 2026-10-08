/**
 * WHERE TO LAND AFTER SIGNING IN, carried through the sign-in steps as `?next=`.
 *
 * A link from an email ("Verify my organisation" → /auth/verification) opened
 * while signed out goes proxy → login → (code) → onboarding, and onboarding
 * would otherwise always send people to /analytics. Each step passes `next`
 * on, and onboarding lands on it once the organisation is chosen.
 *
 * Only in-app paths are accepted, stored WITHOUT the locale (the locale is
 * re-added from the user's language at the end). Anything else — another host,
 * `//evil.com`, a backslash trick, or a sign-in page that would loop — is
 * dropped, so `next` can never be used as an open redirect.
 */

const LOCALE_PREFIX = /^\/(en|fr)(?=\/|$)/;

/** Sign-in steps themselves: landing on them after signing in would loop. */
const NEVER_NEXT = ["/auth/login", "/auth/logout", "/auth/onboarding", "/auth/register"];

export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.includes("\\") || path.includes("://") || /[\s\u0000-\u001f]/.test(path)) {
    return null;
  }
  path = path.replace(LOCALE_PREFIX, "") || "/";
  if (path === "/" || path === "/analytics") return null; // the default anyway
  if (NEVER_NEXT.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`))) {
    return null;
  }
  return path;
}

/** `path` with `?next=` added when there is somewhere to go back to. */
export function withNext(path: string, next: string | null | undefined): string {
  if (!next) return path;
  return `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}`;
}
