"use server";

export async function FreeEventTicket(
  accessToken: string,
  eventId: string,
  body: unknown,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/payments/free`,
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

export async function StartRaffleStripe(
  accessToken: string,
  raffleId: string,
  quantity: number,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${raffleId}/entries/stripe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity }),
      },
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

type Guest = { firstName: string; lastName: string; email: string };

export async function StartRaffleGuestStripe(
  raffleId: string,
  quantity: number,
  guest: Guest,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/guest/raffles/${raffleId}/entries/stripe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity, guest }),
      },
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

export async function StartRaffleGuestMoncash(
  raffleId: string,
  quantity: number,
  guest: Guest,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/guest/raffles/${raffleId}/entries/moncash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity, guest }),
      },
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

export async function StartRaffleMoncash(
  accessToken: string,
  raffleId: string,
  quantity: number,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${raffleId}/entries/moncash`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity }),
      },
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

export async function BuyRaffleEntriesWallet(
  accessToken: string,
  raffleId: string,
  quantity: number,
  locale: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${raffleId}/entries/wallet`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
        },
        body: JSON.stringify({ quantity }),
      },
    );
    const data = await res.json();

    if (data.status === "success") {
      return { status: "success" as const };
    } else {
      return { status: "failed" as const, message: data.message };
    }
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "An unknown error occurred",
    };
  }
}
