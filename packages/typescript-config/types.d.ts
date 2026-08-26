import { DateTime } from "luxon";
export interface Country {
  name: {
    common: string;
    official: string;
    nativeName: {
      [key: string]: {
        official: string;
        common: string;
      };
    };
  };
}

export interface OrganisationTicket extends Ticket {
  event: Event;
}
export interface EventAttendee {
  eventAttendeeId: string;
  eventId: string;
  fullName: string;
  email: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface UserWallet {
  walletId: string;
  userId: string;
  usdPendingBalance: number;
  usdAvailableBalance: number;
  htgPendingBalance: number;
  htgAvailableBalance: number;
  userInvited: number;
  ticketwazeToken: number;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface EventPerformer {
  eventPerformerId: string;
  performerName: string;
  performerLink: string;
  performerProfileUrl: string;
  eventId: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface WaitlistMember {
  organisationId: string;
  fullName: string;
  email: string;
  role: number;
  dateAdded: DateTime;
  addedBy: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface UserPreference {
  userPreferenceId: string;
  userId: string;
  appLanguage: string;
  newEventsFollowedOrganizer: boolean;
  newEventsPreferredCategories: boolean;
  upcomingEvents: boolean;
  currency: "HTG" | "USD";
  interests: string[];
  groupSize: "solo" | "small" | "group";
  referralSource: string;
  travelPreference: string;
  isOnboarded: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface UserAnalytic {
  userAnalyticId: string;
  userId: string;
  eventAttended: number;
  eventMissed: number;
  ticketPurchased: number;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface TicketReturn {
  ticketReturnId: string;
  ticketId: string | null;
  ticketName: string;
  ticketType: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  ticketPrice: number;
  ticketUsdPrice: number;
  originalStatus: "PENDING" | "CHECKED";
  eventId: string;
  orderId: string;
  organisationId: string;
  ticketOwnerUserId: string | null;
  reason: "USER_INITIATED" | "EVENT_CANCELLED";
  initiatedByUserId: string | null;
  createdAt: string;
}

export interface TicketCheckIn {
  ticketCheckInId: string;
  ticketId: string;
  eventId: string;
  organisationId: string;
  checkedInAt: DateTime;
  checkedOutAt: DateTime | null;
  checkedInBy: string | null;
  checkedOutBy: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface Ticket {
  ticketId: string;
  ticketName: string;
  ticketType: string;
  eventId: string;
  orderId: string;
  /** Who paid for the ticket. */
  userId: string;
  /**
   * Who the ticket is for, when it was bought for someone else who has an
   * account. Null when the buyer kept it or the recipient has no account.
   */
  recipientUserId?: string | null;
  fullName: string;
  email: string;
  ticketPrice: number;
  ticketUsdPrice: number;
  /**
   * What the ORGANISATION earned on this ticket, as opposed to what the buyer
   * paid for it (`ticketPrice`). The two are the same number whenever the buyer
   * carries the fees; on an activity with `absorbFees` they differ by the fee
   * stack, which depends on the route THIS buyer chose and so is snapshotted at
   * sale time rather than recomputed.
   *
   * Null means "the same as `ticketPrice`" — every ticket sold before the column
   * existed was credited its base price. Always read it through
   * `ticketOrganisationAmount()` so that fallback is applied consistently.
   */
  organisationAmount?: number | null;
  organisationUsdAmount?: number | null;
  organisationId: string;
  isRefundable: boolean;
  status: "PENDING" | "CHECKED" | "RETURNED";
  /**
   * THIS holder's own Zoom join link, set only on tickets for an online event
   * whose `onlineProvider` is "zoom". Null on Google Meet events, where access
   * comes from the calendar invite instead, and null while a registration is
   * still outstanding. Never the event's generic `zoomJoinUrl`.
   */
  zoomJoinUrl?: string | null;
  zoomRegistrantId?: string | null;
  /**
   * Only ever populated for EVENT tickets — a raffle entry hangs off an activity
   * with no `events` row. Prefer `activity` on any endpoint that sends it.
   */
  event?: Event;
  /**
   * Normalized activity behind the ticket, built server-side. Present on the
   * admin tickets endpoint; absent wherever tickets are returned raw.
   */
  activity?: OrderActivitySummary | null;
  order?: Order;
  // Attendance (check-in/out) summary — present on the event records payload.
  checkIns?: TicketCheckIn[];
  /**
   * What this seat's holder answered at checkout. Present only when the
   * organiser built a form, and only on the organiser-side event fetch that
   * preloads it — absent everywhere else, hence optional.
   */
  formAnswers?: TicketFormAnswer[];
  presence?: "inside" | "outside";
  totalMinutesInside?: number;
  entriesCount?: number;
  currentSessionCheckedInAt?: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface OrganisationMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  role: string;
  addedBy: string;
  joinedAt: DateTime;
  lastLogin: DateTime;
  permissions: string[];
  hasCustomPermissions: boolean;
}

export interface Organisation {
  organisationId: string;
  userId: string;
  organisationName: string;
  myRole?: string | null;
  myPermissions?: string[];
  organisationDescription: string;
  organisationEmail: string;
  organisationWebsite: string;
  country: string;
  state: string;
  city: string;
  profileImageUrl: string | null;
  socialLinks: Record<string, any> | null;
  currency: string;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  organisationPhoneNumber: string;
  pendingBalance: number;
  availableBalance: number;
  usdPendingBalance: number;
  usdAvailableBalance: number;
  withdrawalPin: string | null;
  moncashAccountName: string | null;
  moncashNumber: string | null;
  natcashAccountName: string | null;
  natcashNumber: string | null;
  isVerified: boolean;
  isPublished: boolean;
  membershipTierId: string;
  /**
   * OAuth tokens are deliberately ABSENT from this type.
   *
   * `google_*` and `zoom_*` access and refresh tokens are `serializeAs: null`
   * on the API model — they used to be serialized into responses that reach
   * attendees, which was a live credential leak. Nothing client-side may know
   * them, so connection state is read from `GET /events/zoom/:id/status`
   * rather than by checking whether a token is present.
   */
  events: Event[];
  followers: User[];
  followersCount?: number;
  membershipTier: MembershipTier;
  createdAt: DateTime;
  updatedAt: DateTime;
}

/**
 * Normalized activity behind an order, built server-side. The finance tables
 * read this instead of `order.tickets[0].event`, which only exists for events
 * and left raffle sales invisible.
 */
export interface OrderActivitySummary {
  activityId: string;
  activityType: "event" | "raffle";
  name: string;
  currency: string;
  timezone: string | null;
  /** Events only: day 1, naive wall-clock (format with keepLocalTime). */
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  /** Raffles only: the draw instant, correct UTC (format by converting). */
  drawAt: string | null;
  /** Events only: venue, for the admin ticket drawer. Null on raffles. */
  eventCategory?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface Order {
  orderId: string;
  eventId: string;
  userId: string;
  organisationId: string;
  amount: number;
  usdPrice: number;
  orderName: string;
  provider: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | "RETURNED";
  /** Set on guest checkouts, where there is no user record to read the name from. */
  isGuest: boolean;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  tickets: Ticket[];
  /** Present on the finance endpoints; absent wherever orders are returned raw. */
  activity?: OrderActivitySummary;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface NotificationPreference {
  organisationPreferenceId: string;
  organisationId: string;
  emailTicketSalesUpdate: boolean;
  emailPaymentUpdates: boolean;
  emailPlatformAnnouncements: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface EventTicketType {
  eventTicketTypeId: string;
  eventId: string;
  organisationId: string;
  ticketTypeName: string;
  ticketTypeDescription: string;
  ticketTypePrice: number;
  currency: string;
  usdPrice: number;
  // currencyId: string;
  ticketTypeQuantity: number;
  ticketTypeQuantitySold: number;
  isRefundable: boolean;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export interface EventDay {
  eventDayId: string;
  eventId: string;
  organisationId: string;
  dayNumber: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

/** The optional file attached to an online event. One per event, or none. */
export interface EventDocument {
  eventDocumentId: string;
  eventId: string;
  originalFilename: string;
  byteSize: number;
  mimeType: string;
  scanStatus: "pending" | "clean" | "infected" | "error" | "skipped";
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface Event {
  eventId: string;
  organisationId: string;
  eventName: string;
  eventDescription: string;
  address: string;
  state: string;
  city: string;
  country: string;
  location: { lat: number; lng: number };
  eventImageUrl: string;
  eventType: string;
  eventCategory: string;
  /**
   * A teaser: no eventDays, no eventTicketTypes, and city/country may be null.
   * Anything reading a date, a price or a location off an event must branch on
   * this first.
   */
  isComingSoon?: boolean;
  /** Free text like "Summer 2027". Null when the organiser gave no hint. */
  comingSoonHint?: string | null;
  /**
   * Optional teaser day ("2027-06-14"). A date, not a timestamp, and not an
   * event day: it schedules nothing and drives no reminders.
   */
  comingSoonDate?: string | null;
  adminStatus: "review" | "approved" | "rejected" | "requested";
  /**
   * An organiser edited something worth a second look. A separate axis from
   * adminStatus, which edits deliberately leave alone: this gates nothing, so
   * the event keeps selling and scanning while it waits in the admin queue.
   * Null once an admin has ruled either way.
   */
  pendingReviewAt: string | null;
  /** Field keys that triggered the review ("name", "description", ...). */
  pendingReviewReason: string[] | null;
  /**
   * When this event last changed in a way that affects whether a buyer can
   * still use what they bought. Opens a fixed refund window for tickets bought
   * before it.
   */
  materialChangeAt: string | null;
  isActive: boolean;
  isFree: boolean;
  isPrivate: boolean;
  currency: string;
  /**
   * Who pays the fees.
   *
   * False (the default) means they are added ON TOP of the price below: the
   * buyer pays price + fees and the organisation is credited the price whole.
   * True reverses it — the price below is exactly what the buyer pays, and the
   * fees come out of what the organisation receives.
   *
   * Every surface that quotes a price has to read it, which is why it sits on
   * the activity rather than anywhere cleverer.
   */
  absorbFees: boolean;
  activityTags: string[];
  ticketSalesEndAt: string | null;
  /**
   * When this event's attached document unlocks, as an ISO string.
   *
   * Computed by the API — the rule is one timezone-sensitive comparison over
   * the event's days, and recomputing it in the browser would be a second
   * implementation of something easy to get subtly wrong. Null when there is no
   * document. Populated only by `GET /events/upcoming/:eventId`.
   */
  documentAvailableAt?: string | null;
  eventDays: EventDay[];
  eventTicketTypes: EventTicketType[];
  /**
   * The optional document attached to an online event, when one is stored.
   *
   * Never carries the S3 key: it is `serializeAs: null` on the API model, so a
   * private key cannot ride out on a response. Downloads go through
   * `GET /events/:eventId/document/download`, which checks the ticket and the
   * unlock time before minting a short-lived URL.
   */
  eventDocument?: EventDocument | null;
  eventTagId: string;
  googleMeetLink: string;
  googleCalendarEventId: string;
  /**
   * Which platform hosts an online event. Null on in-person events; existing
   * online events are backfilled to "google_meet".
   */
  onlineProvider?: "google_meet" | "zoom" | null;
  /**
   * The event's GENERIC Zoom link. Deliberately not what a buyer joins with —
   * each buyer is registered separately and gets their own link on their
   * ticket. Present for the organiser's own reference only.
   */
  zoomJoinUrl?: string | null;
  zoomMeetingId?: string | null;
  zoomSeatLimit?: number | null;
  /**
   * Seats this Google Meet event was built against, from the plan the organiser
   * had declared at the time. Absent on events created before plans were
   * declared at all, which fall back to the organisation's current declaration.
   */
  googleSeatLimit?: number | null;
  discountCodes: DiscountCode[];
  eventPerformers: EventPerformer[];
  eventAttendees: EventAttendee[];
  tickets: Ticket[];
  orders: Order[];
  organisation: Organisation;
  createdAt: string;
  updatedAt: string;
  /**
   * Cancellation is distinct from deletion: the event and its tickets stay on
   * record, everything is marked RETURNED, and buyers keep a visible answer to
   * what became of what they paid for. Set by the admin refund action.
   */
  cancelledAt: string | null;
  cancellationReason: string | null;
  deletionStatus: "pending_deletion" | "deleted" | null;
  deletionReason: string | null;
  deletionRequestedAt: string | null;
  scheduledDeletionAt: string | null;
  ticketReturns: TicketReturn[];
}

/**
 * An organiser's edit held back from an event that already has sales, waiting
 * on an admin. The live event is unchanged until this is approved — see the
 * event_revisions migration.
 */
export interface EventRevision {
  revisionId: string;
  eventId: string;
  organisationId: string;
  /** The complete proposed edit, not a diff. */
  payload: {
    eventName: string;
    eventDescription: string;
    address: string;
    eventDays?: { dayNumber: number; eventDate: string; startTime: string }[];
  };
  /** Which misrepresentable fields this edit touches. */
  changedFields: string[];
  /** A new poster, uploaded but deliberately not yet live. */
  imageUrl: string | null;
  imageKey: string | null;
  status: "pending" | "applied" | "rejected" | "superseded";
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  event: Event;
}

/**
 * A raffle edit held back from a draw that already has entries. The live raffle
 * is unchanged until this is approved.
 */
export interface RaffleRevision {
  revisionId: string;
  raffleId: string;
  organisationId: string;
  payload: {
    title: string;
    description: string;
    salesEndAt: string;
    drawAt: string;
    coverImageUrl: string | null;
    prizes: {
      title: string;
      description: string | null;
      imageUrl: string | null;
    }[];
  };
  changedFields: string[];
  status: "pending" | "applied" | "rejected" | "superseded";
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  raffle: Raffle;
}

export interface RafflePrize {
  rafflePrizeId: string;
  raffleId: string;
  rank: number;
  title: string;
  description: string | null;
  /** Optional picture of the prize, shown to buyers and during the draw. */
  imageUrl?: string | null;
  imageKey?: string | null;
  /** Set by the draw. Null means this rank went unawarded. */
  winningRaffleTicketId?: string | null;
  claimStatus?: "to_claim" | "claimed" | "unclaimed";
}

export interface Raffle {
  raffleId: string;
  organisationId: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  ticketPrice: number;
  currency: string;
  usdPrice: number;
  /**
   * Who pays the fees.
   *
   * False (the default) means they are added ON TOP of the price below: the
   * buyer pays price + fees and the organisation is credited the price whole.
   * True reverses it — the price below is exactly what the buyer pays, and the
   * fees come out of what the organisation receives.
   *
   * Every surface that quotes a price has to read it, which is why it sits on
   * the activity rather than anywhere cleverer.
   */
  absorbFees: boolean;
  totalTicketsLimit: number | null;
  activityTags: string[];
  location: { lat: number; lng: number } | null;
  salesStartAt: string;
  salesEndAt: string;
  drawAt: string;
  timezone: string | null;
  drawMode: "automatic" | "manual";
  /** Set once the draw has run; the raffle is immutable from then on. */
  drawnAt: string | null;
  /** Published so participants can recompute the draw themselves. */
  drawSeed?: string | null;
  drawAlgorithm?: string | null;
  drawRecord?: Record<string, unknown> | null;
  adminStatus: "review" | "approved" | "rejected" | "requested";
  /**
   * An organiser edited something worth a second look. A separate axis from
   * adminStatus, which edits deliberately leave alone: this gates nothing, so
   * the draw keeps selling entries while it waits in the admin queue.
   */
  pendingReviewAt: string | null;
  /** Field keys that triggered the review ("name", "description", ...). */
  pendingReviewReason: string[] | null;
  rejectionReason: string | null;
  status: "on_sale" | "closed" | "drawn" | "completed" | "cancelled";
  deletionStatus: "pending_deletion" | "deleted" | null;
  deletionReason: string | null;
  deletionRequestedAt: string | null;
  scheduledDeletionAt: string | null;
  prizes: RafflePrize[];
  createdAt: string;
  updatedAt: string;
}

/**
 * One awarded prize, resolved to the person holding the winning entry. Ranks
 * that went unawarded (fewer entries than prizes) have no row at all.
 */
export interface RaffleWinner {
  rank: number;
  rafflePrizeId: string;
  prizeTitle: string;
  claimStatus: "to_claim" | "claimed" | "unclaimed";
  ticketId: string | null;
  ticketName: string | null;
  fullName: string | null;
  email: string | null;
}

/**
 * A raffle as returned by the attendee's own endpoints (`/me/raffles`), with
 * the signed-in buyer's entry numbers attached. Never the full entry list of
 * the raffle: only the caller's own.
 */
export interface MyRaffle extends Raffle {
  entries: Ticket[];
  organisation?: Organisation;
}

export interface RestaurantHour {
  hourId: string;
  restaurantId: string;
  /** 0 = Sunday .. 6 = Saturday. A day with no row is closed. */
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
}

export interface RestaurantImage {
  imageId: string;
  restaurantId: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
}

/** Derived server-side; never stored. */
export interface RestaurantOpenState {
  isOpen: boolean;
  today: { opensAt: string; closesAt: string } | null;
  crossesMidnight: boolean;
}

export interface Restaurant {
  restaurantId: string;
  organisationId: string;
  name: string;
  /** Immutable once approved — printed QR codes encode it. */
  slug: string;
  description: string;
  establishmentType:
    | "restaurant"
    | "bar"
    | "cafe"
    | "lounge"
    | "club"
    | "bakery"
    | "food_truck";
  cuisineTypes: string[];
  priceRange: number;
  address: string;
  city: string;
  state: string;
  country: string;
  location: { lat: number; lng: number } | null;
  locationNotes: string | null;
  timezone: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  coverImageUrl: string | null;
  acceptsReservations: boolean;
  acceptsOnlinePayment: boolean;
  /**
   * Who pays the fees.
   *
   * False (the default) means they are added ON TOP of the price below: the
   * buyer pays price + fees and the organisation is credited the price whole.
   * True reverses it — the price below is exactly what the buyer pays, and the
   * fees come out of what the organisation receives.
   *
   * Every surface that quotes a price has to read it, which is why it sits on
   * the activity rather than anywhere cleverer.
   */
  absorbFees: boolean;
  offersDelivery: boolean;
  offersTakeout: boolean;
  deliveryPhone: string | null;
  deliveryZones: string[] | null;
  deliveryFee: number | null;
  minimumOrder: number | null;
  deliveryEstimatedMinutes: number | null;
  /** 24/7 — when true the hours rows are ignored. */
  alwaysOpen: boolean;
  reservationFee: number;
  reservationFeeCurrency: string;
  minPartySize: number;
  maxPartySize: number;
  slotIntervalMinutes: number;
  defaultDurationMinutes: number;
  leadTimeMinutes: number;
  maxAdvanceDays: number;
  maxCoversPerSlot: number;
  holdMinutes: number;
  amenities: string[];
  dietaryOptions: string[];
  languagesSpoken: string[];
  inPersonPaymentMethods: string[];
  servesAlcohol: boolean;
  dressCode: string | null;
  seatingCapacity: number | null;
  // Visibility is four independent switches; public visibility is derived from
  // all of them. Ticketwaze owns adminStatus/suspendedAt, the org owns the rest.
  adminStatus: "review" | "approved" | "rejected" | "requested";
  rejectionReason: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  isListed: boolean;
  isPermanentlyClosed: boolean;
  hours: RestaurantHour[];
  images?: RestaurantImage[];
  openState?: RestaurantOpenState;
  createdAt: string;
  updatedAt: string;
}

/** A settled sale against a restaurant. Counter payment or reservation fee. */
export interface RestaurantTransaction {
  orderId: string;
  orderName: string;
  /** What the organisation earns — the base, not the fee-inclusive total. */
  amount: number;
  currency: string;
  provider: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  isGuest: boolean;
  createdAt: string;
  items: {
    itemName: string;
    itemType: "restaurant_payment" | "reservation_fee";
    quantity: number;
    unitPrice: number;
  }[];
}

export interface RestaurantStats {
  currency: string;
  revenue: number;
  monthRevenue: number;
  transactionCount: number;
  averageSale: number;
}

/**
 * One uploaded version of the file a sale sells.
 *
 * `s3Key` is deliberately absent: it points into a private prefix CloudFront
 * does not serve, and nothing in a browser should ever hold it. Downloads are
 * short-lived presigned URLs minted against a checked entitlement.
 */
export interface SaleFile {
  saleFileId: string;
  saleId: string;
  originalFilename: string;
  byteSize: number;
  mimeType: string;
  /**
   * `skipped` means no scanner ran, and is deliberately not `clean` — no
   * automated scanner is wired up yet, and a file nobody checked must not be
   * displayed as one that came back clean.
   */
  scanStatus: "pending" | "clean" | "infected" | "error" | "skipped";
  scanResult: string | null;
  scannedAt: string | null;
  version: number;
  /** Exactly one per sale; older versions stay for the buyers who paid for them. */
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * What a buyer pays for a sale, derived on every read rather than stored, so a
 * change to the fee rule can never leave old listings quoting an old surcharge.
 */
export interface SalePricing {
  /** The price on the listing, whichever way the surcharge falls. */
  listedPrice: number;
  /**
   * What the seller is CREDITED — the listed price when the buyer carries the
   * surcharge, the listed price minus it when the seller absorbs it.
   */
  sellerPrice: number;
  /** Ticketwaze's margin. Never itemised to a buyer. */
  surcharge: number;
  /** The single all-in number the buyer pays. */
  buyerPays: number;
  currency: string;
}

/**
 * A digital product. Unlike the restaurant's four independent visibility
 * switches, a sale has one linear status: it is approved and listed, or it is
 * not.
 */
/**
 * One purchase of a digital product, as the SELLER sees it.
 *
 * The sale module's answer to a ticket on the event page. `fileVersion` has no
 * event equivalent and is the point of the row: an entitlement pins the version
 * that was bought, so after a seller uploads a replacement their buyers are
 * split across versions and this is the only place that is visible.
 */
export interface SaleBuyer {
  entitlementId: string;
  orderId: string;
  /** Null only if the buyer's user row is gone (an anonymised account). */
  fullName: string | null;
  email: string | null;
  /** What the SELLER earned, snapshotted at purchase — not today's price. */
  price: number;
  usdPrice: number;
  /** The version this buyer holds, which may not be the current one. */
  fileVersion: number | null;
  fileName: string | null;
  downloadCount: number;
  lastDownloadedAt: string | null;
  /** Set only by an admin refund; there are no seller-facing refunds. */
  revokedAt: string | null;
  revokedReason: string | null;
  purchasedAt: string;
}

/** Totals over every buyer of a product, refunds excluded from the money. */
export interface SaleBuyersSummary {
  /** Copies sold, excluding admin-refunded purchases. */
  sold: number;
  revenue: number;
  usdRevenue: number;
  /** Every entitlement including refunds — what the buyers table is a window onto. */
  total: number;
}

export interface Sale {
  saleId: string;
  organisationId: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  activityTags: string[];
  /**
   * The listed price. What the SELLER receives is `pricing.sellerPrice`, which
   * equals this only while the buyer carries the surcharge — see `absorbFees`.
   */
  price: number;
  usdPrice: number;
  currencyCode: string;
  /**
   * Who pays the fees.
   *
   * False (the default) means they are added ON TOP of the price below: the
   * buyer pays price + fees and the organisation is credited the price whole.
   * True reverses it — the price below is exactly what the buyer pays, and the
   * fees come out of what the organisation receives.
   *
   * Every surface that quotes a price has to read it, which is why it sits on
   * the activity rather than anywhere cleverer.
   */
  absorbFees: boolean;
  status:
    | "draft"
    | "scanning"
    | "pending_review"
    | "live"
    | "rejected"
    | "unlisted";
  rejectionReason: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  /** Present on the list and detail endpoints; the current version first. */
  files?: SaleFile[];
  /**
   * The latest page of buyers, newest first — NOT every buyer. The seller's
   * detail endpoint sends ten; searching goes to `/sales/:org/:sale/buyers`.
   */
  buyers?: SaleBuyer[];
  /**
   * Totals over EVERY buyer, counted in the database.
   *
   * Separate from `buyers` because that is only a page: summing the rows on
   * screen would report the revenue of the last ten sales and call it the
   * revenue.
   */
  buyersSummary?: SaleBuyersSummary;
  pricing?: SalePricing;
  /** Preloaded by the admin review endpoints so the queue can name the seller. */
  organisation?: Organisation;
  createdAt: string;
  updatedAt: string;
}

/**
 * A digital product as the PUBLIC sees it.
 *
 * A separate type from `Sale` rather than a Partial of it, because the
 * difference is a security boundary and not a convenience: the review trail and
 * the `SaleFile` rows (which carry the private S3 key) never cross it. The API
 * builds this by projection for the same reason — see `serializePublic`.
 *
 * Only `live` products are ever served in this shape.
 */
export interface PublicSale {
  saleId: string;
  organisationId: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  activityTags: string[];
  /** What the seller set. Show `pricing.buyerPays` instead. */
  price: number;
  usdPrice: number;
  currencyCode: string;
  status: "live";
  publishedAt: string | null;
  createdAt: string;
  /** The single all-in number a buyer pays. The fee is never itemised. */
  pricing: SalePricing;
  /** Enough to judge the product; nothing that locates the object in S3. */
  file: {
    originalFilename: string;
    byteSize: number;
    mimeType: string;
  } | null;
  organisation: {
    organisationId: string;
    organisationName: string;
    profileImageUrl: string | null;
    isVerified: boolean;
    /**
     * A count, never the follower list: this payload is public and cached, so
     * who follows a seller does not belong in it. Whether the CURRENT viewer
     * follows them is asked for separately, per user.
     */
    followersCount: number;
  } | null;
}

export interface User {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  whatsappPhoneNumber: string | undefined;
  profileImageUrl: string | undefined;
  country: string;
  state: string;
  city: string;
  dateOfBirth: DateTime;
  verificationToken: string;
  tokenExpiresAt: DateTime;
  resendCount: number;
  lastResendAt: DateTime;
  referralCode: string;
  isVerified: boolean;
  /**
   * Set at login and kept current by the token refresh. A suspended attendee
   * keeps their session and their tickets but cannot transact — the interface
   * reads this to say so rather than letting them find out at checkout.
   */
  isSuspended: boolean;
  suspensionReason: string | null;
  mfaEnabled: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
  organisations: Organisation[];
  userPreference: UserPreference;
  isOnboarded: boolean;
  hasPassword: boolean;
  role: number;
  deletionCancelled?: boolean;
}

export interface Admin {
  adminId: string;
  email: string;
  password: string | null;
  role: number;
  isVerified: boolean;
  emailVerified: boolean;
  verificationToken: string | null;
  tokenExpiresAt: DateTime | null;
  resendCount: number;
  lastResendAt: DateTime | null;
  createdAt: DateTime;
}

export interface Currency {
  currencyId: string;
  currencyName: string;
  isoCode: string;
  exchangeRate: number;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface DiscountCode {
  discountCodeId: string;
  code: string;
  eventId: string;
  type: "fixed" | "percentage";
  value: number;
  expiresAt: Date;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface WithdrawalRequest {
  withdrawalRequestId: string;
  organisationId: string;
  accountType: string;
  bankName: string;
  currency: string;
  accountName: string;
  accountNumber: string;
  amount: number;
  usdAmount: number;
  /**
   * "APPROVED" is Wise-only: the recipient has been confirmed on the Ticketwaze
   * Wise account and somebody is expected to make the transfer by hand. Still
   * open work, and no money has moved yet.
   */
  status: "PENDING" | "APPROVED" | "SUCCESSFUL" | "FAILED";
  reason: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
  organisation: Organisation;

  /* Wise payouts. Null for `bank` and `moncash`, which settle by hand.
     The recipient lives on the request rather than the organisation so it is
     stated fresh each time and visible to the admin who approves it. */
  /** Only "wisetag" is written today; the column records which kind was used. */
  wiseRecipientType: "wisetag" | "email" | "phone" | null;
  wiseRecipientValue: string | null;
  /** The name Wise reported. Re-checked at approval before anything is sent. */
  wiseResolvedName: string | null;
  wiseContactId: string | null;
  /** When the recipient was confirmed and the payout became a person's job. */
  wiseApprovedAt: DateTime | null;
  /** When the transfer actually settled, which is not when it was approved. */
  processedAt: DateTime | null;
}

export interface OrganisationSubscription {
  organisationSubscriptionId: string;
  organisationId: string;
  subscriptionName: string;
  membershipTier: string;
  amountPaid: number;
  usdAmountPaid: number;
  status: "ACTIVE" | "CANCELED" | "EXPIRED";
  billingCycle: "monthly" | "yearly";
  isTrial: boolean;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: DateTime | null;
  endsAt: DateTime;
  paymentMethod: string;
  stripeSubscriptionId: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface MembershipTier {
  membershipTierId: string;
  membershipName: string;
  membershipDescription: string;
  teamMember: number;
  freeTickets: number;
  emailSupport: boolean;
  analytics: string;
  customTicketTypes: boolean;
  discountCodes: boolean;
  /** May this plan ask buyers questions at checkout? Pro and above. */
  checkoutForms: boolean;
  prioritySupport: boolean;
  aiFeatures: boolean;
  earlyAccess: boolean;
  verifiedBadge: boolean;
  customBranding: boolean;
  membershipPrice: number;
  membershipUsdPrice: number;
  apiAccess: boolean;
  dedicatedAccountManager: boolean;
  /** Upload ceiling for an online event's optional document, in MB. */
  eventDocumentMaxMb: number;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface UserOrdersRequest {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string | null;
    lastPageUrl: string | null;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
  data: Order[];
}
export interface OrganisationWithdrawalRequest {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string | null;
    lastPageUrl: string | null;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
  data: WithdrawalRequest[];
}

export interface OrganisationOrders {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string | null;
    lastPageUrl: string | null;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
  data: Order[];
}

export interface AdminEventsRequest {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string | null;
    lastPageUrl: string | null;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
  data: Event[];
}

export interface AdminUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string | null;
  whatsappPhoneNumber: string | null;
  profileImageUrl: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  dateOfBirth: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
  userAnalytic: UserAnalytic | null;
  tickets: Ticket[];
  /**
   * A pending account deletion, or null when none is in flight. Dates are
   * resolved server-side: `requestedAt` is when the attendee asked, and
   * `scheduledFor` is when the cron will actually anonymize them — the grace
   * period between the two is backend policy, never recomputed here.
   */
  deletion?: {
    requestedAt: string;
    scheduledFor: string;
    reason: string | null;
    daysLeft: number;
  } | null;
  /**
   * The suspension in force, or null when the account is in good standing.
   * `suspendedAt` and `suspendedByEmail` are null for accounts suspended before
   * those columns were added — the fact was recorded, its circumstances were
   * not.
   */
  suspension?: AccountSuspension | null;
}

/** Shared by suspended attendees and suspended organisations alike. */
export interface AccountSuspension {
  reason: string | null;
  suspendedAt: string | null;
  suspendedByEmail: string | null;
}

export interface AdminAttendeesRequest {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string | null;
    lastPageUrl: string | null;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
  data: AdminUser[];
}

export interface AdminAttendeeStats {
  total: number;
  active: number;
  guest: number;
}

export interface AdminOrganisation {
  organisationId: string;
  organisationName: string;
  organisationEmail: string;
  organisationWebsite: string | null;
  organisationPhoneNumber: string;
  organisationDescription: string;
  country: string;
  state: string;
  city: string;
  profileImageUrl: string | null;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  usdAvailableBalance: number;
  usdPendingBalance: number;
  isVerified: boolean;
  isPublished: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  /** Populated by the admin detail endpoint; see AccountSuspension. */
  suspension?: AccountSuspension | null;
  events: Event[];
  subscription: OrganisationSubscription | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrganisationsRequest {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string | null;
    lastPageUrl: string | null;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
  data: AdminOrganisation[];
}

export interface AdminOrganisationStats {
  total: number;
  active: number;
  new: number;
}

export interface UserWithdrawalRequest {
  userWithdrawalRequestId: string;
  userId: string;
  accountType: "bank" | "moncash";
  currency: "HTG" | "USD";
  bankName: string | null;
  accountName: string;
  accountNumber: string;
  amount: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  reason: string | null;
  reference: string | null;
  user?: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserWithdrawalRequestsPage {
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    firstPage: number;
    firstPageUrl: string | null;
    lastPageUrl: string | null;
    nextPageUrl: string | null;
    previousPageUrl: string | null;
  };
  data: UserWithdrawalRequest[];
}

/**
 * THE CHECKOUT FORM.
 *
 * An optional set of questions an organiser attaches to an in-person or online
 * activity AFTER creating it, from the activity page rather than the wizard.
 * Most activities have none, which is why the checkout step they drive is
 * conditional on the list being non-empty.
 */
export type EventFormQuestionType = "text" | "radio";

export interface EventFormQuestion {
  eventFormQuestionId: string;
  eventId: string;
  organisationId: string;
  label: string;
  questionType: EventFormQuestionType;
  /** The choices, for a radio question. Empty on a text one. */
  options: string[];
  /** Adds an "Other" choice with its own text box to a radio question. */
  allowOther: boolean;
  isRequired: boolean;
  /** Retired questions are no longer asked but keep the answers they drew. */
  isActive: boolean;
  position: number;
  /**
   * How many answers this question already holds. Present on the organiser's
   * list only, and what the UI keys the edit/delete lock off.
   */
  answerCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** The shape the public checkout reads — no ownership or audit fields. */
export interface PublicEventFormQuestion {
  eventFormQuestionId: string;
  label: string;
  questionType: EventFormQuestionType;
  options: string[];
  allowOther: boolean;
  isRequired: boolean;
  position: number;
}

export interface TicketFormAnswer {
  ticketFormAnswerId?: string;
  eventFormQuestionId: string;
  /** The question as it was asked, copied at answer time. */
  questionLabel: string;
  answer: string;
  /** True when this was typed into "Other" rather than chosen from the list. */
  isOther: boolean;
}

/** One ticket holder's answers, as the organiser's responses screen reads them. */
export interface EventFormResponse {
  ticketId: string;
  ticketName: string;
  ticketType: string;
  fullName: string;
  email: string;
  answeredAt: string;
  answers: TicketFormAnswer[];
}
