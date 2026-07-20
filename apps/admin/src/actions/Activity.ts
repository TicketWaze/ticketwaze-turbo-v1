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
