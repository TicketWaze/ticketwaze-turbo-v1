"use server";
import { revalidatePath } from "next/cache";

export async function AcceptUserWithdrawalAction(
  accessToken: string,
  locale: string,
  requestId: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/user-withdrawals/request/${requestId}/accept`,
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
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath(`/user-withdrawals/${requestId}`);
      return { status: "success" };
    }
    throw new Error(data.message);
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

export async function RejectUserWithdrawalAction(
  accessToken: string,
  locale: string,
  requestId: string,
  reason: string,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/user-withdrawals/request/${requestId}/reject`,
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
    const data = await res.json();
    if (data.status === "success") {
      revalidatePath(`/user-withdrawals/${requestId}`);
      return { status: "success" };
    }
    throw new Error(data.message);
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

