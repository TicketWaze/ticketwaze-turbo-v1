"use server";

import { revalidatePath } from "next/cache";

export async function UpdateEventStatusAction(
  eventId: string,
  adminStatus: string,
  accessToken: string,
  locale: string,
  rejectionReason?: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/event/${eventId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify({
          status: adminStatus,
          ...(adminStatus === "rejected" && rejectionReason
            ? { rejectionReason }
            : {}),
        }),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath(`/activities/${eventId}`);
      return { status: "success" };
    } else {
      throw new Error(data.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * Rule on an edit held back from a selling event. Approving replays it onto the
 * live event; rejecting leaves the event exactly as buyers last saw it.
 */
export async function ReviewEventRevisionAction(
  revisionId: string,
  decision: "approve" | "reject",
  accessToken: string,
  locale: string,
  rejectionReason?: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/event-revision/${revisionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify({
          decision,
          ...(decision === "reject" && rejectionReason
            ? { rejectionReason }
            : {}),
        }),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath("/activities/revisions");
      // The edit itself applied; only the Google Calendar push failed. Worth
      // telling the admin so the invitees can be resynced, but not an error.
      return {
        status: "success",
        calendarSyncFailed: data.calendarSyncFailed === true,
      };
    } else {
      throw new Error(data.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/** Rule on an edit held back from a draw that is already selling entries. */
export async function ReviewRaffleRevisionAction(
  revisionId: string,
  decision: "approve" | "reject",
  accessToken: string,
  locale: string,
  rejectionReason?: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/raffle-revision/${revisionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify({
          decision,
          ...(decision === "reject" && rejectionReason
            ? { rejectionReason }
            : {}),
        }),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath("/activities/revisions");
      return { status: "success" };
    } else {
      throw new Error(data.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function UpdateRaffleStatusAction(
  raffleId: string,
  adminStatus: string,
  accessToken: string,
  locale: string,
  rejectionReason?: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/raffle/${raffleId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify({
          status: adminStatus,
          ...(adminStatus === "rejected" && rejectionReason
            ? { rejectionReason }
            : {}),
        }),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath(`/activities/raffle/${raffleId}`);
      return { status: "success" };
    } else {
      throw new Error(data.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function ResendTicketAction(
  ticketId: string,
  accessToken: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/ticket/${ticketId}/resend`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      return { status: "success" };
    } else {
      throw new Error(data.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function UpdateRestaurantStatusAction(
  restaurantId: string,
  adminStatus: string,
  accessToken: string,
  locale: string,
  rejectionReason?: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/restaurant/${restaurantId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify({
          status: adminStatus,
          ...(adminStatus === "rejected" && rejectionReason
            ? { rejectionReason }
            : {}),
        }),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath(`/activities/restaurant/${restaurantId}`);
      return { status: "success" };
    } else {
      throw new Error(data.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * Suspension is a separate axis from adminStatus: it pulls an approved venue off
 * the platform without erasing the fact that it was approved, and the
 * organisation cannot lift it.
 */
export async function UpdateRestaurantSuspensionAction(
  restaurantId: string,
  suspended: boolean,
  accessToken: string,
  locale: string,
  suspensionReason?: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/restaurant/${restaurantId}/suspension`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify({
          suspended,
          ...(suspended && suspensionReason ? { suspensionReason } : {}),
        }),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath(`/activities/restaurant/${restaurantId}`);
      return { status: "success" };
    } else {
      throw new Error(data.message);
    }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * Refund every buyer of an upcoming activity and cancel it.
 *
 * Irreversible from the dashboard, so the API is the sole judge of whether it
 * is allowed — the dialog's own guards only save a round trip. A refusal
 * (already cancelled, already started, balance already released) comes back as
 * a 422 with a message worth showing, so it is surfaced rather than replaced
 * with a generic failure.
 */
export async function RefundActivityAction(
  activityKind: "event" | "raffle",
  activityId: string,
  reason: string,
  accessToken: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/${activityKind}/${activityId}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify({ reason }),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath(
        activityKind === "raffle"
          ? `/activities/raffle/${activityId}`
          : `/activities/${activityId}`,
      );
      return {
        status: "success" as const,
        ticketsRefunded: data.ticketsRefunded as number,
        walletsCredited: data.walletsCredited as number,
        guestTicketsVoided: data.guestTicketsVoided as number,
      };
    }
    throw new Error(data.message);
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/** One account an admin can hand a ticket to. */
export interface GiveawayRecipient {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** They already hold a ticket for this event. Shown, never used to exclude. */
  holdsTicket: boolean;
}

/**
 * Accounts matching a name or email, for the giveaway picker.
 *
 * Returns a bare list rather than the usual `{status}` envelope: it is called on
 * every keystroke (debounced) and a failed lookup should leave the list empty
 * rather than raise a toast at someone who is still typing.
 */
export async function SearchGiveawayRecipientsAction(
  eventId: string,
  query: string,
  accessToken: string,
  locale: string,
): Promise<GiveawayRecipient[]> {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/event/${eventId}/giveaway/recipients?q=${encodeURIComponent(
        query,
      )}`,
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
    return data.status === "success" ? (data.users as GiveawayRecipient[]) : [];
  } catch {
    return [];
  }
}

/**
 * Give free tickets of one tier to a set of accounts.
 *
 * Ticketwaze pays for these: the organisation is credited the tier's face value
 * in both currencies. The API is the sole judge of whether it is allowed —
 * inventory, event state and each recipient's eligibility are all decided there
 * — and a refusal comes back as a 422 with a message worth showing, so it is
 * surfaced rather than replaced with a generic failure.
 */
export async function GiveawayTicketsAction(
  eventId: string,
  ticketTypeId: string,
  userIds: string[],
  note: string,
  accessToken: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/event/${eventId}/giveaway`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify({
          ticketTypeId,
          userIds,
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath(`/activities/${eventId}`);
      return {
        status: "success" as const,
        ticketsIssued: data.ticketsIssued as number,
        ticketTypeName: data.ticketTypeName as string,
        creditedHtg: data.creditedHtg as number,
        creditedUsd: data.creditedUsd as number,
      };
    }
    throw new Error(data.message);
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
