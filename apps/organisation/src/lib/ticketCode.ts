// Kept apart from ticketScanner.ts, which imports the camera library: the
// check-in panel needs this on load, the ~110 KB scanner only once a camera opens.

/**
 * THE TICKET ID IN WHATEVER THE CAMERA OR THE KEYBOARD PRODUCED, OR NULL.
 *
 * Every ticket's QR (purchase, reward, giveaway; emailed image or in-app)
 * encodes its UUID: uppercase on new tickets, lowercase on older ones. The
 * value also goes into the request PATH, so anything else a camera might read
 * (a URL, stray whitespace, another app's QR) is rejected here rather than
 * sent to a route it would not match. Mirrors `parseTicketCode` in the API.
 */
const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extractTicketCode(raw: string | null | undefined): string | null {
  const match = String(raw ?? "").match(UUID_PATTERN);
  return match ? match[0].toLowerCase() : null;
}
