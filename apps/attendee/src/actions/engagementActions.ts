"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type ShareChannel = "copy" | "whatsapp" | "x" | "linkedin" | "native";

/**
 * Reports a view or share for a signed-in visitor, with their token attached
 * here rather than handed to the page. The API identifies them by account, so
 * this server's address standing in for theirs doesn't matter, and it can leave
 * out the organisation's own members.
 *
 * Returns false when nobody is signed in: the browser then reports directly,
 * so the API sees the visitor's own address to tell anonymous visits apart.
 */
export async function recordSignedInEngagement(
  activityId: string,
  kind: "view" | "share",
  channel?: ShareChannel,
): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.accessToken) return false;
  const h = await headers();
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/activities/${activityId}/${kind}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
          origin: process.env.NEXT_PUBLIC_ATTENDEE_URL!,
          // The visitor's browser, so the API's crawler filter still applies.
          "User-Agent": h.get("user-agent") ?? "",
        },
        body: JSON.stringify(kind === "share" ? { channel } : {}),
        cache: "no-store",
      },
    );
  } catch {
    // Analytics must never get in the visitor's way.
  }
  return true;
}
