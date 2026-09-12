"use client";

import { useSession } from "next-auth/react";

/**
 * Whether the signed-in admin holds a permission.
 *
 * A CONVENIENCE, NOT A CONTROL. The API is what enforces every one of these —
 * this only decides whether to draw a door that would be shut on the way
 * through. Never use it to decide something the server does not re-check.
 *
 * The keys come from the JWT, which is written at login and not refreshed
 * afterwards, so an admin granted a permission mid-session sees it only after
 * signing in again.
 */
export default function useAdminCan(permission: string): boolean {
  const { data: session } = useSession();
  return ((session?.user.effectivePermissionKeys ?? []) as string[]).includes(
    permission,
  );
}
