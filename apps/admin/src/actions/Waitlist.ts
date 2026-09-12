"use server";
import { revalidatePath } from "next/cache";

export async function InviteUsersAction({
  userIds,
  accessToken,
  locale,
}: {
  userIds: string[];
  accessToken: string;
  locale: string;
}) {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/waitlist/invite`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": locale,
      },
      body: JSON.stringify({ waitlistUserIds: userIds }),
    },
  );
  const response = await request.json();
  if (response.status === "success") {
    // Route is /[locale]/waitlist — revalidate the dynamic page for every locale.
    revalidatePath("/[locale]/waitlist", "page");
    return { status: "success" as const };
  }
  return { error: response.message ?? "Failed to invite users" };
}

/**
 * Nudges waitlist members who never finished creating an account.
 *
 * Returns the counts rather than a bare success flag: the API drops anyone who
 * has signed up or unsubscribed since the page was rendered, so "40 selected"
 * and "40 sent" routinely differ, and the toast has to be able to say so.
 */
export type RemindUsersResult =
  | { status: "success"; sent: number; failed: number; skipped: number }
  | { error: string };

export async function RemindUsersAction({
  userIds,
  accessToken,
  locale,
}: {
  userIds: string[];
  accessToken: string;
  locale: string;
}): Promise<RemindUsersResult> {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/waitlist/remind`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": locale,
      },
      body: JSON.stringify({ waitlistUserIds: userIds }),
    },
  );
  const response = await request.json();
  if (response.status === "success") {
    // Route is /[locale]/waitlist — revalidate the dynamic page for every locale.
    revalidatePath("/[locale]/waitlist", "page");
    return {
      status: "success" as const,
      sent: Number(response.successCount ?? 0),
      failed: Number(response.failedCount ?? 0),
      skipped:
        Number(response.skippedHasAccount ?? 0) +
        Number(response.skippedOptedOut ?? 0),
    };
  }
  return { error: response.message ?? "Failed to send the reminder" };
}

export async function InviteAllUsersAction({
  accessToken,
  locale,
}: {
  accessToken: string;
  locale: string;
}) {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/waitlist/invite-all`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": locale,
      },
    },
  );
  const response = await request.json();
  if (response.status === "success") {
    // Route is /[locale]/waitlist — revalidate the dynamic page for every locale.
    revalidatePath("/[locale]/waitlist", "page");
    return { status: "success" as const };
  }
  return { error: response.message ?? "Failed to invite all users" };
}
