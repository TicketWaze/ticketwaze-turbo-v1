/**
 * GOOGLE MEET PLAN LIMITS, AS THE DASHBOARD PRESENTS THEM.
 *
 * A mirror of `app/services/google_meet.ts` on the API, which is the authority.
 * Duplicated rather than fetched because these figures are what the plan
 * DROPDOWN shows next to each option — the organiser needs to see "100 people,
 * 60 minutes" while choosing, before anything has been declared and so before
 * the API has anything to report back.
 *
 * Google publishes no capacity or edition API we can reach, so the plan is
 * declared by the organiser and these numbers are what that declaration means.
 * If Google changes them, both copies move together.
 */

export const GOOGLE_PLANS = [
  "free",
  "business_starter",
  "business_standard",
  "business_plus",
  "enterprise",
] as const;

export type GooglePlan = (typeof GOOGLE_PLANS)[number];

export interface GoogleMeetLimits {
  /** People in the call, INCLUDING the host. See `sellableSeats`. */
  participants: number;
  /** How long a call with three or more people may run. */
  maxMeetingMinutes: number;
}

const WORKSPACE_MEETING_MINUTES = 24 * 60;

/**
 * The free tier's 60 minutes, which is the limit this whole feature exists for.
 * Google allows a 1:1 call 24 hours even on a free account and cuts a call with
 * three or more people at an hour. A ticketed event is never 1:1.
 */
const FREE_GROUP_MEETING_MINUTES = 60;

export const GOOGLE_PLAN_LIMITS: Record<GooglePlan, GoogleMeetLimits> = {
  free: { participants: 100, maxMeetingMinutes: FREE_GROUP_MEETING_MINUTES },
  business_starter: {
    participants: 100,
    maxMeetingMinutes: WORKSPACE_MEETING_MINUTES,
  },
  business_standard: {
    participants: 150,
    maxMeetingMinutes: WORKSPACE_MEETING_MINUTES,
  },
  business_plus: {
    participants: 500,
    maxMeetingMinutes: WORKSPACE_MEETING_MINUTES,
  },
  enterprise: {
    participants: 1000,
    maxMeetingMinutes: WORKSPACE_MEETING_MINUTES,
  },
};

/**
 * The organiser's own place in the call, which is not for sale. Only the host
 * is reserved — the Ticketwaze address on the invite never joins.
 */
export const GOOGLE_RESERVED_SEATS = 1;

export function sellableSeats(plan: GooglePlan): number {
  return Math.max(0, GOOGLE_PLAN_LIMITS[plan].participants - GOOGLE_RESERVED_SEATS);
}

export function isGooglePlan(value: unknown): value is GooglePlan {
  return (
    typeof value === "string" &&
    (GOOGLE_PLANS as readonly string[]).includes(value)
  );
}
