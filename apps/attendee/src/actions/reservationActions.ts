"use server";
import { revalidatePath } from "next/cache";

/**
 * Table reservations.
 *
 * The flow is two steps by design: HOLD the seat, then pay for it. The hold is
 * what stops someone else taking the table while a payment is in flight, and it
 * lapses on its own if the guest walks away from the checkout.
 *
 * Every call here works signed in or as a guest — the API reads the auth header
 * when it is there and treats its absence as a guest booking.
 */
function headers(locale: string, accessToken?: string) {
  return {
    "Content-Type": "application/json",
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export interface Slot {
  startsAt: string;
  label: string;
  coversBooked: number;
  coversRemaining: number;
  isAvailable: boolean;
}

/** Bookable times for one local date. Public — no account needed to look. */
export async function GetAvailability(
  slug: string,
  date: string,
  partySize: number,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/explore/restaurants/${slug}/availability?date=${date}&partySize=${partySize}`,
      { method: "GET", headers: headers(locale), cache: "no-store" },
    );
    const data = await res.json();
    if (data.status === "success") {
      return {
        status: "success" as const,
        slots: (data.slots ?? []) as Slot[],
        fee: Number(data.fee ?? 0),
        // Both currencies: each provider charges in its own, and converting on
        // the client would drift from what the server actually charges.
        htgFee: Number(data.htgFee ?? 0),
        usdFee: Number(data.usdFee ?? 0),
        currency: String(data.currency ?? "HTG"),
        holdMinutes: Number(data.holdMinutes ?? 15),
        acceptsReservations: Boolean(data.acceptsReservations),
      };
    }
    return { status: "failed" as const, message: data.message };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

/**
 * Hold the seat. Returns the reservation to pay for — it is NOT a booking yet
 * and will lapse unless the payment completes.
 */
export async function HoldReservation(
  slug: string,
  payload: {
    reservedFor: string;
    partySize: number;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    note?: string;
  },
  locale: string,
  accessToken?: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/explore/restaurants/${slug}/reservations`,
      {
        method: "POST",
        headers: headers(locale, accessToken),
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success" as const, reservation: data.reservation };
    }
    return { status: "failed" as const, message: data.message };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function PayReservationWallet(
  reservationId: string,
  accessToken: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/reservations/${reservationId}/pay/wallet`,
      { method: "POST", headers: headers(locale, accessToken) },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/upcoming");
      return { status: "success" as const };
    }
    return { status: "failed" as const, message: data.message };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function StartReservationStripe(
  reservationId: string,
  locale: string,
  accessToken?: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/reservations/${reservationId}/pay/stripe`,
      { method: "POST", headers: headers(locale, accessToken) },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success" as const, clientSecret: data.clientSecret };
    }
    return { status: "failed" as const, message: data.message };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

export async function StartReservationMoncash(
  reservationId: string,
  locale: string,
  accessToken?: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/reservations/${reservationId}/pay/moncash`,
      { method: "POST", headers: headers(locale, accessToken) },
    );
    const data = await res.json();
    if (data.status === "success") {
      return { status: "success" as const, paymentURL: data.paymentURL };
    }
    return { status: "failed" as const, message: data.message };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

/** Called from the Stripe return page. Idempotent server-side on the session id. */
export async function FinishReservationStripe(
  sessionId: string,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/reservations/stripe/finish/${sessionId}`,
      { method: "POST", headers: headers(locale) },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/upcoming");
      return { status: "success" as const, reservation: data.reservation };
    }
    return { status: "failed" as const, message: data.message };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}

/**
 * The guest cancels. The booking fee is NOT refunded — that forfeit is what
 * makes the reservation worth honouring — so the UI must say so before calling.
 */
export async function CancelReservation(
  reservationId: string,
  accessToken: string,
  locale: string,
  reason?: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/reservations/${reservationId}/cancel`,
      {
        method: "POST",
        headers: headers(locale, accessToken),
        body: JSON.stringify({ reason }),
      },
    );
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath("/upcoming");
      return { status: "success" as const };
    }
    return { status: "failed" as const, message: data.message };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}
