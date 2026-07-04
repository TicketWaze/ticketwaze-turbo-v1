"use server";
import { revalidatePath } from "next/cache";
import { UserWithdrawalRequest } from "@ticketwaze/typescript-config";

// Lazy-loaded data for the Users tab on the merged payouts page: the 5 latest
// requests for the given scope ("requests" = pending, "history" = processed),
// fetched only when the tab is first opened.
export async function FetchLatestUserWithdrawals(
  accessToken: string,
  scope: "requests" | "history",
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/user-withdrawals/requests?scope=${scope}&order=desc&limit=5&page=1`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
      },
    );
    const data = await res.json();
    if (data.status === "success" && data.requests) {
      return {
        status: "success" as const,
        requests: (data.requests.data ?? []) as UserWithdrawalRequest[],
        total: (data.requests.meta?.total ?? 0) as number,
      };
    }
    return {
      status: "failed" as const,
      message: data.message ?? "An unknown error occurred",
    };
  } catch (error: unknown) {
    return {
      status: "failed" as const,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

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

