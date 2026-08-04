/**
 * The API refuses a suspended account's transactions with a 403 carrying this
 * code (see `app/services/account_suspension.ts` on the API side). Its
 * `message` is written for logs and developers, in English — never show it.
 * Callers match the code and render their own localized copy.
 */
export const ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED";

/**
 * True when an API response was refused because the account is suspended.
 *
 * Worth having even though the session already carries `isSuspended`: a session
 * seeded before the suspension keeps the old value until its next refresh, so
 * the client's own state can be up to an access-token period behind the
 * server's. The session decides what the interface OFFERS; this decides what a
 * refusal MEANS once one arrives.
 */
export function isSuspendedResponse(response: unknown): boolean {
  return (
    typeof response === "object" &&
    response !== null &&
    (response as { code?: unknown }).code === ACCOUNT_SUSPENDED
  );
}
