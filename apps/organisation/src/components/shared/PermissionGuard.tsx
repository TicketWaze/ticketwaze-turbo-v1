"use client";
import { usePermission } from "@/hooks/usePermission";

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  /** Shown when the user lacks permission (only used with mode="hide"). */
  fallback?: React.ReactNode;
  /**
   * "hide"    — removes children from the DOM entirely (default).
   * "disable" — renders children wrapped in a non-interactive, dimmed container.
   */
  mode?: "hide" | "disable";
}

/**
 * Wraps any action (button, link, section) and gates it by permission key.
 *
 * @example
 * // Hide a button the user cannot use
 * <PermissionGuard permission="events.create">
 *   <button>Create Event</button>
 * </PermissionGuard>
 *
 * @example
 * // Show a grayed-out, unclickable button
 * <PermissionGuard permission="finance.export" mode="disable">
 *   <button>Export</button>
 * </PermissionGuard>
 */
export default function PermissionGuard({
  permission,
  children,
  fallback = null,
  mode = "hide",
}: PermissionGuardProps) {
  const { can } = usePermission();

  if (can(permission)) return <>{children}</>;

  if (mode === "disable") {
    return (
      <div
        className="pointer-events-none select-none opacity-40"
        aria-disabled="true"
      >
        {children}
      </div>
    );
  }

  return <>{fallback}</>;
}
