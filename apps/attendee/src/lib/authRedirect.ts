// Where to send someone after they sign in or up from a signed-out prompt.
// Only same-app paths are honoured so the parameter can't be used as an open
// redirect: "/explore/x" is fine, "//evil.com" and "https://…" are dropped.

export function safeCallbackPath(value: string | null | undefined) {
  if (!value) return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

/** `/auth/login` (or register) carrying the return path, skipping the mobile splash. */
export function authHref(
  page: "/auth/login" | "/auth/register",
  callbackUrl?: string,
) {
  const safe = safeCallbackPath(callbackUrl);
  return safe
    ? `${page}?start&callbackUrl=${encodeURIComponent(safe)}`
    : `${page}?start`;
}
