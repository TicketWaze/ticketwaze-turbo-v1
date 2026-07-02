"use server";

import { revalidatePath } from "next/cache";

export async function MarkPaidAction(
  accessToken: string,
  locale: string,
  withdrawalRequestId: string,
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

export async function MarkFailedAction(
  body: unknown,
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
