import {
  OrganisationPermissions,
  TPermission,
  TRole,
  Role,
} from "./organisationRole";

export function can(role: TRole, permission: TPermission): boolean {
  const mask = OrganisationPermissions[role];
  if (mask === undefined) return false;
  return (mask & permission) === permission;
}

/** Check a permission key against the myPermissions array from the session. */
export function checkPermission(permissions: string[], key: string): boolean {
  return permissions.includes(key);
}

export async function getUserRole(
  userId: string,
  organisationId: string,
): Promise<TRole | null> {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisationId}/role/${userId}`,
    );
    const membership = await request.json();

    if (membership.status === "failed") return null;

    const validRoles = Object.values(Role) as number[];
    const raw = Number(membership.role);
    if (!validRoles.includes(raw)) return null;

    return raw as TRole;
  } catch {
    return null;
  }
}
