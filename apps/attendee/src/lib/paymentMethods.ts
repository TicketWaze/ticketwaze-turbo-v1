/**
 * Which payment methods are offered in the UI.
 *
 * A flag rather than deleted markup: nothing behind NatCash has been removed.
 * The API routes, the callback gateway and the settlement code are all intact,
 * so payments already in flight still complete, and turning it back on is
 * flipping this one line — not rebuilding a checkout button and re-deriving the
 * fee maths that goes with it.
 */

/**
 * NatCash is hidden from checkout. Set to `true` to offer it again.
 *
 * Note the organisation app carries its own copy of this flag for the
 * subscription upgrade page; the two apps ship separately, so a single shared
 * constant would not spare a deploy. Flip both together.
 */
export const NATCASH_ENABLED = false;
