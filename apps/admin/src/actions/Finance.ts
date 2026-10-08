"use server";

import type {
  FinanceActivityDetail,
  FinancePeriod,
} from "@/app/[locale]/finance/types";

// One activity's finances, fetched when its drawer opens on the finance page.
export async function FetchFinanceActivity(
  accessToken: string,
  activityId: string,
  period: FinancePeriod,
) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/finance/activity/${activityId}?period=${period}`,
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
    if (data.status === "success" && data.finance) {
      return {
        status: "success" as const,
        finance: data.finance as FinanceActivityDetail,
      };
    }
    return {
      status: "failed" as const,
      message: data.message ?? "An unknown error occurred",
    };
  } catch (error: unknown) {
    return {
      status: "failed" as const,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
