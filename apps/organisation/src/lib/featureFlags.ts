/**
 * ONLINE EVENTS ARE TEMPORARILY CLOSED TO NEW CREATION.
 *
 * Both providers are fully built — Google Meet and Zoom, connection flows,
 * per-buyer access, plan limits, refunds, teardown. **None of it is deleted or
 * commented out.** This flag only decides whether the entry points into the
 * create flow open or answer "coming soon", so turning the feature back on is
 * one boolean rather than an archaeology exercise.
 *
 * What it deliberately does NOT touch:
 * - Online events ALREADY PUBLISHED. They keep selling, buyers keep joining,
 *   organisers keep editing. Withdrawing a feature must never strand an event
 *   somebody has already paid to attend.
 * - Anything on the API. The routes stay live, so an event mid-flight is not
 *   broken by a frontend switch, and staging can still exercise the whole path.
 *
 * Gated here rather than by removing the card, because a card that disappears
 * looks like a bug to an organiser who used the feature last week, while one
 * that says "coming soon" reads as a decision.
 */
export const ONLINE_EVENTS_ENABLED = false;
