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
