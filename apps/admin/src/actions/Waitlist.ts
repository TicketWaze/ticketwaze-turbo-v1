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
