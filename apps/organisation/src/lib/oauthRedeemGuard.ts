/**
 * ONE-SHOT GUARD FOR AN OAUTH AUTHORISATION CODE.
 *
 * A code can be redeemed exactly once. Redeem it twice and the second attempt
 * comes back `invalid_grant` — which is indistinguishable, from the UI's point
 * of view, from the connection having failed. The user is then shown "the
 * provider refused the connection" for a connection that actually succeeded
 * milliseconds earlier.
 *
 * A `useRef` is not enough. It survives React's StrictMode double-effect, but
 * NOT a remount — and Fast Refresh remounts components constantly in
 * development, which is exactly where this flow is exercised most.
 *
 * `sessionStorage` is keyed on the code itself, so it survives remounts, is
 * scoped to the tab, and cannot leak between two different authorisations.
 * Wrapped in try/catch because storage throws in private modes and a guard that
 * crashes the page would be worse than the double redemption.
 */
const KEY_PREFIX = "oauth-redeemed:";

export function hasRedeemed(code: string | undefined): boolean {
  if (!code) return false;
  try {
    return sessionStorage.getItem(KEY_PREFIX + code) === "1";
  } catch {
    return false;
  }
}

export function markRedeemed(code: string | undefined): void {
  if (!code) return;
  try {
    sessionStorage.setItem(KEY_PREFIX + code, "1");
  } catch {
    // Storage unavailable. The in-component ref still guards the common case.
  }
}
