"use server";

import { revalidatePath } from "next/cache";
import type {
  FeeOverride,
  FeeRoute,
  RouteFeeComponents,
} from "@ticketwaze/typescript-config";

export type FeeActivityKind = "event" | "raffle" | "sale" | "restaurant";

/** One route's quote for one unit, in the activity's own currency. */
export interface RouteQuote {
  fees: number;
  total: number;
}

/** Everything the fees handler shows about an activity. */
export interface ActivityFees {
  activity: {
    kind: FeeActivityKind;
    id: string;
    name: string;
    currency: "HTG" | "USD";
    absorbFees: boolean;
  };
  exchangeRate: number;
  feeOverride: FeeOverride | null;
  units: {
    label: string;
    price: number;
    /** What buyers pay today, override included. */
    current: Record<FeeRoute, RouteQuote>;
    /** What they would pay on the activity kind's ordinary schedule. */
    standard: Record<FeeRoute, RouteQuote>;
  }[];
  /** Components that reproduce today's schedule, to open "custom" on. */
  suggested: Record<FeeRoute, RouteFeeComponents>;
}

/** Where each kind's admin page lives, so the right one is revalidated. */
function detailPath(kind: FeeActivityKind, id: string) {
  return kind === "event" ? `/activities/${id}` : `/activities/${kind}/${id}`;
}

/**
 * Reads an activity's fee pricing for the fees handler.
 *
 * The quotes come from the API's own charge functions, so the table the admin
 * sees is what buyers are actually charged, not a re-derivation of it.
 */
export async function GetActivityFeesAction(
  kind: FeeActivityKind,
  activityId: string,
  accessToken: string,
  locale: string,
): Promise<{ status: "success"; data: ActivityFees } | { error: string }> {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/fees/${kind}/${activityId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        cache: "no-store",
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      return { status: "success", data: data as ActivityFees };
    }
    throw new Error(data.message);
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * Cancels, customises or restores an activity's fees.
 *
 * `standard` removes the override. Rates are sent as fractions (0.03), which
 * the dialog converts from the percentages it displays. The API refuses an
 * activity whose organiser absorbs the fees, and that refusal is surfaced.
 */
export async function UpdateActivityFeesAction(
  kind: FeeActivityKind,
  activityId: string,
  body: {
    mode: "standard" | "cancelled" | "custom";
    sameForAllProviders?: boolean;
    routes?: Record<FeeRoute, RouteFeeComponents>;
  },
  accessToken: string,
  locale: string,
): Promise<{ status: "success" } | { error: string }> {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/fees/${kind}/${activityId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath(detailPath(kind, activityId));
      return { status: "success" };
    }
    throw new Error(data.message);
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
