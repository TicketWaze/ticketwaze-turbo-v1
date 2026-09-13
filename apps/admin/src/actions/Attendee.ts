"use server";

import { revalidatePath } from "next/cache";

export async function ReactivateAttendeeAction(
  userId: string,
  accessToken: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/attendees/${userId}/reactivate`,
      {
        method: "PATCH",
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
      revalidatePath(`/attendees/${userId}`);
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

export async function SuspendAttendeeAction(
  userId: string,
  reason: string,
  accessToken: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/attendees/${userId}/suspend`,
      {
        method: "PATCH",
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
      revalidatePath(`/attendees/${userId}`);
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
 * Put money and/or Ticketwaze tokens into a user's wallet by hand.
 *
 * `currency` says which of the two money fields the admin actually TYPED IN.
 * The dialog shows HTG and USD kept in step, but only one is an input and the
 * other is a conversion — sending both would ask the server to trust a figure
 * the browser derived, and a stale rate or a rounding difference would credit
 * two columns that describe different money. The server converts from this
 * one at the live rate instead.
 */
export async function CreditAttendeeWalletAction(
  userId: string,
  payload: {
    amount?: number;
    currency?: "HTG" | "USD";
    tokens?: number;
    reason: string;
  },
  accessToken: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/attendees/${userId}/credit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify(payload),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath(`/attendees/${userId}`);
      return { status: "success" as const, credited: data.credited };
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
 * The live HTG-per-USD rate, for keeping the two money fields in step.
 *
 * Read from the public currencies endpoint rather than hardcoded: the dialog
 * quotes a conversion the server is about to redo, and the two disagreeing by
 * a stale constant is exactly the confusion this avoids. Returns 0 when the
 * rate cannot be read, which the dialog treats as "no conversion available"
 * rather than guessing.
 */
export async function GetHtgExchangeRate(): Promise<number> {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/currencies`,
      { headers: { "Content-Type": "application/json" } },
    );
    const data = await request.json();
    const htg = (data?.currencies ?? []).find(
      (currency: { isoCode: string }) => currency.isoCode === "HTG",
    );
    return Number(htg?.exchangeRate) || 0;
  } catch {
    return 0;
  }
}
