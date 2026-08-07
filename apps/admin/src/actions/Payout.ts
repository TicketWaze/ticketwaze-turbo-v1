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
 * Approve a Wise payout — the action that actually sends the money.
 *
 * Separate from `MarkPaidAction`, which only records that a human already
 * transferred it. The API answers 202: the transfer is handed to a background
 * job, so a success here means "accepted", not "the organiser has been paid".
 * `willFundAutomatically` says which of those the admin should be told.
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
        willFundAutomatically: Boolean(data.willFundAutomatically),
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
