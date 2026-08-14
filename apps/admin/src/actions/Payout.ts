"use server";

import { revalidatePath } from "next/cache";

export async function MarkPaidAction(
  accessToken: string,
  locale: string,
  withdrawalRequestId: string,
  adminNote?: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/payouts/request/${withdrawalRequestId}/paid`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify(
          adminNote?.trim() ? { adminNote: adminNote.trim() } : {},
        ),
      },
    );
    const data = await request.json();
    if (data.status === "sucess") {
      revalidatePath(`/payouts/${withdrawalRequestId}`);
      return {
        status: "sucess",
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

/**
 * Approve a Wise payout — step one of two, and it moves no money.
 *
 * The API re-resolves the Wisetag, checks the account is still held by the
 * person the organiser named, and adds that recipient to the Ticketwaze Wise
 * account. Somebody then makes the transfer by hand and comes back to
 * `ConfirmWiseSentAction`.
 *
 * The resolved name comes back so the screen can repeat it: it is the name to
 * pick from the list in Wise, and the last chance to notice it is wrong.
 */
export async function ApproveWisePayoutAction(
  accessToken: string,
  locale: string,
  withdrawalRequestId: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/payouts/request/${withdrawalRequestId}/approve`,
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
      revalidatePath(`/payouts/${withdrawalRequestId}`);
      return {
        status: "success",
        recipientName: (data.recipient?.name ?? "") as string,
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

/**
 * Record that an approved Wise payout was actually sent — step two.
 *
 * THIS is what debits the organisation's balance and tells them they have been
 * paid, so it is only ever clicked by someone who has made the transfer in Wise
 * and can see it there. Separate from `MarkPaidAction` because the API refuses
 * it unless the recipient was approved first.
 */
export async function ConfirmWiseSentAction(
  accessToken: string,
  locale: string,
  withdrawalRequestId: string,
  adminNote?: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/payouts/request/${withdrawalRequestId}/wise/sent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
        body: JSON.stringify(
          adminNote?.trim() ? { adminNote: adminNote.trim() } : {},
        ),
      },
    );
    const data = await request.json();
    if (data.status === "success") {
      revalidatePath(`/payouts/${withdrawalRequestId}`);
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

export async function MarkFailedAction(
  body: { reason: string; adminNote?: string },
  accessToken: string,
  locale: string,
  withdrawalRequestId: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/payouts/request/${withdrawalRequestId}/failed`,
      {
        method: "POST",
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
    if (data.status === "sucess") {
      revalidatePath(`/payouts/${withdrawalRequestId}`);
      return {
        status: "sucess",
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
