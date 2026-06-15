"use client";
import { useSession } from "next-auth/react";

export function usePermissions() {
  const { data: session, status } = useSession();
  const keys = (session?.user?.effectivePermissionKeys ?? []) as string[];
  const isLoading = status === "loading";

  function can(permission: string): boolean {
    return keys.includes(permission);
  }

  return { can, isLoading, role: session?.user?.role ?? 0 };
}
