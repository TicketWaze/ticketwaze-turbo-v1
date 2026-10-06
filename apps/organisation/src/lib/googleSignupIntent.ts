/**
 * The Google button on /auth/register opens an account; the one on
 * /auth/login only signs into an existing one. Both go through the same
 * Auth.js Google provider (one redirect URI registered with Google), so the
 * register page leaves this short-lived cookie before the redirect and the
 * `signIn` callback reads it to decide whether the API may create the account.
 */
export const GOOGLE_SIGNUP_COOKIE = "tw_google_signup";

/** Long enough to pick an account on Google's screen, short enough to expire. */
const MAX_AGE_SECONDS = 10 * 60;

export function markGoogleSignup() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${GOOGLE_SIGNUP_COOKIE}=1; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

/** The login button clears a leftover mark from an abandoned sign-up. */
export function clearGoogleSignup() {
  document.cookie = `${GOOGLE_SIGNUP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
