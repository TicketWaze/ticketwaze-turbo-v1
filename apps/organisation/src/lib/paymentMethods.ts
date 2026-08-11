/**
 * Which payment methods are offered in the UI.
 *
 * A flag rather than deleted markup: nothing behind NatCash has been removed.
 * The subscription endpoints and the shared callback still work, so a payment
 * already in flight completes, and an organisation whose current subscription
 * was paid by NatCash still sees that on its billing screen.
 */

/**
 * NatCash is hidden from the subscription upgrade page. Set to `true` to offer
 * it again — and flip the matching flag in the attendee app, which covers event
 * and raffle checkout.
 */
export const NATCASH_ENABLED = false;
