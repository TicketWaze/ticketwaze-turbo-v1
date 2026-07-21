"use server";

import { revalidatePath } from "next/cache";

export async function ReturnFreeTicketAction(
  accessToken: string,
  locale: string,
  ticketId: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payments/return/free/${ticketId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath("upcoming");
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function ReturnPaidTicketAction(
  accessToken: string,
  locale: string,
  tickets: string[],
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payments/return/paid`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ tickets }),
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath("upcoming");
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

// Upserts the user's rating and/or written feedback for a past activity.
export async function SubmitReviewAction(
  accessToken: string,
  eventId: string,
  body: { rating?: number; reviewText?: string },
  pathname: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success" as const,
        review: data.review as { rating: number; reviewText: string },
      };
    }
    return {
      status: "failed" as const,
      message: data.message ?? "An unknown error occurred",
    };
  } catch (err: unknown) {
    return {
      status: "failed" as const,
      message: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function AddEventToFavorite(
  accessToken: string,
  eventId: string,
  organisationId: string,
  pathname: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/favorites/${organisationId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function RemoveEventToFavorite(
  accessToken: string,
  eventId: string,
  pathname: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/favorites`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function AddReportEvent(
  accessToken: string,
  eventId: string,
  pathname: string,
  body: unknown,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/report`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function AddReportOrganisation(
  accessToken: string,
  organisationId: string,
  pathname: string,
  body: unknown,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/report`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      return {
        status: "failed",
        message: data.message,
      };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

/**
 * Reserve a place on a coming-soon activity.
 *
 * There is no guest variant on purpose: the API route sits behind auth, so a
 * signed-out caller is rejected server-side rather than merely hidden in the UI.
 */
export async function ReservePlaceAction(
  accessToken: string,
  eventId: string,
  pathname: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/reservations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath(pathname);
      return { status: "success", reservationCount: data.reservationCount };
    }
    return { error: data.message ?? "Something went wrong" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

/** Give up a reserved place. */
export async function CancelReservationAction(
  accessToken: string,
  eventId: string,
  pathname: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/reservations`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath(pathname);
      return { status: "success", reservationCount: data.reservationCount };
    }
    return { error: data.message ?? "Something went wrong" };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}
