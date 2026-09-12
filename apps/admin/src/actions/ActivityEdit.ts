"use server";
import { revalidatePath } from "next/cache";

export type UpdateEventResult =
  | {
      status: "success";
      /** Which watched fields moved — drives what the success toast says. */
      changedFields: string[];
      /** Buyers were given a way out because a material field changed. */
      refundWindowOpened: boolean;
      /** The edit saved, but the online meeting/calendar entry did not resync. */
      calendarSyncFailed: boolean;
      /** Organiser edits that this one overtook and retired. */
      supersededRevisions: number;
    }
  | { error: string; fieldErrors?: Record<string, string> };

/**
 * Sends an admin's rewrite of an event.
 *
 * Multipart rather than JSON because the poster is a file. The API accepts both
 * shapes for the object fields, so they are stringified here and parsed back
 * there — the same convention the organiser's own edit form uses.
 */
export async function UpdateEventAsAdminAction({
  eventId,
  formData,
  accessToken,
  locale,
}: {
  eventId: string;
  formData: FormData;
  accessToken: string;
  locale: string;
}): Promise<UpdateEventResult> {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/event/${eventId}`,
    {
      method: "PUT",
      headers: {
        // No Content-Type: fetch sets the multipart boundary itself, and
        // naming it by hand produces a body the server cannot split.
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": locale,
      },
      body: formData,
    },
  );

  const response = await request.json();

  if (response.status === "success") {
    revalidatePath("/[locale]/activities/[id]", "page");
    revalidatePath("/[locale]/activities", "page");
    return {
      status: "success",
      changedFields: response.changedFields ?? [],
      refundWindowOpened: Boolean(response.refundWindowOpened),
      calendarSyncFailed: Boolean(response.calendarSyncFailed),
      supersededRevisions: Number(response.supersededRevisions ?? 0),
    };
  }

  /**
   * VineJS reports one entry per offending field. Flattened to field → first
   * message so the form can put each one under its own input; the generic
   * message stays as the fallback for failures that name no field at all.
   */
  const fieldErrors: Record<string, string> = {};
  if (Array.isArray(response.errors)) {
    for (const issue of response.errors) {
      if (issue?.field && !fieldErrors[issue.field]) {
        fieldErrors[issue.field] = issue.message ?? "Invalid value";
      }
    }
  }

  return {
    error: response.message ?? "Failed to update this activity",
    fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
  };
}

/**
 * Raffle, venue and product edits.
 *
 * One shape, because the three differ only in the path they PUT to and the
 * cache paths to revalidate. The API answers all four activity kinds with the
 * same envelope (changedFields / refundWindowOpened / calendarSyncFailed /
 * supersededRevisions) precisely so the dashboard needs one result type.
 */
async function putActivity({
  path,
  detailRoute,
  formData,
  accessToken,
  locale,
}: {
  path: string;
  detailRoute: string;
  formData: FormData;
  accessToken: string;
  locale: string;
}): Promise<UpdateEventResult> {
  const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": locale,
    },
    body: formData,
  });

  const response = await request.json();

  if (response.status === "success") {
    revalidatePath(detailRoute, "page");
    revalidatePath("/[locale]/activities", "page");
    return {
      status: "success",
      changedFields: response.changedFields ?? [],
      refundWindowOpened: Boolean(response.refundWindowOpened),
      calendarSyncFailed: Boolean(response.calendarSyncFailed),
      supersededRevisions: Number(response.supersededRevisions ?? 0),
    };
  }

  const fieldErrors: Record<string, string> = {};
  if (Array.isArray(response.errors)) {
    for (const issue of response.errors) {
      if (issue?.field && !fieldErrors[issue.field]) {
        fieldErrors[issue.field] = issue.message ?? "Invalid value";
      }
    }
  }

  return {
    error: response.message ?? "Failed to update this activity",
    fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
  };
}

export async function UpdateRaffleAsAdminAction(args: {
  raffleId: string;
  formData: FormData;
  accessToken: string;
  locale: string;
}): Promise<UpdateEventResult> {
  return putActivity({
    path: `/admin/raffle/${args.raffleId}`,
    detailRoute: "/[locale]/activities/raffle/[id]",
    ...args,
  });
}

export async function UpdateRestaurantAsAdminAction(args: {
  restaurantId: string;
  formData: FormData;
  accessToken: string;
  locale: string;
}): Promise<UpdateEventResult> {
  return putActivity({
    path: `/admin/restaurant/${args.restaurantId}`,
    detailRoute: "/[locale]/activities/restaurant/[id]",
    ...args,
  });
}

export async function UpdateSaleAsAdminAction(args: {
  saleId: string;
  formData: FormData;
  accessToken: string;
  locale: string;
}): Promise<UpdateEventResult> {
  return putActivity({
    path: `/admin/sale/${args.saleId}`,
    detailRoute: "/[locale]/activities/sale/[id]",
    ...args,
  });
}
