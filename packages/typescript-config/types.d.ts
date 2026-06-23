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
  adminStatus: "review" | "approved" | "rejected" | "requested";
  isActive: boolean;
  isFree: boolean;
  currency: string;
  activityTags: string[];
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
  accountType: 'bank' | 'moncash';
  currency: 'HTG' | 'USD';
  bankName: string | null;
  accountName: string;
  accountNumber: string;
  amount: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
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
