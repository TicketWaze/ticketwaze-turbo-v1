/**
 * ONLINE EVENTS ARE OPEN TO NEW CREATION.
 *
 * Both providers are fully built — Google Meet and Zoom, connection flows,
 * per-buyer access, plan limits, refunds, teardown. This flag decides whether
 * the entry points into the create flow open or answer "coming soon", so the
 * feature is one boolean either way rather than an archaeology exercise.
 *
 * What it deliberately does NOT touch:
 * - Online events ALREADY PUBLISHED. They keep selling, buyers keep joining,
 *   organisers keep editing, whichever way this flag points. Withdrawing a
 *   feature must never strand an event somebody has already paid to attend.
 * - Anything on the API. The routes stay live, so an event mid-flight is not
 *   broken by a frontend switch, and staging can still exercise the whole path.
 *
 * When off, gated here rather than by removing the card, because a card that
 * disappears looks like a bug to an organiser who used the feature last week,
 * while one that says "coming soon" reads as a decision.
 */
export const ONLINE_EVENTS_ENABLED = true;
