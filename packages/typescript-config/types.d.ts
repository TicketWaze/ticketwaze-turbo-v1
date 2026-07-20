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
  userId: string;
  fullName: string;
  email: string;
  ticketPrice: number;
  ticketUsdPrice: number;
  organisationId: string;
  isRefundable: boolean;
  status: "PENDING" | "CHECKED" | "RETURNED";
  event: Event;
  order?: Order;
  // Attendance (check-in/out) summary — present on the event records payload.
  checkIns?: TicketCheckIn[];
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
  googleAccessToken: string;
  googleRefreshToken: string;
  events: Event[];
  followers: User[];
  followersCount?: number;
  membershipTier: MembershipTier;
  createdAt: DateTime;
  updatedAt: DateTime;
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
  isActive: boolean;
  isFree: boolean;
  isPrivate: boolean;
  currency: string;
  activityTags: string[];
  ticketSalesEndAt: string | null;
  eventDays: EventDay[];
  eventTicketTypes: EventTicketType[];
  eventTagId: string;
  googleMeetLink: string;
  googleCalendarEventId: string;
  discountCodes: DiscountCode[];
  eventPerformers: EventPerformer[];
  eventAttendees: EventAttendee[];
  tickets: Ticket[];
  orders: Order[];
  organisation: Organisation;
  createdAt: string;
  updatedAt: string;
  deletionStatus: "pending_deletion" | "deleted" | null;
  deletionReason: string | null;
  deletionRequestedAt: string | null;
  scheduledDeletionAt: string | null;
  ticketReturns: TicketReturn[];
}

export interface RafflePrize {
  rafflePrizeId: string;
  raffleId: string;
  rank: number;
  title: string;
  description: string | null;
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
  totalTicketsLimit: number | null;
  activityTags: string[];
  location: { lat: number; lng: number } | null;
  salesStartAt: string;
  salesEndAt: string;
  drawAt: string;
  timezone: string | null;
  drawMode: "automatic" | "manual";
  adminStatus: "review" | "approved" | "rejected" | "requested";
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
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  reason: string | null;
  createdAt: DateTime;
  updatedAt: DateTime;
  organisation: Organisation;
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
  prioritySupport: boolean;
  aiFeatures: boolean;
  earlyAccess: boolean;
  verifiedBadge: boolean;
  customBranding: boolean;
  membershipPrice: number;
  membershipUsdPrice: number;
  apiAccess: boolean;
  dedicatedAccountManager: boolean;
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
