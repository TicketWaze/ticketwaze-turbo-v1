"use client";
import { useSession } from "next-auth/react";

export function usePermission() {
  const { data: session } = useSession();
  const permissions = new Set(session?.activeOrganisation?.myPermissions ?? []);

  return {
    can: (key: string) => permissions.has(key),
    cannot: (key: string) => !permissions.has(key),
  };
}
